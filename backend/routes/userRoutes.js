import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getUserProfileInfo, updateUserProfile, generateSignature } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", protect, getUserProfileInfo);
router.patch("/update-profile", protect, updateUserProfile);
router.get("/signature", protect, generateSignature);

export default router;