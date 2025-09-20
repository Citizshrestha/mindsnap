// controllers/commentController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.models.js";
import { Notification } from "../models/notification.models.js";

// Create a new comment on a post (embedded in Post)
export const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  console.log("=== COMMENT CREATION STARTED ===");
  console.log("Received data:", { 
    postId, 
    content,
    user: req.user ? {
      _id: req.user._id,
      username: req.user.username
    } : 'No user'
  });

  if (!content || content.trim() === "") {
    console.log("Content validation failed");
    return res.status(400).json({
      success: false,
      message: "Comment content is required",
    });
  }

  try {
    const post = await Post.findById(postId);
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
    };

    post.comments.push(comment);
    await post.save();

    console.log("Comment saved successfully");
    
    // ... rest of the code
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