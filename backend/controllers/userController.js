import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";
import { emitNotification } from "../server.js"; 
import { Notification } from "../models/notification.models.js";
import { Post } from "../models/post.models.js";


// @route GET /api/users/profile
export const getUserProfileInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "fullname username email gender dob postsCount coverImage profilePicture aboutMe vibe vibeDescription followers following"
  );

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not Found"
    });
  }

  // Dynamically count posts if postsCount seems incorrect
  const actualPostsCount = await Post.countDocuments({ user: req.user._id });
  
  // Update the user's postsCount if different
  if (user.postsCount !== actualPostsCount) {
    user.postsCount = actualPostsCount;
    await user.save();
  }

  // Count only existing followers/following (exclude deleted users)
  const validFollowersCount = await User.countDocuments({ _id: { $in: user.followers } });
  const validFollowingCount = await User.countDocuments({ _id: { $in: user.following } });

  return res.status(200).json({
    success: true,
    username: user.username,
    fullname: user.fullname,
    email: user.email,
    gender: user.gender,
    dob: user.dob,
    profilePicture: user.profilePicture,
    coverImage: user.coverImage,
    aboutMe: user.aboutMe,
    vibe: user.vibe,
    vibeDescription: user.vibeDescription,
    postsCount: user.postsCount, // This should now be correct
    followers: validFollowersCount,
    following: validFollowingCount
  });
});



// @route PATCH /api/users/update-profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullname, username, gender, dob, vibe, vibeDescription, aboutMe, profilePicture, coverImage } = req.body;

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
  
  if (coverImage !== undefined && coverImage !== user.coverImage) {
    if (user.coverImage) {
      const publicId = user.coverImage.split("/").pop()?.split(".")[0];
      if (publicId) {
        try {
          const res = await cloudinary.uploader.destroy(publicId);
          if (res.result !== "ok") {
            console.warn(`Failed to delete Cloudinary cover image: ${publicId}`);
          }
        } catch (err) {
          console.error("Error deleting old cover image from Cloudinary:", err);
        }
      }
    }
    user.coverImage = coverImage;
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    gender: user.gender,
    dob: user.dob,
    vibe: user.vibe,
    vibeDescription: user.vibeDescription,
    aboutMe: user.aboutMe,
    postsCount: user.postsCount,
    profilePicture: user.profilePicture,
    coverImage: user.coverImage,
    followers: user.followers.length,
    following: user.following.length,
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
    username: { $regex: query, $options: "i" }
  }).select("username fullname profilePicture followers following");

  const results = users.map(user => ({
    _id: user._id,
    username: user.username,
    fullname: user.fullname,
    profilePicture: user.profilePicture,
    isFollowing: user.followers.includes(req.user._id),
  }));

  res.status(200).json(results);
});

// @route GET /api/users/:userId
export const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select(
    "fullname username email gender dob postsCount profilePicture coverImage aboutMe vibe vibeDescription followers following"
  );
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User Not Found!",
    });
  }

  // Dynamically count posts
  const actualPostsCount = await Post.countDocuments({ user: userId });
  if (user.postsCount !== actualPostsCount) {
    user.postsCount = actualPostsCount;
    await user.save();
  }

  // Count only existing followers/following (exclude deleted users)
  const validFollowersCount = await User.countDocuments({ _id: { $in: user.followers } });
  const validFollowingCount = await User.countDocuments({ _id: { $in: user.following } });

  return res.status(200).json({
    success: true,
    username: user.username,
    fullname: user.fullname,
    email: user.email,
    gender: user.gender,
    dob: user.dob,
    profilePicture: user.profilePicture,
    coverImage: user.coverImage,
    aboutMe: user.aboutMe,
    vibe: user.vibe,
    vibeDescription: user.vibeDescription,
    postsCount: user.postsCount, // Correct count
    followers: validFollowersCount,
    following: validFollowingCount,
    isFollowing: user.followers.includes(req.user._id),
  });
});
// @route POST /api/users/:id/follow
export const followUser = asyncHandler(async (req, res) => {
  const targetIdStr = req.params.id;
  const targetId = new mongoose.Types.ObjectId(targetIdStr);
  const userId = req.user._id;

  if (userId.toString() === targetIdStr) {
    return res.status(400).json({ success: false, message: "You cannot follow yourself" });
  }

  const targetUser = await User.findById(targetId).select("username followers following");
  const currentUser = await User.findById(userId).select("username followers following");

  if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

  const userIdObj = new mongoose.Types.ObjectId(userId);

  // Check if already following
  const isAlreadyFollowing = currentUser.following.some((id) => id.equals(targetId));
  
  if (!isAlreadyFollowing) {
    currentUser.following.push(targetId);
    targetUser.followers.push(userIdObj);

    await currentUser.save();
    await targetUser.save();

    // ✅ Create and emit follow notification with action button
    try {
      const notification = await Notification.create({
        sender: userId, // Use sender instead of senderId
        recipient: targetId,
        type: "follow",
        message: `${currentUser.username} started following you`,
        targetType: "Profile",
        targetId: userId, // The profile to view when clicking notification
        action: "follow_back" // Add action for follow back button
      });

      console.log("Follow notification created:", notification);
      
      // Populate sender info before emitting
      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "username profilePicture")
        .lean();
      
      emitNotification(targetId.toString(), populatedNotification);
      console.log("Notification emitted to:", targetId.toString());

    } catch (err) {
      console.error("Failed to create follow notification:", err);
    }

    res.status(200).json({
      success: true,
      message: "Followed successfully",
      followers: targetUser.followers.length,
      following: currentUser.following.length,
      isFollowing: true,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Already following this user",
      isFollowing: true,
    });
  }
});

// @route POST /api/users/:id/follow-back
export const followBackUser = asyncHandler(async (req, res) => {
  const targetIdStr = req.params.id;
  const targetId = new mongoose.Types.ObjectId(targetIdStr);
  const userId = req.user._id;

  if (userId.toString() === targetIdStr) {
    return res.status(400).json({ success: false, message: "You cannot follow yourself" });
  }

  const targetUser = await User.findById(targetId).select("username followers following");
  const currentUser = await User.findById(userId).select("username followers following");

  if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

  const userIdObj = new mongoose.Types.ObjectId(userId);
  const targetIdObj = new mongoose.Types.ObjectId(targetId);

  // Check if not already following
  if (!currentUser.following.some((id) => id.equals(targetId))) {
    currentUser.following.push(targetId);
    targetUser.followers.push(userIdObj);
    await currentUser.save();
    await targetUser.save();

    // ✅ Create and emit follow_back notification
    try {
      const notification = await Notification.create({
        sender: userId,
        recipient: targetId,
        type: "follow_back",
        message: `${currentUser.username} followed you back`,
        targetType: "Profile",
        targetId: userId,
      });

      console.log("Follow-back notification created:", notification);
      
      // Populate sender info before emitting
      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "username profilePicture")
        .lean();
      
      emitNotification(targetId.toString(), populatedNotification);
console.log("Follow-back notification emitted to:", targetId.toString());

      // Update existing follow notification to reflect isFollowing status
      const followNotification = await Notification.findOneAndUpdate(
        { recipient: targetId, sender: userId, type: "follow" },
        { $set: { isFollowing: true } },
        { new: true }
      ).populate("sender", "username profilePicture").lean();

      if (followNotification) {
        emitNotification(targetId.toString(), followNotification);
        console.log("Updated follow notification emitted to:", targetId.toString());
      }

    } catch (err) {
      console.error("Failed to create follow-back notification:", err);
    }
    res.status(200).json({
      success: true,
      message: "Followed back successfully",
      followers: targetUser.followers.length,
      following: currentUser.following.length,
      isFollowing: true,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Already following this user",
      isFollowing: true,
    });
  }
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
    const beforeFollowers = currentUser.followers.length;
    currentUser.followers = currentUser.followers.filter(id => id.toString() !== targetId.toString());
    targetUser.following = targetUser.following.filter(id => id.toString() !== userId.toString());

    updated = beforeFollowers !== currentUser.followers.length;
    if (!updated) {
      return res.status(400).json({ success: false, message: "This user is not your follower" });
    }
  } else {
    const beforeFollowing = currentUser.following.length;
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetId.toString());
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

// @route GET /api/users/:userId/follow-status
export const getFollowStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  const targetUser = await User.findById(userId).select("followers");
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const isFollowing = targetUser.followers.some((followerId) =>
    followerId.equals(currentUserId)
  );

  return res.status(200).json({
    success: true,
    isFollowing,
  });
});

// @route GET /api/users/:userId/connections
export const getUserConnections = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;

  if (!type || !['followers', 'following'].includes(type.toString())) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing type parameter. Use 'followers' or 'following'",
    });
  }

  const targetUserId = userId ? userId : req.user._id;

  try {
    const user = await User.findById(targetUserId)
      .populate(type, "username fullname profilePicture isOnline lastSeen")
      .select(`${type}`)
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found!",
      });
    }

    // Filter out null/deleted users from the connections list
    const validConnections = (user[type] || []).filter(connection => connection !== null && connection._id);

    return res.status(200).json({
      success: true,
      [type]: validConnections,
    });
  } catch (error) {
    console.error(`Error fetching ${type} connections:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching connections",
    });
  }
});

// @route GET /api/users/suggested-connections
export const getSuggestedConnections = asyncHandler(async (req, res) => {
  try {
    console.log('🟢 getSuggestedConnections called');
    console.log('User ID:', req.user?._id);
    
    const currentUserId = req.user._id;
    
    // Basic validation
    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found"
      });
    }

    // Use find() instead of aggregate for simplicity
    const suggestedUsers = await User.find({
      _id: { $ne: currentUserId }
    })
    .select('username fullname profilePicture vibe followers')
    .limit(5)
    .lean();

    console.log('🔵 Found users:', suggestedUsers.length);

    const formattedUsers = suggestedUsers.map(user => ({
      _id: user._id.toString(),
      username: user.username,
      fullname: user.fullname,
      profilePicture: user.profilePicture || "/default-avatar.png",
      vibe: user.vibe || '✨ New to MindSnap',
      followersCount: user.followers?.length || 0,
      isFollowing: false
    }));
    
    console.log('✅ Sending response with users:', formattedUsers.length);
    
    res.status(200).json({
      success: true,
      users: formattedUsers
    });
    
  } catch (error) {
    console.error('🔴 Error in getSuggestedConnections:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message // Include error message for debugging
    });
  }
});

// @route GET /api/users/:userId/getPendingFollowRequests
export const getPendingFollowRequests = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;

  if (!type || !["followers", "following"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing type parameter. Use 'followers' or 'following'",
    });
  }

  const targetUserId = userId ? userId : req.user._id;

  try {
    const user = await User.findById(targetUserId)
      .populate("followers", "username fullname profilePicture isOnline lastSeen")
      .populate("following", "username fullname profilePicture isOnline lastSeen")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found!",
      });
    }

    let filteredConnections = user[type] || [];

    // Show all connections without filtering for search functionality
    // This allows users to search and chat with all their followers and following

    return res.status(200).json({
      success: true,
      [type]: filteredConnections,
    });
  } catch (error) {
    console.error(`Error fetching ${type} pending requests:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching pending requests",
    });
  }
});

export const getUserPosts = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
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
    });
  }
});

// @route  GET /api/users/profile/posts
export const getMyPosts = asyncHandler(async (req, res) => {
  try {
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
    });
  }
});