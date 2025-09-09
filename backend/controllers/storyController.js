// controllers/storyController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { Story } from "../models/story.models.js";
import { Notification } from "../models/notification.models.js"; 
import { User } from "../models/user.models.js"; 

// Create a new story
export const createStory = asyncHandler(async (req, res) => {
  const { caption, mediaUrl } = req.body;

  if (!caption && !mediaUrl) {
    res.status(400);
    throw new Error("Caption or media URL is required");
  }

  // Validate userId from token
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const story = await Story.create({
    user: userId, // Use req.user._id from auth middleware
    content: mediaUrl || caption,
  });

  // Populate for response
  await story.populate("user", "username profilePicture");

  res.status(201).json({
    success: true,
    story,
  });
});

// Get stories for the authenticated user and followed users
export const getStories = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).populate("following");

  if (!currentUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const followingIds = currentUser.following.map((follow) => follow._id);

  const stories = await Story.find({
    user: { $in: [req.user._id, ...followingIds] },
    expiresAt: { $gt: new Date() }, // Only active stories
  })
    .populate("user", "username profilePicture fullname") // Populate user details
    .populate("views", "username") // Populate views for display
    .populate("likes", "username") // Populate likes for display
    .sort({ createdAt: -1 }); // Latest first

  res.json({
    success: true,
    stories,
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