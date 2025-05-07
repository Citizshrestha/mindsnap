// routes/userTagRoutes.js
import express from "express";
import { getTaggedPosts, getTaggedUsersInPost, tagUsersInPost } from "../controllers/userTagController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/user/:id/tagged-posts", protect, getTaggedPosts);
router.get("/post/:postId/tagged-users", protect, getTaggedUsersInPost);
router.post("/post/:postId/tag", protect, tagUsersInPost);

export default router;