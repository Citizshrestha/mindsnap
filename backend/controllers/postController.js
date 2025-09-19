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

    for (const name of hashtagNames) {
      let hashtag = await Hashtag.findOne({ name });
      if (!hashtag) {
        hashtag = await Hashtag.create({ name, posts: [post._id] });
      } else {
        hashtag.posts.push(post._id);
        await hashtag.save();
      }
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

// @route  GET /api/posts/getPosts
export const getPosts = asyncHandler(async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePicture fullname")
      .populate({
        path: "likes",
        match: { user: req.user._id }, // Only get likes from the current user
        select: "reactionType"
      })
      .sort({ createdAt: -1 });
    
    // Add userReaction to each post
    const postsWithReactions = posts.map(post => {
      const userReaction = post.likes.length > 0 ? post.likes[0].reactionType : null;
      return {
        ...post.toObject(),
        userReaction
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

// controllers/userController.js

// @route  GET /api/users/profile/posts
export const getMyPosts = asyncHandler(async (req, res) => {
  try {
    // Make sure to import the Post model
    const posts = await Post.find({ user: req.user._id })
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
      error: error.message // Add error details for debugging
    });
  }
});

// @route  GET /api/users/:userId/posts
export const getUserPosts = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate if userId is provided and is a valid ObjectId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Check if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID format"
      });
    }

    const posts = await Post.find({ user: userId })
      .populate("user", "username profilePicture fullname")
      .populate({
        path: "likes",
        match: { user: req.user._id }, // Get current user's reactions
        select: "reactionType"
      })
      .sort({ createdAt: -1 });
    
    // Add userReaction to each post
    const postsWithReactions = posts.map(post => {
      const userReaction = post.likes.length > 0 ? post.likes[0].reactionType : null;
      return {
        ...post.toObject(),
        userReaction
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