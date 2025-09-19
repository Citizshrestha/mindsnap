import express from "express";
import { toggleLike, getLikes } from "../controllers/likeController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// routes/likeRoutes.js
router.post("/toggle/:targetType/:targetId", protect, toggleLike);
// Add a new route for specific reactions
router.post("/react/:targetType/:targetId/:reactionType", protect, toggleLike);

// Get all likes for a target
router.get("/:targetType/:targetId", protect, getLikes);

export default router;