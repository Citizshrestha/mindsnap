// routes/conversationRoutes.js
import express from "express";
import { createOrGetConversation, getConversations } from "../controllers/conversationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrGetConversation);
router.get("/", protect, getConversations);

export default router;