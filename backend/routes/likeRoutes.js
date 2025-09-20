import express from "express";
import { toggleLike, getLikes } from "../controllers/likeController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/toggle/:targetType/:targetId", protect, toggleLike);
router.post("/react/:targetType/:targetId/:reactionType", protect, toggleLike);
router.get("/:targetType/:targetId", protect, getLikes);

export default router;