// controllers/postController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.models.js";
import { Hashtag } from "../models/hashtag.models.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// @route  GET /api/posts/createPost
export const createPost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  let mediaUrl = null;

  console.log("=== POST CREATION STARTED ===");
  console.log("Received data:", { 
    content, 
    file: req.file ? {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file',
    user: req.user ? {
      _id: req.user._id,
      username: req.user.username
    } : 'No user'
  });

  if (!content || content.trim() === "") {
    console.log("Content validation failed");
    return res.status(400).json({
      success: false,
      message: "Content is required",
    });
  }

  try {
    // Handle media upload to Cloudinary if file exists
    if (req.file) {
      try {
        console.log("Processing file upload...");
        console.log("File details:", req.file);
        
        // Check if file exists on disk
        if (!fs.existsSync(req.file.path)) {
          console.error("File does not exist at path:", req.file.path);
          throw new Error("Uploaded file not found on server");
        }
        
        // Get username from authenticated user
        const username = req.user.username || "unknown";
        console.log("Uploading to Cloudinary for user:", username);
        
        // Determine resource type based on file mimetype
        const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
        
        // Upload to Cloudinary with folder structure: mindsnap/posts/username
        console.log("Starting Cloudinary upload...");
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: `mindsnap/posts/${username}`,
          use_filename: true,
          unique_filename: true,
          resource_type: resourceType,
        });
        
        mediaUrl = result.secure_url;
        console.log("✅ Media uploaded to Cloudinary successfully:", mediaUrl);
        
        // Delete the temporary file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("Temporary file deleted");
        }
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        console.error("Error details:", {
          message: uploadError.message,
          stack: uploadError.stack
        });
        
        // Clean up the temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("Cleaned up temporary file after error");
        }
        
        return res.status(500).json({
          success: false,
          message: "Failed to upload media to Cloudinary",
          error: uploadError.message
        });
      }
    }

    console.log("Creating post in database...");
    const post = await Post.create({
      user: req.user._id,
      content: content.trim(),
      image: mediaUrl, // Still using 'image' field in database for backward compatibility
    });

    // Process hashtags
    const hashtags = content.match(/#\w+/g) || [];
    const hashtagNames = hashtags.map((tag) => tag.replace("#", "").toLowerCase());
    console.log("Found hashtags:", hashtagNames);

    // Process hashtags - use Set to avoid duplicates in the same post
    const uniqueHashtagNames = [...new Set(hashtagNames)];
    
    for (const name of uniqueHashtagNames) {
      await Hashtag.findOneAndUpdate(
        { name },
        { $addToSet: { posts: post._id } }, // $addToSet only adds if not already present
        { upsert: true, new: true } // Create if doesn't exist
      );
    }

    const populatedPost = await Post.findById(post._id).populate(
      "user",
      "username profilePicture fullname"
    );
    
    console.log("✅ Post created successfully");
    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    console.error("❌ Post creation error:", error);
    console.error("Error stack:", error.stack);
    
    // Clean up the temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("Cleaned up temporary file after error");
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

export const getPosts = asyncHandler(async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePicture fullname")
      .populate({
        path: "likes",
        populate: {
          path: "user",
          select: "username profilePicture"
        }
      })
      .populate({
        path: "comments.user",
        select: "username profilePicture"
      })
      .sort({ createdAt: -1 });
    
    // Add userReaction to each post
    const postsWithReactions = posts.map(post => {
      // Find the current user's like/reaction
      const userLike = post.likes.find(like => 
        like.user && like.user._id.toString() === req.user._id.toString()
      );
      
      // Count reactions by type
      const reactionCounts = {};
      post.likes.forEach(like => {
        if (like.reactionType) {
          reactionCounts[like.reactionType] = (reactionCounts[like.reactionType] || 0) + 1;
        }
      });

      return {
        ...post.toObject(),
        userReaction: userLike ? userLike.reactionType : null,
        likes: post.likes.length,
        reactionCounts, // Include detailed reaction counts
        comments: post.comments.map(comment => ({
          ...comment.toObject(),
          // Add user reaction for comments too if needed
        }))
      };
    });

    res.json(postsWithReactions);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
    });
  }
});

// @route  GET /api/users/profile/posts
export const getMyPosts = asyncHandler(async (req, res) => {
  try {
    const { mediaOnly } = req.query;
    
    // Build query - only posts by the current user
    let query = { user: req.user._id };
    
    // If mediaOnly is true, only return posts with images or videos
    if (mediaOnly === 'true') {
      query.$or = [
        { image: { $exists: true, $ne: null } },
        { video: { $exists: true, $ne: null } }
      ];
    }

    const posts = await Post.find(query)
      .populate("user", "username profilePicture fullname")
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your posts",
      error: error.message
    });
  }
});
// @route  GET /api/users/:userId/posts
export const getUserPosts = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { mediaOnly } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID format"
      });
    }

    // Build query - only posts by this specific user
    let query = { user: userId };
    
    // If mediaOnly is true, only return posts with images or videos
    if (mediaOnly === 'true') {
      query.$or = [
        { image: { $exists: true, $ne: null } },
        { video: { $exists: true, $ne: null } }
      ];
    }

    const posts = await Post.find(query)
      .populate("user", "username profilePicture fullname")
      .populate({
        path: "likes",
        populate: {
          path: "user",
          select: "username profilePicture"
        }
      })
      .sort({ createdAt: -1 });
    
    const postsWithReactions = posts.map(post => {
      const userLike = post.likes.find(like => 
        like.user && like.user._id.toString() === req.user._id.toString()
      );
      
      const reactionCounts = {};
      post.likes.forEach(like => {
        if (like.reactionType) {
          reactionCounts[like.reactionType] = (reactionCounts[like.reactionType] || 0) + 1;
        }
      });

      return {
        ...post.toObject(),
        userReaction: userLike ? userLike.reactionType : null,
        likes: post.likes.length,
        reactionCounts
      };
    });

    res.json({
      success: true,
      posts: postsWithReactions
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user posts",
      error: error.message
    });
  }
});


// @route POST /api/posts/:postId/comments/:commentId/like
export const commentOnPost = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found!");
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not Found!");
  }

  await toggleLike({
    params: { targetType: "EmbeddedComment", targetId: commentId, postId: postId },
    user: req.user,
  });

  const updatedPost = await Post.findById(postId).populate(
    "user",
    "username profilePicture fullname"
  );
  res.json(updatedPost.comments.id(commentId));
});

// @route  DELETE /api/posts/:id
export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);
  if (!post) {
    res.status(404);
    throw new Error("Post Not Found!");
  }

  // Check if the user is the owner of the post
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this post");
  }

  // Delete from Cloudinary if there's an image
  if (post.image) {
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = post.image.split('/');
      const publicId = `mindsnap/posts/${req.user.username}/${urlParts[urlParts.length - 1].split('.')[0]}`;
      
      await cloudinary.uploader.destroy(publicId);
      console.log("Deleted image from Cloudinary:", publicId);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      // Continue with post deletion even if image deletion fails
    }
  }

  // Delete the post
  await Post.findByIdAndDelete(id);

  // Remove post from hashtags
  const hashtags = await Hashtag.find({ posts: id });
  for (const hashtag of hashtags) {
    hashtag.posts = hashtag.posts.filter(postId => postId.toString() !== id);
    await hashtag.save();
  }

  res.json({
    success: true,
    message: "Post deleted successfully"
  });
});