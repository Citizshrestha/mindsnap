import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Not required for group chats
    },
    content: {
      type: String,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "file", "audio", "system"],
      default: "text",
    },
    mediaUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    edited: {
      type: Boolean,
      default: false,
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null, // For replying to specific messages
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reaction: {
          type: String, // e.g., "👍", "❤️"
          required: true,
        },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false, // For pinning important messages
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
