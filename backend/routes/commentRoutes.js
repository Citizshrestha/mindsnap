// routes/commentRoutes.js
import express from "express";
import { 
  createComment, 
  getComments, 
  likeComment, 
  addReplyToComment, 
  getReplies, 
  likeReply, 
  deleteComment,
  deleteReply
} from "../controllers/commentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Comment routes
router.post("/posts/:postId/comments", protect, createComment);
router.get("/posts/:postId/comments", protect, getComments);
router.post("/posts/:postId/comments/:commentId/like", protect, likeComment);

router.post("/posts/:postId/comments/:commentId/replies", protect, addReplyToComment);
router.get("/posts/:postId/comments/:commentId/replies", protect, getReplies);
router.post("/posts/:postId/comments/:commentId/replies/:replyId/like", protect, likeReply);
router.delete("/posts/:postId/comments/:commentId", protect, deleteComment);
router.delete("/posts/:postId/comments/:commentId/replies/:replyId", protect, deleteReply);

export default router;