// controllers/userController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import cloudinary from "../config/cloudinary.js";

// @route GET /api/users/profile
export const getUserProfileInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "fullname username postsCount profilePicture aboutMe vibe vibeDescription"
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
    postsCount: user.postsCount
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
  const targetId = req.params.id;
  const userId = req.user._id;

  if (userId.toString() === targetId) {
    return res.status(400).json({ success: false, message: "You cannot follow yourself" });
  }

  const targetUser = await User.findById(targetId);
  const currentUser = await User.findById(userId);

  if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

  if (!currentUser.following.includes(targetId)) {
    currentUser.following.push(targetId);
    targetUser.followers.push(userId);

    await currentUser.save();
    await targetUser.save();
  }

  res.status(200).json({ success: true, message: "Followed successfully" });
});

// @route POST /api/users/:id/unfollow
export const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user._id;

  const targetUser = await User.findById(targetId);
  const currentUser = await User.findById(userId);

  if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

  currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
  targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

  await currentUser.save();
  await targetUser.save();

  res.status(200).json({ success: true, message: "Unfollowed successfully" });
});