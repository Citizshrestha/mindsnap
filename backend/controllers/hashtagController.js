// controllers/hashtagController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { Hashtag } from "../models/hashtag.models.js";
import mongoose from "mongoose";

// Get all hashtags with post count
export const getAllHashtags = asyncHandler(async (req, res) => {
  try {
    // console.log('✅ getAllHashtags controller called');
    // console.log('🔑 User ID:', req.user?._id);
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected');
      return res.status(500).json({ 
        success: false,
        message: "Database not connected",
        error: "MongoDB connection failed" 
      });
    }

    const hashtags = await Hashtag.find({})
      .populate({
        path: "posts",
        select: "_id",
        match: { _id: { $exists: true } } // Ensure posts exist
      })
      .sort({ createdAt: -1 });

    // console.log(`✅ Found ${hashtags.length} hashtags`);

    // Filter out hashtags with no valid posts
    const validHashtags = hashtags.filter(hashtag => 
      hashtag.posts && Array.isArray(hashtag.posts) && hashtag.posts.length > 0
    );

    // console.log(`✅ ${validHashtags.length} hashtags with posts`);

    const formattedHashtags = validHashtags.map(hashtag => {
      // Ensure post IDs are unique to avoid overcounting when the same post ID
      // is present multiple times due to legacy inserts or race conditions
      const postIds = hashtag.posts.map(post => post._id.toString());
      const uniquePostIds = [...new Set(postIds)];

      return {
        _id: hashtag._id.toString(),
        name: hashtag.name,
        posts: uniquePostIds,
        postCount: uniquePostIds.length,
        createdAt: hashtag.createdAt,
        updatedAt: hashtag.updatedAt
      };
    });

    res.status(200).json(formattedHashtags);
  } catch (error) {
    console.error("❌ Error in getAllHashtags:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching hashtags",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get posts by specific hashtag
export const getPostsByHashtag = asyncHandler(async (req, res) => {
  try {
    const { name } = req.params;
    console.log('🔍 Fetching posts for hashtag:', name);
    
    const hashtag = await Hashtag.findOne({ name: name.toLowerCase() })
      .populate({
        path: "posts",
        populate: { 
          path: "user", 
          select: "username profilePicture fullname" 
        },
      });

    if (!hashtag) {
      console.log('❌ Hashtag not found:', name);
      return res.status(404).json({ 
        success: false,
        message: "Hashtag not found" 
      });
    }

    if (!hashtag.posts || hashtag.posts.length === 0) {
      console.log('ℹ️ No posts found for hashtag:', name);
      return res.status(200).json([]);
    }

    // Remove duplicate posts by ID (same post might be added multiple times if hashtag appears multiple times in same post)
    const uniquePosts = hashtag.posts.filter((post, index, self) => 
      index === self.findIndex(p => p._id.toString() === post._id.toString())
    );

    // Format posts response
    const formattedPosts = uniquePosts.map(post => ({
      _id: post._id,
      content: post.content,
      user: {
        username: post.user?.username || 'Unknown',
        profilePicture: post.user?.profilePicture || '',
        fullname: post.user?.fullname || ''
      },
      createdAt: post.createdAt,
      image: post.image
    }));

    // console.log(`✅ Found ${formattedPosts.length} posts for hashtag: ${name}`);
    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("❌ Error fetching posts by hashtag:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching posts",
      error: error.message 
    });
  }
});

// Clean up duplicate post IDs in hashtags
export const cleanupHashtagDuplicates = asyncHandler(async (req, res) => {
  try {
    // console.log('🧹 Starting hashtag cleanup...');
    
    const hashtags = await Hashtag.find({});
    let cleanedCount = 0;
    
    for (const hashtag of hashtags) {
      const originalLength = hashtag.posts.length;
      // Remove duplicates by converting to Set and back to Array
      const uniquePosts = [...new Set(hashtag.posts.map(id => id.toString()))];
      
      if (uniquePosts.length !== originalLength) {
        hashtag.posts = uniquePosts;
        await hashtag.save();
        cleanedCount++;
        // console.log(`✅ Cleaned hashtag "${hashtag.name}": ${originalLength} -> ${uniquePosts.length} posts`);
      }
    }
    
    // console.log(`🎉 Cleanup complete! Cleaned ${cleanedCount} hashtags`);
    res.status(200).json({
      success: true,
      message: `Cleanup complete! Cleaned ${cleanedCount} hashtags`,
      cleanedCount
    });
  } catch (error) {
    // console.error("❌ Error cleaning up hashtags:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up hashtags",
      error: error.message
    });
  }
});