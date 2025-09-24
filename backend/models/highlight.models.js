import mongoose from "mongoose";

const highlightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 20
    },
    coverStory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true
    },
    stories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story"
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index for efficient queries
highlightSchema.index({ user: 1, isActive: 1 });

export const Highlight = mongoose.model("Highlight", highlightSchema);