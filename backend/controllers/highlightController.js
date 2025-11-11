import { asyncHandler } from "../utils/asyncHandler.js";
import { Highlight } from "../models/highlight.models.js";
import { Story } from "../models/story.models.js";
import mongoose from "mongoose";

// Create a new highlight
export const createHighlight = asyncHandler(async (req, res) => {
  const { name, coverStoryId, storyIds } = req.body;
  const userId = req.user._id;

  if (!name || !coverStoryId) {
    res.status(400);
    throw new Error("Highlight name and cover story are required");
  }

  // Validate cover story exists and belongs to user
  const coverStory = await Story.findOne({
    _id: coverStoryId,
    user: userId
  });

  if (!coverStory) {
    res.status(404);
    throw new Error("Cover story not found or doesn't belong to user");
  }

  // Validate all stories belong to user if provided
  if (storyIds && storyIds.length > 0) {
    const stories = await Story.find({
      _id: { $in: storyIds },
      user: userId
    });

    if (stories.length !== storyIds.length) {
      res.status(400);
      throw new Error("Some stories don't belong to user");
    }
  }

  const highlight = await Highlight.create({
    user: userId,
    name,
    coverStory: coverStoryId,
    stories: storyIds || [coverStoryId]
  });

  await highlight.populate([
    {
      path: "coverStory",
      select: "content caption createdAt"
    },
    {
      path: "stories",
      select: "content caption createdAt"
    }
  ]);

  res.status(201).json({
    success: true,
    highlight
  });
});

// Get user's highlights
export const getUserHighlights = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const targetUserId = userId || req.user._id;

  const highlights = await Highlight.find({
    user: targetUserId,
    isActive: true
  })
    .populate({
      path: "coverStory",
      select: "content caption createdAt expiresAt"
    })
    .populate({
      path: "stories",
      select: "content caption createdAt expiresAt"
    })
    .sort({ createdAt: -1 });

  // Filter out highlights where coverStory is null (deleted)
  const validHighlights = highlights.filter(h => h.coverStory !== null);

  console.log(`📸 Fetched ${highlights.length} highlights, ${validHighlights.length} valid`);
  
  res.json({
    success: true,
    highlights: validHighlights
  });
});

// Get highlight details with all stories
export const getHighlightDetails = asyncHandler(async (req, res) => {
  const { highlightId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(highlightId)) {
    res.status(400);
    throw new Error("Invalid highlight ID format");
  }

  const highlight = await Highlight.findById(highlightId)
    .populate({
      path: "user",
      select: "username profilePicture fullname"
    })
    .populate({
      path: "coverStory",
      select: "content caption createdAt views likes"
    })
    .populate({
      path: "stories",
      select: "content caption createdAt views likes"
    });

  if (!highlight) {
    res.status(404);
    throw new Error("Highlight not found");
  }

  res.json({
    success: true,
    highlight
  });
});

// Update highlight (add/remove stories or change name)
export const updateHighlight = asyncHandler(async (req, res) => {
  const { highlightId } = req.params;
  const { name, storyIds, coverStoryId } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(highlightId)) {
    res.status(400);
    throw new Error("Invalid highlight ID format");
  }

  const highlight = await Highlight.findOne({
    _id: highlightId,
    user: userId
  });

  if (!highlight) {
    res.status(404);
    throw new Error("Highlight not found or access denied");
  }

  // Update fields if provided
  if (name) highlight.name = name;
  if (coverStoryId) highlight.coverStory = coverStoryId;
  if (storyIds) highlight.stories = storyIds;

  await highlight.save();
  await highlight.populate([
    {
      path: "coverStory",
      select: "content caption createdAt"
    },
    {
      path: "stories",
      select: "content caption createdAt"
    }
  ]);

  res.json({
    success: true,
    highlight
  });
});

// Delete highlight
export const deleteHighlight = asyncHandler(async (req, res) => {
  const { highlightId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(highlightId)) {
    res.status(400);
    throw new Error("Invalid highlight ID format");
  }

  const highlight = await Highlight.findOne({
    _id: highlightId,
    user: userId
  });

  if (!highlight) {
    res.status(404);
    throw new Error("Highlight not found or access denied");
  }

  await Highlight.deleteOne({ _id: highlightId });

  res.json({
    success: true,
    message: "Highlight deleted successfully"
  });
});

// Get user's available stories for highlight creation
export const getAvailableStories = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all user's stories (including expired ones for highlights)
  const stories = await Story.find({
    user: userId
  })
    .select("content caption createdAt expiresAt")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    stories
  });
});