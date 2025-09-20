import { asyncHandler } from "../utils/asyncHandler.js";
import {Like} from "../models/like.models.js";
import {Post} from "../models/post.models.js";
import {Comment} from "../models/comment.models.js";
import {Story} from "../models/story.models.js";
import {Notification} from "../models/notification.models.js";

export const toggleLike = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;
  const { reactionType = "like" } = req.body;
  const userId = req.user._id;

  if (!["Post", "Comment", "Story", "EmbeddedComment"].includes(targetType)) {
    res.status(400);
    throw new Error("Invalid target type");
  }

  // Verify the target exists
  let target;
  let ownerId;
  
  if (targetType === "Post") {
    target = await Post.findById(targetId).populate("user", "username");
    if (!target) throw new Error("Post not found");
    ownerId = target.user._id;
  } else if (targetType === "Comment") {
    target = await Comment.findById(targetId).populate("user", "username");
    if (!target) throw new Error("Comment not found");
    ownerId = target.user._id;
  } else if (targetType === "Story") {
    target = await Story.findById(targetId).populate("user", "username");
    if (!target) throw new Error("Story not found");
    ownerId = target.user._id;
  } else if (targetType === "EmbeddedComment") {
    const { postId } = req.params;
    if (!postId) {
      res.status(400);
      throw new Error("postId is required for EmbeddedComment");
    }
    const post = await Post.findById(postId);
    if (!post) throw new Error("Post not found");
    target = post.comments.id(targetId);
    if (!target) throw new Error("Embedded Comment not found");
    ownerId = target.user;
  }

  const existingLike = await Like.findOne({ 
    user: userId, 
    targetType, 
    targetId 
  });
  
  if (existingLike) {
    // If the same reaction type, remove the like
    if (existingLike.reactionType === reactionType) {
      await Like.findByIdAndDelete(existingLike._id);
      
      // Update post likes count
      if (targetType === "Post") {
        await Post.findByIdAndUpdate(targetId, {
          $pull: { likes: existingLike._id }
        });
      }
      
      res.json({ 
        message: "Unliked successfully",
        liked: false
      });
    } else {
      // If different reaction type, update the reaction
      existingLike.reactionType = reactionType;
      await existingLike.save();
      
      res.json({ 
        message: "Reaction updated successfully",
        liked: true,
        reactionType
      });
    }
  } else {
    const likeData = { 
      user: userId, 
      targetType, 
      targetId,
      reactionType
    };
    
    const newLike = await Like.create(likeData);
    
    // Update post likes count
    if (targetType === "Post") {
      await Post.findByIdAndUpdate(targetId, {
        $push: { likes: newLike._id }
      });
    }
    
    // Create notification (skip if user is liking their own content)
   if (ownerId.toString() !== userId.toString()) {
  try {
    // Map reaction types to proper display names
    const reactionDisplayNames = {
      like: "liked",
      love: "loved",
      haha: "laughed at",
      wow: "was amazed by",
      sad: "felt sad about",
      angry: "got angry at"
    };

    const notification = await Notification.create({
      recipient: ownerId,
      sender: userId,
      type: "like",
      targetType,
      targetId: { _id: targetId },
      read: false,
      message: `${req.user.username} ${reactionDisplayNames[reactionType] || 'reacted to'} your ${targetType.toLowerCase()}`
    });
    
    // Populate the notification for socket emission
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "username profilePicture")
      .populate("recipient", "username");
    
    // Emit socket event for real-time notification
    req.app.get("io").to(`user_${ownerId}`).emit("newNotification", populatedNotification);
    
  } catch (notificationError) {
    console.error("Notification creation error:", notificationError);
    // Continue even if notification fails
  }
}
    
    res.json({ 
      message: "Liked successfully",
      liked: true,
      reactionType
    });
  }
});

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