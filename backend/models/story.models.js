import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            trim: true,
        },
        caption: {
            type: String,
            trim: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => Date.now() + 1 * 24 * 60 * 60 * 1000, // Expires in 24 hours
            index: { expires: 0 },
        },
        views: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ]
    },
    { timestamps: true }
);

export const Story = mongoose.model("Story", storySchema);