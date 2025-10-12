import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getUserProfileInfo,
  updateUserProfile,
  generateSignature,
  searchUsers,
  followUser,
  unfollowUser,
  getUserById,
  getUserConnections,
  followBackUser,
  getFollowStatus,
  getPendingFollowRequests,
  getUserPosts,
  getMyPosts,
  getSuggestedConnections,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", protect, getUserProfileInfo);
router.patch("/update-profile", protect, updateUserProfile);
router.get("/signature", protect, generateSignature);

router.get("/search", protect, searchUsers); 
router.post("/:id/follow", protect, followUser);
router.post("/:id/follow-back", protect, followBackUser);
router.post("/:id/unfollow", protect, unfollowUser);
router.get("/:userId", protect, getUserById);
router.get("/profile/connections", protect, getUserConnections); 
router.get("/:userId/connections", protect, getUserConnections); 
router.get("/:userId/follow-status", protect, getFollowStatus);
router.get("/:userId/pending-follow-requests", protect, getPendingFollowRequests); 
router.get("/:userId/posts", protect, getUserPosts); 
router.get("/profile/posts", protect, getMyPosts); 
router.get("/suggested-connections", protect, getSuggestedConnections);



export default router;