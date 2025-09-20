// routes/commentRoutes.js
import express from "express";
import { createComment, getComments, likeComment } from "../controllers/commentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/posts/:postId/comments", protect, createComment);
router.get("/posts/:postId/comments", protect, getComments);
router.post("/posts/:postId/comments/:commentId/like", protect, likeComment);

export default router;