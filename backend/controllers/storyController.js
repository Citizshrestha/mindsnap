import { asyncHandler } from "../utils/asyncHandler.js";
import { Story } from "../models/story.models.js";
import { Notification } from "../models/notification.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose"; 

export const createStory = asyncHandler(async (req, res) => {
  const { caption, content } = req.body;
  const userId = req.user._id;

  if (!content) {
    res.status(400);
    throw new Error("Content is required");
  }

  const story = await Story.create({
    user: userId,
    caption,
    content,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Frontend will hide after 24 hours, but stays in DB
  });

  await story.populate("user", "username profilePicture");

  res.status(201).json({ 
    success: true, 
    story: {
      _id: story._id,
      user: {
        _id: story.user._id,
        username: story.user.username,
        profilePicture: story.user.profilePicture
      },
      caption: story.caption,
      content: story.content,
      expiresAt: story.expiresAt,
      createdAt: story.createdAt, 
      views: story.views,
      likes: story.likes
    }
  });
});

export const getStories = asyncHandler(async (req, res) => {
  console.log("User ID from token:", req.user._id);
  const currentUser = await User.findById(req.user._id).select("following");
  const userIds = [req.user._id, ...(currentUser?.following || [])];
  console.log("User IDs for query:", userIds);

  const stories = await Story.find({
    user: { $in: userIds },
    expiresAt: { $gt: new Date() },
  })
    .populate("user", "username profilePicture")
    .sort({ createdAt: -1 });

  console.log("Raw stories from DB:", stories);
  
  const formattedStories = stories.map(story => ({
    _id: story._id,
    user: { 
      username: story.user.username, 
      profilePicture: story.user.profilePicture,
      isCurrentUser: story.user._id.toString() === req.user._id.toString()
    },
    caption: story.caption,
    content: story.content,
    expiresAt: story.expiresAt,
    createdAt: story.createdAt, // Make sure this is included
    views: story.views,
    likes: story.likes,
  }));

  console.log("Formatted stories for response:", formattedStories);
  res.json({ stories: formattedStories });
});

export const deleteStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;

  // Validate storyId format
  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    res.status(400);
    throw new Error("Invalid story ID format");
  }

  const story = await Story.findById(storyId);
  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  // Check if the authenticated user is the owner
  if (story.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this story");
  }

  await Story.deleteOne({ _id: storyId });

  res.json({
    success: true,
    message: "Story deleted successfully",
  });
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