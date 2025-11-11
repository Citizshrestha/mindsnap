/*************  ✨ Windsurf Command 🌟  *************/
import mongoose from "mongoose";

const CallSchema = new mongoose.Schema({
    
   caller: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "User",
     required: true,
   },
   receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
   },
   callType: {
    type: String,
    enum: ["audio", "video"],
    required: true,
   },
   status: {
    type: String,
    enum: [
        "initiated",
        "ringing",
        "active",
        "ended",
        "missed",
        "rejected",
        "busy",
    ],
    default: "initiated",
    required: true,
   },
   // when the call start (when accepted)
   startTime: {
    type: Date,
    default: null,
   },
   // when the call end 
   endTime: {
    type: Date,
    default: null,
   },
   // duration in seconds
   duration: {
     type: Number,
     default: null,

   },
       // Who ended the call
    endedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Reason for call ending: 'completed', 'rejected', 'missed', 'cancelled', 'failed'
    endReason: {
      type: String,
      enum: ["completed", "rejected", "missed", "cancelled", "failed"],
      default: null,
    },
        // Related conversation 
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    
    // Call quality rating (optional, for future use)
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    // Any additional info
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    

}, {timestamps: true});


// Indexes for faster queries
 CallSchema.index({caller: 1, createdAt: -1}); // sorts caller order by most recent
 CallSchema.index({receiver: 1, createdAt: -1}); // sorts receiver order by most recent
 CallSchema.index({status: 1});


 // Virtual to check if call was answered
CallSchema.virtual("wasAnswered").get(function () {
  return this.status === "active" || this.status === "ended";
});

// Method to calculate duration
CallSchema.methods.calculateDuration = function () {
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000); // in seconds
  }
  return this.duration;
};

// Method to end the call
CallSchema.methods.endCall = function (endedBy, endReason = "completed") {
  this.endTime = new Date();
  this.status = "ended";
  this.endedBy = endedBy;
  this.endReason = endReason;
  this.calculateDuration();
  return this.save();
};

// Static method to get call history for a user
CallSchema.statics.getCallHistory = async function (userId, limit = 50) {
  return this.find({
    $or: [{ caller: userId }, { receiver: userId }],
  })
    .populate("caller", "username profilePicture")
    .populate("receiver", "username profilePicture")
    .sort({ createdAt: -1 })
    .limit(limit);
};


// Static method to get missed calls count
CallSchema.statics.getMissedCallsCount = async function (userId) {
  return this.countDocuments({
    receiver: userId,
    status: "missed",
  });
};


export const Call = mongoose.model("Call", CallSchema);