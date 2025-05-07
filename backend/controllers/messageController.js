// controllers/messageController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import {Message} from "../models/message.models.js";
import {Conversation} from "../models/conversation.models.js";
import {Notification} from "../models/notification.models.js"; // Assuming this will be added

// Send a message
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content } = req.body;

  if (!conversationId || !content) {
    res.status(400);
    throw new Error("Conversation ID and content are required");
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: req.body.receiverId, // Optional, based on conversation participants
    content,
    conversation: conversationId,
  });

  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    conversation.lastMessage = message._id;
    await conversation.save();

    // Notify the other participant
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    if (otherParticipant) {
      await Notification.create({
        recipient: otherParticipant,
        sender: req.user._id,
        type: "message",
        targetType: "Message",
        targetId: message._id,
      });
    }
  }

  res.status(201).json(message);
});

// Get messages for a conversation
export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversation: conversationId }).populate(
    "sender",
    "username profilePicture"
  );

  res.json(messages);
});