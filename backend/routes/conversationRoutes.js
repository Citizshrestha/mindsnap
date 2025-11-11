import express from "express";
import { createOrGetConversation, getConversationById, getConversations } from "../controllers/conversationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrGetConversation);
router.get("/", protect, getConversations);
router.get("/:conversationId", protect, getConversationById);

export default router;