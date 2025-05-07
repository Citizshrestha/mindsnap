// controllers/storyController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import {Story} from "../models/story.models.js";
import {Notification} from "../models/notification.models.js"; // Assuming this will be added

// Create a new story
export const createStory = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const story = await Story.create({
    user: req.user._id,
    content,
  });

  res.status(201).json(story);
});

// Get stories for the authenticated user and followed users
export const getStories = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("following");
  const followingIds = user.following.map((id) => id.toString());

  const stories = await Story.find({
    user: { $in: [req.user._id, ...followingIds] },
    expiresAt: { $gt: new Date() },
  }).populate("user", "username profilePicture");

  res.json(stories);
});

// Like a story
export const likeStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const story = await Story.findById(storyId);

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  if (story.likes.includes(req.user._id)) {
    story.likes = story.likes.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    story.likes.push(req.user._id);
    // Notify the story owner (if not the liker)
    if (story.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: story.user,
        sender: req.user._id,
        type: "like",
        targetType: "Story",
        targetId: storyId,
      });
    }
  }

  await story.save();
  res.json(story);
});