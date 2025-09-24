import { asyncHandler } from "../utils/asyncHandler.js";
import { Message } from "../models/message.models.js";
import { Conversation } from "../models/conversation.models.js";
import { io } from "../server.js";
import { User } from "../models/user.models.js";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-very-secure-encryption-key-32-characters-long";

const encryptContent = (content) => {
  try {
    if (!content || typeof content !== 'string') return content;
    return CryptoJS.AES.encrypt(content, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    return content;
  }
};

const decryptContent = (encryptedContent) => {
  try {
    if (!encryptedContent || typeof encryptedContent !== 'string') return encryptedContent;
    if (!encryptedContent.startsWith('U2FsdGVkX1')) return encryptedContent;
    const bytes = CryptoJS.AES.decrypt(encryptedContent, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedContent;
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedContent;
  }
};

// Enhanced getUsersForChatList to include better user info
export const getUsersForChatList = asyncHandler(async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    if (!loggedInUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Get all conversations for the logged-in user with enhanced population
    const userConversations = await Conversation.find({
      participants: loggedInUserId
    })
    .populate({
      path: 'participants',
      match: { _id: { $ne: loggedInUserId } },
      select: 'fullname username profilePicture email isOnline lastSeen'
    })
    .populate({
      path: 'lastMessage',
      select: 'content messageType createdAt status sender'
    })
    .sort({ updatedAt: -1 })
    .lean();

    // Filter out conversations with no valid participants
    const validConversations = userConversations.filter(conv => 
      conv.participants && conv.participants.length > 0
    );

    // Enhanced formatting with complete user info
    const chatList = await Promise.all(validConversations.map(async (conv) => {
      const otherUser = conv.participants[0];
      
      // Get the actual latest message for this conversation
      const actualLatestMessage = await Message.findOne({
        conversation: conv._id,
        deletedFor: { $ne: loggedInUserId }
      })
      .sort({ createdAt: -1 })
      .select('content messageType createdAt status sender')
      .lean();
      
      // Count unread messages
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: loggedInUserId },
        status: { $in: ['sent', 'delivered'] }
      });

      // Enhanced last message handling
      let lastMessageContent = 'No messages yet';
      let lastMessageTime = conv.updatedAt;
      
      if (actualLatestMessage) {
        if (actualLatestMessage.messageType === 'text') {
          lastMessageContent = decryptContent(actualLatestMessage.content) || 'Message';
        } else if (actualLatestMessage.messageType === 'image') {
          lastMessageContent = '📷 Photo';
        } else if (actualLatestMessage.messageType === 'video') {
          lastMessageContent = '🎥 Video';
        } else {
          lastMessageContent = '📎 Media file';
        }
        lastMessageTime = actualLatestMessage.createdAt;
      }

      return {
        id: conv._id.toString(),
        userId: otherUser._id.toString(),
        name: otherUser.fullname || otherUser.username || 'Unknown User',
        username: otherUser.username,
        profilePicture: otherUser.profilePicture,
        lastMessage: lastMessageContent,
        time: lastMessageTime,
        unreadCount: unreadCount || 0,
        isOnline: otherUser.isOnline || false,
        lastActive: otherUser.lastSeen || new Date().toISOString(),
        userInfo: {
          _id: otherUser._id,
          username: otherUser.username,
          fullname: otherUser.fullname,
          profilePicture: otherUser.profilePicture,
          email: otherUser.email,
          isOnline: otherUser.isOnline,
          lastSeen: otherUser.lastSeen
        }
      };
    }));

    // Remove duplicates based on userId
    const uniqueChatList = chatList.filter((chat, index, self) =>
      index === self.findIndex(t => t.userId.toString() === chat.userId.toString())
    );

    res.status(200).json({
      success: true,
      data: uniqueChatList,
      count: uniqueChatList.length,
      message: "Chat list retrieved successfully"
    });

  } catch (error) {
    console.error("Error in getUsersForChatList:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, type = "text", replyTo } = req.body;
  const senderId = req.user._id;

  if (!conversationId) {
    return res.status(400).json({ message: "Conversation ID is required" });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  if (!conversation.participants.includes(senderId)) {
    return res.status(403).json({ message: "Access denied to this conversation" });
  }

  const receiverId = conversation.participants.find(
    (id) => id.toString() !== senderId.toString()
  );

  let encryptedContent = content;
  if (type === "text" && content) {
    encryptedContent = encryptContent(content);
  }

  const message = await Message.create({
    sender: senderId,
    receiver: conversation.isGroup ? null : receiverId,
    content: encryptedContent,
    messageType: type,
    conversation: conversationId,
    status: "sent",
    replyTo: replyTo || null,
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username profilePicture firstName lastName")
    .populate("receiver", "username profilePicture firstName lastName")
    .populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "username profilePicture",
      },
    })
    .lean();

  if (populatedMessage.messageType === "text") {
    populatedMessage.content = decryptContent(populatedMessage.content);
  }

  conversation.lastMessage = message._id;
  conversation.updatedAt = new Date();
  await conversation.save();

  // Emit socket event only once
  io.to(conversationId).emit("newMessage", populatedMessage);

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: populatedMessage
  });
});
export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const myId = req.user._id;

  console.log("Fetching messages for conversation:", conversationId, "User:", myId);

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ 
      success: false,
      message: "Conversation not found" 
    });
  }

  if (!conversation.participants.includes(myId)) {
    return res.status(403).json({ 
      success: false,
      message: "Access denied to this conversation" 
    });
  }

  // Get the other participant's ID
  const otherParticipantId = conversation.participants.find(
    (id) => id.toString() !== myId.toString()
  );

  console.log("Other participant ID:", otherParticipantId);

  // Fetch messages with proper population
  const messages = await Message.find({
    conversation: conversationId,
    deletedFor: { $ne: myId },
  })
    .populate({
      path: "sender",
      select: "username profilePicture fullname firstName lastName",
      model: "User"
    })
    .populate({
      path: "receiver", 
      select: "username profilePicture fullname firstName lastName",
      model: "User"
    })
    .populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "username profilePicture",
        model: "User"
      },
    })
    .sort({ createdAt: 1 })
    .lean();

  console.log("Found", messages.length, "messages");

  // Also get complete user info for the other participant
  const otherUser = await User.findById(otherParticipantId)
    .select("username profilePicture fullname email isOnline lastSeen")
    .lean();

  if (!otherUser) {
    return res.status(404).json({
      success: false,
      message: "Other user not found"
    });
  }

  // Decrypt messages and ensure proper user data
  const decryptedMessages = messages.map((msg) => {
    const decryptedMsg = { ...msg };
    
    // Decrypt content if it's text
    if (msg.messageType === "text") {
      decryptedMsg.content = decryptContent(msg.content);
    }
    
    // Ensure sender has proper data
    if (!decryptedMsg.sender || !decryptedMsg.sender.username) {
      console.warn("Message has invalid sender data:", msg._id);
      decryptedMsg.sender = {
        _id: msg.sender?._id || myId,
        username: "Unknown User",
        profilePicture: null,
        fullname: "Unknown User"
      };
    }
    
    // Ensure receiver has proper data (use the otherUser info)
    decryptedMsg.receiver = {
      _id: otherParticipantId,
      username: otherUser.username,
      profilePicture: otherUser.profilePicture,
      fullname: otherUser.fullname
    };

    return decryptedMsg;
  });

  res.status(200).json({
    success: true,
    messages: decryptedMessages,
    otherUser: {
      _id: otherUser._id,
      username: otherUser.username,
      fullname: otherUser.fullname,
      profilePicture: otherUser.profilePicture,
      email: otherUser.email,
      isOnline: otherUser.isOnline,
      lastSeen: otherUser.lastSeen
    },
    conversationId: conversationId
  });
});

export const markConversationAsSeen = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    return res.status(403).json({ 
      success: false,
      message: "Access denied" 
    });
  }

  // Find messages that need to be marked as seen
  const messagesToUpdate = await Message.find({
    conversation: conversationId,
    sender: { $ne: userId },
    status: { $in: ["sent", "delivered"] }, // Only update messages that haven't been seen yet
  });

  if (messagesToUpdate.length > 0) {
    // Update message statuses to "seen"
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        status: { $in: ["sent", "delivered"] },
      },
      { $set: { status: "seen" } }
    );

    // Emit status updates via socket
    messagesToUpdate.forEach((msg) => {
      io.to(conversationId).emit("messageStatusUpdate", {
        messageId: msg._id,
        status: "seen",
      });
    });
  }

  res.status(200).json({ 
    success: true,
    message: "Conversation marked as seen",
    updatedCount: messagesToUpdate.length
  });
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



// Media upload endpoint with Cloudinary
export const uploadMedia = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      message: "No file uploaded" 
    });
  }

  if (!conversationId) {
    return res.status(400).json({ 
      success: false,
      message: "Conversation ID is required" 
    });
  }

  try {
    // Verify conversation exists and user has access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied to this conversation" 
      });
    }

    // Get receiver ID
    const receiverId = conversation.participants.find(
      (id) => id.toString() !== userId.toString()
    );

    // Get user info for folder structure
    const user = await User.findById(userId).select('username');
    const username = user?.username || 'unknown';

    // Import cloudinary dynamically
    const { default: cloudinary } = await import('../config/cloudinary.js');

    // Upload to Cloudinary with folder structure: mindsnap/messages/username
    console.log("Uploading media to Cloudinary for user:", username);
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `mindsnap/messages/${username}`,
      resource_type: "auto", // Automatically detect file type (image/video)
      public_id: `${Date.now()}_${req.file.originalname.split('.')[0]}`,
    });

    const mediaUrl = result.secure_url;
    console.log("✅ Media uploaded to Cloudinary:", mediaUrl);

    // Determine message type
    const messageType = req.file.mimetype.startsWith('image/') ? 'image' : 
                       req.file.mimetype.startsWith('video/') ? 'video' : 'file';

    // Create media message
    const message = await Message.create({
      sender: userId,
      receiver: receiverId,
      content: mediaUrl, // Store Cloudinary URL directly (no encryption for media URLs)
      messageType: messageType,
      conversation: conversationId,
      status: "sent",
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      cloudinaryPublicId: result.public_id, // Store for potential deletion later
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture firstName lastName fullname")
      .populate("receiver", "username profilePicture firstName lastName fullname")
      .lean();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Clean up local file
    try {
      const fs = await import('fs');
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn("Failed to clean up local file:", cleanupError.message);
    }

    // Emit socket event
    io.to(conversationId).emit("newMessage", populatedMessage);

    res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      data: populatedMessage
    });

  } catch (error) {
    console.error("❌ Media upload error:", error);
    
    // Clean up local file on error
    try {
      const fs = await import('fs');
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.warn("Failed to clean up local file after error:", cleanupError.message);
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload media",
      error: error.message
    });
  }
});

// Updated deleteMessage controller with proper response format
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ 
      success: false,
      message: "Message not found" 
    });
  }

  // Check if user is authorized to delete (sender or receiver)
  if (message.sender.toString() !== userId.toString() && 
      message.receiver.toString() !== userId.toString()) {
    return res.status(403).json({ 
      success: false,
      message: "Not authorized to delete this message" 
    });
  }

  // Soft delete: add user to deletedFor array
  if (!message.deletedFor.includes(userId)) {
    message.deletedFor.push(userId);
    await message.save();
  }

  // If both sender and receiver have deleted, hard delete
  const participants = [message.sender.toString(), message.receiver.toString()];
  const shouldHardDelete = participants.every(participant => 
    message.deletedFor.includes(participant)
  );

  let deletedMessage;
  if (shouldHardDelete) {
    deletedMessage = await Message.findByIdAndDelete(messageId);
  } else {
    deletedMessage = message;
  }

  // Notify other participants via socket
  io.to(message.conversation.toString()).emit("messageDeleted", { 
    messageId,
    deletedFor: message.deletedFor,
    hardDelete: shouldHardDelete
  });

  res.status(200).json({ 
    success: true,
    message: "Message deleted successfully",
    hardDelete: shouldHardDelete
  });
});

// Updated editMessage controller with proper response format
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content) {
    return res.status(400).json({ 
      success: false,
      message: "Message content is required" 
    });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ 
      success: false,
      message: "Message not found" 
    });
  }

  // Check if user is authorized to edit (only sender can edit)
  if (message.sender.toString() !== userId.toString()) {
    return res.status(403).json({ 
      success: false,
      message: "Not authorized to edit this message" 
    });
  }

  // Check if message can be edited (within time limit, etc.)
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  const editTimeLimit = 15 * 60 * 1000; // 15 minutes

  if (messageAge > editTimeLimit) {
    return res.status(400).json({ 
      success: false,
      message: "Message can only be edited within 15 minutes" 
    });
  }

  // Encrypt content if it's text
  let encryptedContent = content;
  if (message.messageType === "text") {
    encryptedContent = encryptContent(content);
  }

  // Update message
  message.content = encryptedContent;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  // Populate and prepare response
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username profilePicture firstName lastName")
    .populate("receiver", "username profilePicture firstName lastName")
    .lean();

  // Decrypt for response
  if (populatedMessage.messageType === "text") {
    populatedMessage.content = decryptContent(populatedMessage.content);
  }

  // Notify other participants via socket
  io.to(message.conversation.toString()).emit("messageEdited", {
    messageId: message._id,
    content: populatedMessage.content,
    isEdited: true,
    editedAt: message.editedAt
  });

  res.status(200).json({
    success: true,
    message: "Message updated successfully",
    data: populatedMessage
  });
});