import { asyncHandler } from "../utils/asyncHandler.js";
import { Conversation } from "../models/conversation.models.js";
import { Message } from "../models/message.models.js";
import CryptoJS from "crypto-js";
// import mongoose from "mongoose";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-very-secure-encryption-key-32-characters-long";

const decryptContent = (encryptedContent) => {
  try {
    if (!encryptedContent) return encryptedContent;
    const bytes = CryptoJS.AES.decrypt(encryptedContent, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedContent;
  } catch (error) {
    return encryptedContent;
  }
};

export const createOrGetConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  if (!participantId) {
    return res.status(400).json({ success: false, message: "Participant ID is required" });
  }

  const participants = [req.user._id, participantId].sort((a, b) => a.localeCompare(b));

  let conversation = await Conversation.findOne({
    participants,
    isGroup: false,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants,
      isGroup: false,
    });
  }

  res.status(200).json({ success: true, conversation });
});

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate("participants", "username profilePicture")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender receiver",
        select: "username profilePicture",
      },
    })
    .sort({ updatedAt: -1 })
    .lean();

  const formatted = await Promise.all(
    conversations.map(async (conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );

      const lastMessageContent = conv.lastMessage
        ? decryptContent(conv.lastMessage.content)
        : "";

      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user._id },
        status: { $ne: "seen" },
      });

      return {
        id: conv._id.toString(),
        receiverId: otherParticipant ? otherParticipant._id.toString() : "",
        name: otherParticipant ? otherParticipant.username || "Unknown User" : "Unknown User",
        image: otherParticipant ? otherParticipant.profilePicture || `https://i.pravatar.cc/40?u=${otherParticipant._id}` : "",
        lastMessage: lastMessageContent,
        time: conv.lastMessage ? conv.lastMessage.createdAt : conv.createdAt,
        unreadCount,
      };
    })
  );

  res.status(200).json(formatted);
});

export const getConversationById = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findById(conversationId)
    .populate("participants", "username profilePicture firstName lastName")
    .lean();

  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  if (!conversation.participants.some((p) => p._id.toString() === userId.toString())) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }


  res.status(200).json({ success: true, conversation });
});