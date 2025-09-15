import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isGroup: {
      type: Boolean,
      default: false, //  indicates if its a  group chat
    },
    groupName: {
      type: String,
      default: null, //  name for a group chats
    },
    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Admins for group chats
      },
    ],
  },

  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
