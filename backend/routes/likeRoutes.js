import express from "express";
import { toggleLike, getLikes } from "../controllers/likeController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Toggle like/unlike for a target (Post or Comment)
router.post("/toggle/:targetType/:targetId", protect, toggleLike);
// Get all likes for a target
router.get("/:targetType/:targetId", protect, getLikes);

export default router;