import { asyncHandler } from "../utils/asyncHandler.js";
import { Conversation } from "../models/conversation.models.js";

export const createOrGetConversation = asyncHandler(async (req, res) => {
  const { participantIds, isGroup, groupName } = req.body;
  const senderId = req.user._id;

  if (!participantIds || !Array.isArray(participantIds)) {
    res.status(400);
    throw new Error("Participant IDs are required as an array");
  }

  const participants = [...new Set([senderId, ...participantIds])];

  if (!isGroup) {
    const existingConversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: participants, $size: 2 },
    }).populate("lastMessage");
    if (existingConversation) {
      return res.status(200).json({ success: true, conversation: existingConversation });
    }
  }

  const conversation = await Conversation.create({
    participants,
    isGroup: isGroup || false,
    groupName: isGroup ? groupName : null,
    groupAdmins: isGroup ? [senderId] : [],
    updatedAt: new Date(),
  });

  res.status(201).json({ success: true, conversation });
});

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  }).populate("lastMessage");

  res.json({ success: true, conversations });
});