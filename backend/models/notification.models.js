import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "tag", "message", "follow_back"],
      required: true,
    },
    message: { 
      type: String,
      required: true
    },
    targetType: {
      type: String,
      enum: ["Post", "Comment", "Profile", "Message", "Story"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Add action field for follow-back capability
    action: {
      type: String,
      enum: ["follow_back", null],
      default: null
    },
    isFollowing: {
      type: Boolean,
      default: false,  // added to track follow status
    }
  },
  { timestamps: true }
);

// Compound index for querying notifications by recipient and sorting by creation time
notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);