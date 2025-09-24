import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            url: {
                type: String,
                required: true,
                trim: true,
            },
            mediaType: {
                type: String,
                required: true,
                enum: ["image", "video", "text"],
                default: "image"
            }
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