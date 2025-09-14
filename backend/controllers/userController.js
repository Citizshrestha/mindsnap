import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose"; // Added: Import mongoose for ObjectId conversion

// @route GET /api/users/profile
export const getUserProfileInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "fullname username postsCount profilePicture aboutMe vibe vibeDescription followers following"
  );

  if (!user) {
    res.status(400).json({
      success: false,
      message: "User not Found"
    });
  }

  return res.status(200).json({
    success: true,
    username: user.username,
    fullname: user.fullname,
    profilePicture: user.profilePicture,
    aboutMe: user.aboutMe,
    vibe: user.vibe,
    vibeDescription: user.vibeDescription,
    postsCount: user.postsCount,
    followers: user.followers.length,
    following: user.following.length
  });
});

// @route PATCH /api/users/update-profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  
  const { fullname, username, gender, dob, vibe, vibeDescription, aboutMe, profilePicture } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (fullname !== undefined) user.fullname = fullname;
  if (username !== undefined) user.username = username;
  if (gender !== undefined) user.gender = gender;
  if (dob !== undefined) user.dob = dob;
  if (vibe !== undefined) user.vibe = vibe;
  if (vibeDescription !== undefined) user.vibeDescription = vibeDescription;
  if (aboutMe !== undefined) user.aboutMe = aboutMe;

  // Only update profile picture if a new one is provided
  if (profilePicture !== undefined && profilePicture !== user.profilePicture) {
    if (user.profilePicture) {
      const publicId = user.profilePicture.split("/").pop()?.split(".")[0];
      if (publicId) {
        try {
          const res = await cloudinary.uploader.destroy(publicId);
          if (res.result !== 'ok') {
            console.warn(`Failed to delete Cloudinary image: ${publicId}`);
          }
        } catch (err) {
          console.error("Error deleting old image from Cloudinary:", err);
        }
      }
    }
    user.profilePicture = profilePicture;
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
    fullname: user.fullname,
    username: user.username,
    gender: user.gender,
    dob: user.dob,
    vibe: user.vibe,
    vibeDescription: user.vibeDescription,
    aboutMe: user.aboutMe,
    postsCount: user.postsCount,
    profilePicture: user.profilePicture,
  });
});

// @route GET /api/users/generateSignature
export const generateSignature = asyncHandler(async (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET,
  );

  return res.status(200).json({
    signature,
    timestamp,
    cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.VITE_CLOUDINARY_API_KEY
  });
});

// @route GET /api/users/search?query=...
export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);

  const users = await User.find({
    username: { $regex: query, $options: "i" } // case-insensitive
  }).select("username fullname profilePicture followers following");

  // Map to indicate if current user is following each result
  const results = users.map(user => {
    return {
      _id: user._id,
      username: user.username,
      fullname: user.fullname,
      profilePicture: user.profilePicture,
      isFollowing: user.followers.includes(req.user._id),
    };
  });

  res.status(200).json(results);
});

// @route GET /api/users/:userId
export const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select(
    "fullname username postsCount profilePicture aboutMe vibe vibeDescription followers following"
  );
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User Not Found!",
    });
  }

  return res.status(200).json({
    success: true,
    username: user.username,
    fullname: user.fullname,
    profilePicture: user.profilePicture,
    aboutMe: user.aboutMe,
    vibe: user.vibe,
    vibeDescription: user.vibeDescription,
    postsCount: user.postsCount,
    followers: user.followers.length,
    following: user.following.length,
    isFollowing: user.followers.includes(req.user._id), // Indicate if current user follows this user
  });
});

// @route POST /api/users/:id/follow
export const followUser = asyncHandler(async (req, res) => {
  const targetIdStr = req.params.id; // Added: Extract string ID from params
  const targetId = new mongoose.Types.ObjectId(targetIdStr); // Added: Convert to ObjectId for consistency
  const userId = req.user._id;

  if (userId.toString() === targetIdStr) {
    return res.status(400).json({ success: false, message: "You cannot follow yourself" });
  }

  const targetUser = await User.findById(targetId);
  const currentUser = await User.findById(userId);

  if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

  // Added: Convert userId to ObjectId for includes check
  const userIdObj = new mongoose.Types.ObjectId(userId);
  if (!currentUser.following.some(id => id.equals(targetId))) { // Added: Use equals() for ObjectId comparison instead of includes with string
    currentUser.following.push(targetId);
    targetUser.followers.push(userIdObj);

    await currentUser.save();
    await targetUser.save();
  }

  res.status(200).json({ 
    success: true, 
    message: "Followed successfully",
    followers: targetUser.followers.length,
    following: currentUser.following.length,
    isFollowing: true,
  });
});

// @route POST /api/users/:id/unfollow
export const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user._id;
  const { action } = req.body;

  const targetUser = await User.findById(targetId);
  const currentUser = await User.findById(userId);

  if (!targetUser || !currentUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  let updated = false;

  if (action === "removeFollower") {
    // Remove targetUser from currentUser's followers
    const beforeFollowers = currentUser.followers.length;
    currentUser.followers = currentUser.followers.filter(id => id.toString() !== targetId.toString());
    // Also remove currentUser from targetUser's following
    targetUser.following = targetUser.following.filter(id => id.toString() !== userId.toString());

    updated = beforeFollowers !== currentUser.followers.length;
    if (!updated) {
      return res.status(400).json({ success: false, message: "This user is not your follower" });
    }
  } else {
    // Unfollow: remove target from currentUser's following
    const beforeFollowing = currentUser.following.length;
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetId.toString());
    // Remove currentUser from targetUser's followers
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId.toString());

    updated = beforeFollowing !== currentUser.following.length;
    if (!updated) {
      return res.status(400).json({ success: false, message: "You are not following this user" });
    }
  }

  await currentUser.save({ validateBeforeSave: false });
  await targetUser.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: action === "removeFollower" ? "Removed follower successfully" : "Unfollowed successfully",
    followers: targetUser.followers.length,
    following: currentUser.following.length,
    isFollowing: false,
  });
});


// @route GET /api/users/:userId/connections
export const getUserConnections = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query; // 'followers' or 'following'

  if (!type || !['followers', 'following'].includes(type.toString())) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing type parameter. Use 'followers' or 'following'",
    });
  }

  // Use logged-in user's ID if no userId is provided (e.g., for /api/users/profile/connections)
  const targetUserId = userId ? userId : req.user._id;

  try {
    const user = await User.findById(targetUserId)
      .populate(type, "username fullname profilePicture")
      .select(`${type}`)
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found!",
      });
    }

    // Ensure the response matches the expected structure
    return res.status(200).json({
      success: true,
      [type]: user[type] || [],
    });
  } catch (error) {
    console.error(`Error fetching ${type} connections:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching connections",
    });
  }
});