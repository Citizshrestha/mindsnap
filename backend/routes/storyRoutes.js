import express from "express";
import { createStory, deleteStory, getStories, likeStory, viewStory } from "../controllers/storyController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new story
router.post("/", protect, createStory);

// Get stories for the authenticated user and followed users
router.get("/", protect, getStories);

// Like/unlike a story
router.post("/:storyId/like", protect, likeStory);

router.delete("/:storyId", protect, deleteStory);

// View a story (track view)
router.post("/:storyId/view", protect, viewStory);

export default router;