// controllers/messageController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import {Message} from "../models/message.models.js";
import {Conversation} from "../models/conversation.models.js";
import {Notification} from "../models/notification.models.js"; // Assuming this will be added
import { User } from "../models/user.models.js";
import  cloudinary  from "../config/cloudinary.js";
import {io} from "../server.js";

// get chatlist for an authenticated user
export const getUsersForChatList = asyncHandler(async(req,res) => {
  const loggedInUserId = req.user._id;
  const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");

  res.status(200).json(filteredUsers);
});

// Send a message
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content, type, receiverId } = req.body;
  const senderId = req.user._id;

  if (!conversationId || (!content && type === "text")) {
    res.status(400);
    throw new Error(
      "Conversation ID and valid content are required for text messages"
    );
  }
   
  if (!receiverId) {
    res.status(400);
    throw new Error("Receiver ID is required");
  }

  let mediaUrl = null;
  let fileName = null;
  let fileSize = null;

  if (type && content && type !== "text") {
    const uploadOptions = {folder: "chat-app/messages"};
    if (type === "image") {
      uploadOptions.resource_type = "image";
    } else if (type === "video") {
      uploadOptions.resource_type = "video";
    } else if (type === "audio") {
      uploadOptions.resource_type = "video"; // Cloudinary uses "video" for audio files
    } else if (type === "file") {
      uploadOptions.resource_type = "raw";
    }
  
  const uploadResponse = await cloudinary.uploader.upload(content, {
    folder: uploadOptions.folder,
    resource_type: uploadOptions.resource_type,
  });

    mediaUrl = uploadResponse.secure_url;
    fileName = uploadResponse.original_filename; 
    fileSize = uploadResponse.bytes; 
}
  
  // save message in mongoDB
  const message = await Message.create({
    sender: senderId,
    receiver: receiverId, 
    content: type === 'text' ? content: mediaUrl,
    messageType : type || "text",
    mediaUrl,
    fileName,
    fileSize,
    conversation: conversationId,
  });

   // Update conversation with lastMessage
  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    conversation.lastMessage = message._id;
    await conversation.save();

    // Notify the other participant
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );
    if (otherParticipant) {
      await Notification.create({
        recipient: otherParticipant,
        sender: senderId,
        type: "message",
        targetType: "Message",
        targetId: message._id,
      });
    }
  }

  io.to(conversationId).emit("newMessage",message);
  res.status(201).json(message);
});

// Get messages for a conversation
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
    deletedFor: {$ne: myId} ,
  })
  .populate(
    "sender",
    "username profilePicture"
  );

  res.json(messages);
});