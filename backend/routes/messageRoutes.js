import express from "express";
import { sendMessage, getMessages, getUsersForChatList, addReaction, pinMessage } from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send/:conversationId", protect, sendMessage);
router.get("/users", protect, getUsersForChatList);
router.get("/:conversationId", protect, getMessages);
router.post("/reaction", protect, addReaction);
router.post("/pin", protect, pinMessage);

export default router;
