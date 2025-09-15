import { asyncHandler } from "../utils/asyncHandler.js";
import { Message } from "../models/message.models.js";
import { Conversation } from "../models/conversation.models.js";
import { Notification } from "../models/notification.models.js";
import { User } from "../models/user.models.js";
import cloudinary from "../config/cloudinary.js";
import { io } from "../server.js";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-some-secretKey";

const encryptContent = (content) => {
  return CryptoJS.AES.encrypt(content, ENCRYPTION_KEY).toString();
};

const decryptContent = (encryptContent) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptContent, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptContent;
  }
};

export const getUsersForChatList = asyncHandler(async (req, res) => {
  const loggedInUserId = req.user._id;
  const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
  res.status(200).json(filteredUsers);
});

export const sendMessage = asyncHandler(async (req, res) => {
   const { conversationId } = req.params;
  const {  content, type, receiverId, replyTo } = req.body;
  const senderId = req.user._id;

  if (!conversationId) {
    res.status(400);
    throw new Error("Conversation ID is required");
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  // Validate receiverId for non-group chats
  if (!conversation.isGroup && !receiverId) {
    res.status(400);
    throw new Error("Receiver ID is required for non-group chats");
  }

  let mediaUrl = null;
  let fileName = null;
  let fileSize = null;

  // Get sender's username for Cloudinary folder
  const sender = await User.findById(senderId).select("username");
  if (!sender) {
    res.status(404);
    throw new Error("Sender not found");
  }

  // Handle media upload
  if (type && type !== "text" && content) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(content, {
        folder: `mindsnap/messages/${sender.username}`,
        resource_type: type === "image" ? "image" : type === "video" ? "video" : "auto",
      });
      mediaUrl = uploadResponse.secure_url; // Store direct Cloudinary URL
      fileName = uploadResponse.original_filename || `media-${Date.now()}`;
      fileSize = uploadResponse.bytes;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500);
      throw new Error("Failed to upload media");
    }
  }

  const encryptedContent = type === "text" ? encryptContent(content) : content;

  const message = await Message.create({
    sender: senderId,
    receiver: conversation.isGroup ? null : receiverId,
    content: encryptedContent,
    messageType: type || "text",
    mediaUrl,
    fileName,
    fileSize,
    conversation: conversationId,
    status: "sent",
    replyTo: replyTo || null,
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username profilePicture")
    .populate("replyTo", "content sender messageType")
    .lean();

  // Decrypt content for response
  populatedMessage.content = type === "text" ? decryptContent(populatedMessage.content) : populatedMessage.content;
  if (populatedMessage.replyTo && populatedMessage.replyTo.content) {
    populatedMessage.replyTo.content =
      populatedMessage.replyTo.messageType === "text"
        ? decryptContent(populatedMessage.replyTo.content)
        : populatedMessage.replyTo.content;
  }

  conversation.lastMessage = message._id;
  conversation.updatedAt = new Date();
  await conversation.save();

  // Send notifications to recipients
  const recipients = conversation.participants.filter((p) => p.toString() !== senderId.toString());
  for (const recipient of recipients) {
    await Notification.create({
      recipient,
      sender: senderId,
      type: "message",
      targetType: "Message",
      targetId: message._id,
    });
  }

  // Emit message to conversation room
  io.to(conversationId).emit("newMessage", populatedMessage);

  res.status(201).json(populatedMessage);
});

export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  if (!conversation.participants.includes(myId)) {
    return res.status(403).json({ message: "You are not part of this conversation" });
  }

  const messages = await Message.find({
    conversation: conversationId,
    deletedFor: { $ne: myId },
  })
    .populate("sender", "username profilePicture")
    .populate("replyTo", "content sender messageType")
    .lean();

  const decryptedMessages = messages.map((msg) => ({
    ...msg,
    content: msg.messageType === "text" ? decryptContent(msg.content) : msg.content,
    mediaUrl: msg.mediaUrl ? decryptContent(msg.mediaUrl) : msg.mediaUrl,
    replyTo: msg.replyTo && msg.replyTo.content
      ? {
          ...msg.replyTo,
          content: msg.replyTo.messageType === "text" ? decryptContent(msg.replyTo.content) : msg.replyTo.content,
        }
      : msg.replyTo,
  }));

  res.json(decryptedMessages);
});

export const addReaction = asyncHandler(async (req, res) => {
  const { messageId, reaction } = req.body;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  message.reactions.push({ user: userId, reaction });
  await message.save();

  const populatedMessage = await Message.findById(messageId)
    .populate("sender", "username profilePicture")
    .populate("replyTo", "content sender messageType")
    .lean();

  populatedMessage.content = message.messageType === "text" ? decryptContent(message.content) : message.content;
  if (populatedMessage.mediaUrl) {
    populatedMessage.mediaUrl = decryptContent(message.mediaUrl);
  }
  if (populatedMessage.replyTo && populatedMessage.replyTo.content) {
    populatedMessage.replyTo.content = populatedMessage.replyTo.messageType === "text" ? decryptContent(populatedMessage.replyTo.content) : populatedMessage.replyTo.content;
  }

  io.to(message.conversation.toString()).emit("newMessage", populatedMessage);
  res.status(200).json(populatedMessage);
});

export const pinMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  const conversation = await Conversation.findById(message.conversation);
  if (
    !conversation ||
    (!conversation.isGroup && !conversation.participants.includes(userId)) ||
    (conversation.isGroup && !conversation.groupAdmins.includes(userId))
  ) {
    res.status(403);
    throw new Error("Not authorized to pin messages");
  }

  message.isPinned = true;
  await message.save();

  const populatedMessage = await Message.findById(messageId)
    .populate("sender", "username profilePicture")
    .populate("replyTo", "content sender messageType")
    .lean();

  populatedMessage.content = message.messageType === "text" ? decryptContent(message.content) : message.content;
  if (populatedMessage.mediaUrl) {
    populatedMessage.mediaUrl = decryptContent(message.mediaUrl);
  }
  if (populatedMessage.replyTo && populatedMessage.replyTo.content) {
    populatedMessage.replyTo.content = populatedMessage.replyTo.messageType === "text" ? decryptContent(populatedMessage.replyTo.content) : populatedMessage.replyTo.content;
  }

  io.to(message.conversation.toString()).emit("newMessage", populatedMessage);
  res.status(200).json(populatedMessage);
});