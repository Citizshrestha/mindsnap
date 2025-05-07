// routes/storyRoutes.js
import express from "express";
import { createStory, getStories, likeStory } from "../controllers/storyController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createStory);
router.get("/", protect, getStories);
router.post("/:storyId/like", protect, likeStory);

export default router;