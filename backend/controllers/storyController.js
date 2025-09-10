import { asyncHandler } from "../utils/asyncHandler.js";
import { Story } from "../models/story.models.js";
import { Notification } from "../models/notification.models.js"; 
import { User } from "../models/user.models.js"; 

// Create a new story
export const createStory = asyncHandler(async (req, res) => {
  const { caption, content } = req.body;
  const userId = req.user._id;

  if (!caption && !content) {
    res.status(400);
    throw new Error("Caption or content is required");
  }

  const story = await Story.create({
    user: userId,
    caption,
    content,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
  });

  res.status(201).json({ success: true, story });
});

// Get stories for the authenticated user and followed users
export const getStories = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).select('following');
  const userIds = [req.user._id, ...(currentUser?.following || [])];

  const stories = await Story.find({ 
    user: { $in: userIds },
    expiresAt: { $gt: new Date() } 
  })
    .populate("user", "username fullname profilePicture")
    .sort({ createdAt: -1 });

  res.json({ stories });
});

// Like/unlike a story
export const likeStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const story = await Story.findById(storyId).populate("user");

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  const userIdStr = req.user._id.toString();
  const isLiked = story.likes.some((likeId) => likeId.toString() === userIdStr);

  if (isLiked) {
    // Unlike
    story.likes = story.likes.filter((likeId) => likeId.toString() !== userIdStr);
    // Remove notification if exists
    await Notification.findOneAndDelete({
      recipient: story.user._id,
      sender: req.user._id,
      type: "like",
      targetType: "Story",
      targetId: storyId,
    });
  } else {
    // Like
    story.likes.push(req.user._id);
    // Create notification if not the story owner
    if (story.user._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: story.user._id,
        sender: req.user._id,
        type: "like",
        targetType: "Story",
        targetId: storyId,
      });
    }
  }

  await story.save();

  // Populate likes for response
  await story.populate("likes", "username");

  res.json({
    success: true,
    story,
  });
});

// View a story (track view)
export const viewStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const story = await Story.findById(storyId).populate("user");

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  const userIdStr = req.user._id.toString();
  const hasViewed = story.views.some((viewId) => viewId.toString() === userIdStr);

  if (!hasViewed) {
    // Add to views
    story.views.push(req.user._id);
    // Create notification for story owner (if not self-view)
    if (story.user._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: story.user._id,
        sender: req.user._id,
        type: "view",
        targetType: "Story",
        targetId: storyId,
      });
    }
    await story.save();

    // Populate views for response
    await story.populate("views", "username");
  }

  res.json({
    success: true,
    story,
  });
});