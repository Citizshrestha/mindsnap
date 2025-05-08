import express from 'express';
import { registerUser, loginUser, logoutUser, sendOtp, verifyEmail, isAuthenticated, sendResetOtp } from '../controllers/authController.js';
import protect from "../middleware/authMiddleware.js";
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/sendOtp',protect, sendOtp);
router.post('/verifyEmail',protect, verifyEmail);
router.post('/isAuth',protect, isAuthenticated);
router.post('/sendResetOtp',protect, sendResetOtp);

export default router;

