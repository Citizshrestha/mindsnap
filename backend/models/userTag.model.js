import mongoose from "mongoose";

const userTagSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    taggedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


// Index for efficient querying of tags for a user or post
userTagSchema.index({taggedUser: 1, post: 1});

export const UserTag = mongoose.model("UserTag",userTagSchema)