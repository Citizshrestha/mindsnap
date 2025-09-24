// controllers/commentController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.models.js";
import { Notification } from "../models/notification.models.js";
import { User } from "../models/user.models.js";
import { io } from "../server.js";
import mongoose from "mongoose";

export const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  console.log("=== COMMENT CREATION STARTED ===");
  console.log("Received data:", {
    postId,
    content,
    user: req.user ? { _id: req.user._id, username: req.user.username } : "No user",
  });

  if (!content || content.trim() === "") {
    console.log("Content validation failed");
    return res.status(400).json({
      success: false,
      message: "Comment content is required",
    });
  }

  try {
    const post = await Post.findById(postId).populate("user");
    if (!post) {
      console.log("Post not found with ID:", postId);
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    console.log("Post found:", post._id);

    const comment = {
      user: req.user._id,
      content: content.trim(),
      createdAt: new Date(),
      likes: [],
      replies: [] // Initialize replies array
    };

    post.comments.push(comment);
    await post.save();

    // Populate the newly created comment
    const populatedPost = await Post.findById(postId)
      .populate("comments.user", "username profilePicture")
      .select("comments");
    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    // Create a notification for the post owner (if not commenting on own post)
    if (post.user._id.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.user._id,
        sender: req.user._id,
        type: "comment",
        targetType: "Post",
        targetId: { _id: postId },
        read: false,
        message: `${req.user.username} commented on your post`,
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "username profilePicture")
        .populate("recipient", "username");

      // Emit real-time notification
      io.to(`user_${post.user._id}`).emit("newNotification", populatedNotification);
      console.log(`📩 Comment notification sent to user_${post.user._id}`);
    }

    console.log("Comment saved successfully");
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error in createComment:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get all comments for a post (embedded in Post)
export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  
  console.log("Fetching comments for post:", postId);

  try {
    const post = await Post.findById(postId)
      .populate("comments.user", "username profilePicture")
      .populate("comments.replies.user", "username profilePicture")
      .select("comments");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Sort comments by createdAt descending (newest first)
    const sortedComments = post.comments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("Found comments:", sortedComments.length);
    res.json(sortedComments);
  } catch (error) {
    console.error("Error in getComments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Like or unlike a comment (embedded)
export const likeComment = asyncHandler(async (req, res) => {
  const { commentId, postId } = req.params;

  console.log("Liking comment:", commentId, "in post:", postId);

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Toggle like
    const likeIndex = comment.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      // Like the comment
      comment.likes.push(req.user._id);
    } else {
      // Unlike the comment
      comment.likes.splice(likeIndex, 1);
    }

    await post.save();

    // Return updated comment
    const updatedPost = await Post.findById(postId)
      .populate("comments.user", "username profilePicture")
      .populate("comments.likes", "username");

    const updatedComment = updatedPost.comments.id(commentId);
    
    res.json(updatedComment);
  } catch (error) {
    console.error("Error in likeComment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Add reply to a comment
export const addReplyToComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const { content } = req.body;

  console.log("=== ADDING REPLY TO COMMENT ===");
  console.log("Post ID:", postId, "Comment ID:", commentId, "Content:", content);

  if (!content || content.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Reply content is required",
    });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Add reply to the comment
    const reply = {
      user: req.user._id,
      content: content.trim(),
      createdAt: new Date(),
      likes: [],
    };

    // Initialize replies array if it doesn't exist
    if (!comment.replies) {
      comment.replies = [];
    }

    comment.replies.push(reply);
    await post.save();

    // Populate the reply with user info
    const populatedPost = await Post.findById(postId)
      .populate("comments.replies.user", "username profilePicture")
      .populate("comments.user", "username profilePicture");

    const updatedComment = populatedPost.comments.id(commentId);
    const newReply = updatedComment.replies[updatedComment.replies.length - 1];

    // Create notification for the comment owner (if not replying to own comment)
    if (comment.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: comment.user,
        sender: req.user._id,
        type: "reply",
        targetType: "Comment",
        targetId: commentId,
        read: false,
        message: `${req.user.username} replied to your comment`,
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "username profilePicture")
        .populate("recipient", "username");

      // Emit real-time notification
      io.to(`user_${comment.user}`).emit("newNotification", populatedNotification);
      console.log(`📩 Reply notification sent to user_${comment.user}`);
    }

    res.status(201).json(newReply);
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get replies for a comment
export const getReplies = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const post = await Post.findById(postId)
      .populate("comments.replies.user", "username profilePicture")
      .populate("comments.user", "username profilePicture");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    res.json(comment.replies || []);
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Like or unlike a reply
export const likeReply = asyncHandler(async (req, res) => {
  const { postId, commentId, replyId } = req.params;

  console.log("Liking reply:", replyId, "in comment:", commentId, "in post:", postId);

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    // Toggle like
    const likeIndex = reply.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      // Like the reply
      reply.likes.push(req.user._id);
    } else {
      // Unlike the reply
      reply.likes.splice(likeIndex, 1);
    }

    await post.save();

    // Return updated reply
    const updatedPost = await Post.findById(postId)
      .populate("comments.replies.user", "username profilePicture")
      .populate("comments.replies.likes", "username");

    const updatedComment = updatedPost.comments.id(commentId);
    const updatedReply = updatedComment.replies.id(replyId);
    
    res.json(updatedReply);
  } catch (error) {
    console.error("Error in likeReply:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Add this to your commentController.js
export const deleteComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;

  console.log("=== DELETING COMMENT ===");
  console.log("Post ID:", postId, "Comment ID:", commentId);

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if the user is the owner of the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // Remove the comment from the post
    post.comments.pull(commentId);
    await post.save();

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Add this to commentController.js
export const deleteReply = asyncHandler(async (req, res) => {
  const { postId, commentId, replyId } = req.params;

  console.log("=== DELETING REPLY ===");
  console.log("Post ID:", postId, "Comment ID:", commentId, "Reply ID:", replyId);

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    // Check if the user is the owner of the reply
    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this reply",
      });
    }

    // Remove the reply from the comment
    comment.replies.pull(replyId);
    await post.save();

    res.json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});