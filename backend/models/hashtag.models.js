import mongoose from "mongoose";

const hashtagSchema =  new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,   // lowercase to avoid duplicates

        },
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post",
            },
        ],
    },{timestamps: true}
)

// Index for faster search by hashtag name
hashtagSchema.index({name: 1});

export const Hashtag = mongoose.model("Hashtag", hashtagSchema);