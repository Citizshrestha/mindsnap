// controllers/postController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.models.js";
import { Hashtag } from "../models/hashtag.models.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";

// @route  POST /api/posts/createPost
export const createPost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  let imageUrl = null;

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
    // Handle image upload to Cloudinary if file exists
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
        
        // Upload to Cloudinary with folder structure: mindsnap/posts/username
        console.log("Starting Cloudinary upload...");
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: `mindsnap/posts/${username}`,
          use_filename: true,
          unique_filename: true,
        });
        
        imageUrl = result.secure_url;
        console.log("✅ Image uploaded to Cloudinary successfully:", imageUrl);
        
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
          message: "Failed to upload image to Cloudinary",
          error: uploadError.message
        });
      }
    }

    console.log("Creating post in database...");
    const post = await Post.create({
      user: req.user._id,
      content: content.trim(),
      image: imageUrl,
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
      .sort({ createdAt: -1 });
    
    res.json(posts);
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
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      posts
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

// @route  POST /api/posts/:id/like
export const likePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reaction } = req.body;

  const post = await Post.findById(id);
  if (!post) {
    res.status(404);
    throw new Error("Post Not Found!");
  }

  // Check if the user has already liked the post
  const existingLike = await Like.findOne({ user: req.user._id, targetId: id, targetType: "Post" });
  if (existingLike) {
    res.status(400);
    throw new Error("You have already liked this post!");
  }

  // Create a new like
  const like = await Like.create({
    user: req.user._id,
    targetType: "Post",
    targetId: id,
  });

  // Add the like to the post's likes array
  post.likes.push(like._id);
  if (reaction) {
    post.reactions = post.reactions || {};
    post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;
  }
  await post.save();

  await toggleLike({ params: { targetType: "Post", targetId: id }, user: req.user });

  const updatedPost = await Post.findById(id)
    .populate("user", "username profilePicture fullname")
    .populate("likes", "user"); // Populate likes to get user references
  res.json(updatedPost);
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