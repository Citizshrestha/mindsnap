import { asyncHandler } from "../utils/asyncHandler.js";
import {Like} from "../models/like.models.js";
import {Post} from "../models/post.models.js";
import {Comment} from "../models/comment.models.js";
import {Story} from "../models/story.models.js";
import {Notification} from "../models/notification.models.js";

// Like or unlike a target (Post, Comment, Story, or EmbeddedComment)
export const toggleLike = asyncHandler(async (req, res) => {
  const { targetType, targetId, postId } = req.params; // postId is required for EmbeddedComment
  const userId = req.user._id;

  if (!["Post", "Comment", "Story", "EmbeddedComment"].includes(targetType)) {
    res.status(400);
    throw new Error("Invalid target type");
  }

  if (targetType === "EmbeddedComment" && !postId) {
    res.status(400);
    throw new Error("postId is required for EmbeddedComment");
  }

  // Verify the target exists and get the owner for notifications
  let target;
  let ownerId;
  if (targetType === "Post") {
    target = await Post.findById(targetId);
    if (!target) throw new Error("Post not found");
    ownerId = target.user;
  } else if (targetType === "Comment") {
    target = await Comment.findById(targetId);
    if (!target) throw new Error("Comment not found");
    ownerId = target.user;
  } else if (targetType === "Story") {
    target = await Story.findById(targetId);
    if (!target) throw new Error("Story not found");
    ownerId = target.user;
  } else if (targetType === "EmbeddedComment") {
    const post = await Post.findById(postId);
    if (!post) throw new Error("Post not found");
    target = post.comments.id(targetId);
    if (!target) throw new Error("Embedded Comment not found");
    ownerId = target.user;
  }

  const existingLike = await Like.findOne({ user: userId, targetType, targetId });
  let message;
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    message = "Unliked successfully";
  } else {
    const likeData = { user: userId, targetType, targetId };
    if (targetType === "EmbeddedComment") likeData.postId = postId;
    await Like.create(likeData);
    // Notify the target owner (if not the liker)
    if (ownerId.toString() !== userId.toString()) {
      await Notification.create({
        recipient: ownerId,
        sender: userId,
        type: "like",
        targetType,
        targetId,
      });
    }
    message = "Liked successfully";
  }

  res.json({ message });
});

// Get all likes for a target
export const getLikes = asyncHandler(async (req, res) => {
  const { targetType, targetId, postId } = req.params;
  if (!["Post", "Comment", "Story", "EmbeddedComment"].includes(targetType)) {
    res.status(400);
    throw new Error("Invalid target type");
  }

  if (targetType === "EmbeddedComment" && !postId) {
    res.status(400);
    throw new Error("postId is required for EmbeddedComment");
  }

  const query = { targetType, targetId };
  if (targetType === "EmbeddedComment") query.postId = postId;

  const likes = await Like.find(query).populate("user", "username profilePicture");
  res.json(likes);
});