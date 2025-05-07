// controllers/conversationController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import {Conversation} from "../models/conversation.models.js";
// import User from "../models/user.models.js";

// Create or get a conversation between two users
export const createOrGetConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body; // ID of the other user
  const currentUserId = req.user._id;

  if (!participantId || participantId === currentUserId.toString()) {
    res.status(400);
    throw new Error("Invalid participant ID");
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, participantId] },
  }).populate("lastMessage");

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [currentUserId, participantId],
    });
  }

  res.status(200).json(conversation);
});

// Get all conversations for the authenticated user
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  }).populate("lastMessage");

  res.json(conversations);
});