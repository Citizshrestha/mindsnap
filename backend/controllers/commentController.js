import { asyncHandler } from "../utils/asyncHandler.js";
import {Post} from "../models/post.models.js";
import {Comment} from "../models/comment.models.js";
import {Notification} from "../models/notification.models.js";
import { toggleLike } from "./likeController.js";

// Create a new comment on a post (embedded in Post)
export const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentComment } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const comment = {
    user: req.user._id,
    content,
    createdAt: new Date(),
  };

  post.comments.push(comment);
  await post.save();

  // Create a notification for the post owner (if not the commenter)
  if (post.user.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: post.user,
      sender: req.user._id,
      type: "comment",
      targetType: "Post",
      targetId: postId,
    });
  }

  const newComment = post.comments[post.comments.length - 1];
  const populatedPost = await Post.findById(postId)
    .populate("user", "username profilePicture")
    .populate("comments.user", "username profilePicture");
  res.status(201).json(populatedPost.comments.id(newComment._id));
});

// Get all comments for a post (embedded in Post)
export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId).populate({
    path: "comments.user",
    select: "username profilePicture",
  });

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  res.json(post.comments);
});

// Like or unlike a comment (standalone or embedded)
export const likeComment = asyncHandler(async (req, res) => {
  const { commentId, postId } = req.params; // postId is required for EmbeddedComment

  let comment;
  let targetType;
  if (postId) {
    // Embedded comment
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error("Post not found");
    }
    comment = post.comments.id(commentId);
    if (!comment) {
      res.status(404);
      throw new Error("Embedded Comment not found");
    }
    targetType = "EmbeddedComment";
  } else {
    // Standalone comment
    comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404);
      throw new Error("Standalone Comment not found");
    }
    targetType = "Comment";
  }

  await toggleLike({
    params: { targetType, targetId: commentId, postId: postId || undefined },
    user: req.user,
  });

  if (targetType === "EmbeddedComment") {
    const updatedPost = await Post.findById(postId).populate(
      "comments.user",
      "username profilePicture"
    );
    res.json(updatedPost.comments.id(commentId));
  } else {
    const updatedComment = await Comment.findById(commentId).populate(
      "user",
      "username profilePicture"
    );
    res.json(updatedComment);
  }
});