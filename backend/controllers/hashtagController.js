// controllers/hashtagController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { Hashtag } from "../models/hashtag.models.js";

// Get all hashtags with post count
export const getAllHashtags = asyncHandler(async (req, res) => {
  try {
    const hashtags = await Hashtag.find({})
      .populate({
        path: "posts",
        select: "_id", // Only get post IDs for counting
      })
      .sort({ createdAt: -1 });

    // Format the response with postCount
    const formattedHashtags = hashtags.map(hashtag => ({
      _id: hashtag._id,
      name: hashtag.name,
      posts: hashtag.posts,
      postCount: hashtag.posts.length,
      createdAt: hashtag.createdAt,
      updatedAt: hashtag.updatedAt
    }));

    res.status(200).json(formattedHashtags);
  } catch (error) {
    console.error("Error fetching hashtags:", error);
    res.status(500).json({ 
      message: "Error fetching hashtags",
      error: error.message 
    });
  }
});

// Get posts by specific hashtag
export const getPostsByHashtag = asyncHandler(async (req, res) => {
  try {
    const { name } = req.params;
    const hashtag = await Hashtag.findOne({ name: name.toLowerCase() })
      .populate({
        path: "posts",
        populate: { 
          path: "user", 
          select: "username profilePicture" 
        },
      });

    if (!hashtag) {
      return res.status(404).json({ 
        message: "Hashtag not found" 
      });
    }

    res.status(200).json(hashtag.posts);
  } catch (error) {
    console.error("Error fetching posts by hashtag:", error);
    res.status(500).json({ 
      message: "Error fetching posts",
      error: error.message 
    });
  }
});