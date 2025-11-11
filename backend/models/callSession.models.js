import mongoose from "mongoose";

const CallSessionSchema = new mongoose.Schema(
  {
    // Reference to the Call document
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Call",
      required: true,
    },

    // Who initiated the call
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who is receiving the call
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type of call: 'video' or 'voice'
    callType: {
      type: String,
      enum: ["video", "voice"],
      required: true,
    },

    // Session status: 'ringing', 'connecting', 'active', 'ended'
    status: {
      type: String,
      enum: ["ringing", "connecting", "active", "ended"],
      default: "ringing",
    },

    // Socket ID of the caller
    callerSocketId: {
      type: String,
      required: true,
    },

    // Socket ID of the receiver
    receiverSocketId: {
      type: String,
      default: null,
    },

    // WebRTC Peer ID (for SimplePeer)
    peerId: {
      type: String,
      default: null,
    },

    // WebRTC Offer (SDP)
    offer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // WebRTC Answer (SDP)
    answer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ICE Candidates from caller
    callerIceCandidates: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    // ICE Candidates from receiver
    receiverIceCandidates: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    // When the session started
    startTime: {
      type: Date,
      default: Date.now,
    },

    // When the session ended
    endTime: {
      type: Date,
      default: null,
    },

    // Connection quality metrics (optional)
    connectionQuality: {
      latency: { type: Number, default: null },
      packetLoss: { type: Number, default: null },
      bandwidth: { type: Number, default: null },
    },

    // Is the call currently active
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
CallSessionSchema.index({ callId: 1 });
CallSessionSchema.index({ caller: 1, isActive: 1 });
CallSessionSchema.index({ receiver: 1, isActive: 1 });
CallSessionSchema.index({ status: 1, isActive: 1 });

// Method to end the session
CallSessionSchema.methods.endSession = function () {
  this.endTime = new Date();
  this.status = "ended";
  this.isActive = false;
  return this.save();
};

// Static method to get active session for a user
CallSessionSchema.statics.getActiveSession = async function (userId) {
  return this.findOne({
    $or: [{ caller: userId }, { receiver: userId }],
    isActive: true,
    status: { $in: ["ringing", "connecting", "active"] },
  })
    .populate("caller", "username profilePicture")
    .populate("receiver", "username profilePicture")
    .populate("callId");
};

// Static method to check if user is in a call
CallSessionSchema.statics.isUserInCall = async function (userId) {
  const session = await this.findOne({
    $or: [{ caller: userId }, { receiver: userId }],
    isActive: true,
    status: { $in: ["ringing", "connecting", "active"] },
  });
  return !!session;
};

// Static method to end all active sessions for a user (cleanup)
CallSessionSchema.statics.endAllUserSessions = async function (userId) {
  return this.updateMany(
    {
      $or: [{ caller: userId }, { receiver: userId }],
      isActive: true,
    },
    {
      $set: {
        endTime: new Date(),
        status: "ended",
        isActive: false,
      },
    }
  );
};

export const CallSession = mongoose.model("CallSession", CallSessionSchema);