import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["Post", "Comment", "Story", "EmbeddedComment"], // Added EmbeddedComment
      required: true,
    },
      reactionType: {
    type: String,
    default: "like", // Can be: like, love, haha, wow, sad, angry
    enum: ["like", "love", "haha", "wow", "sad", "angry"]
  },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: function () {
        return this.targetType === "EmbeddedComment";
      },
    },
  },
  { timestamps: true }
);

// Custom validation for targetId based on targetType
likeSchema.pre("save", async function (next) {
  if (this.targetType === "Post") {
    const post = await mongoose.model("Post").findById(this.targetId);
    if (!post) throw new Error("Invalid Post ID");
  } else if (this.targetType === "Comment") {
    const comment = await mongoose.model("Comment").findById(this.targetId);
    if (!comment) throw new Error("Invalid Comment ID");
  } else if (this.targetType === "Story") {
    const story = await mongoose.model("Story").findById(this.targetId);
    if (!story) throw new Error("Invalid Story ID");
  } else if (this.targetType === "EmbeddedComment") {
    const post = await mongoose.model("Post").findById(this.postId);
    if (!post || !post.comments.id(this.targetId)) throw new Error("Invalid Embedded Comment ID");
  }
  next();
});

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);