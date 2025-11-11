// routes/userTagRoutes.js
import express from "express";
import { 
  getTaggedPosts, 
  getTaggedUsersInPost, 
  tagUsersInPost,
  tagUsersInComment,
  getTaggedUsersInComment 
} from "../controllers/userTagController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/user/:id/tagged-posts", protect, getTaggedPosts);
router.get("/post/:postId/tagged-users", protect, getTaggedUsersInPost);
router.get("/comment/:commentId/tagged-users", protect, getTaggedUsersInComment);
router.post("/post/:postId/tag", protect, tagUsersInPost);
router.post("/comment/:commentId/tag", protect, tagUsersInComment);

export default router;