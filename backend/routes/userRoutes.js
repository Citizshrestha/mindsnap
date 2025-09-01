import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getUserProfileInfo, updateUserProfile, generateSignature, searchUsers, followUser, unfollowUser, getUserById } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", protect, getUserProfileInfo);
router.patch("/update-profile", protect, updateUserProfile);
router.get("/signature", protect, generateSignature);

router.get("/search",protect,searchUsers);
router.post("/:id/follow",protect,followUser);
router.post("/:id/unfollow",protect,unfollowUser);
router.get("/:userId", protect, getUserById); 

export default router;