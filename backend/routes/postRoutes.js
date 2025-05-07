import express from "express";
import { createPost, getPosts, likePost, commentOnPost } from "../controllers/postController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/createPost", protect, createPost);
router.get("/getPosts", protect, getPosts);
router.post("/:id/like", protect, likePost);
router.post("/:postId/comments/:commentId/like", protect, commentOnPost);

export default router;