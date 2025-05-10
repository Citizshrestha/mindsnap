// backend/routes/authRoutes.js
import express from 'express';
import {
  loginUser,
  registerUser,
  logoutUser, 
  sendOtpEmailVerification, 
  verifyEmail, 
  isAuthenticated, 
  sendResetPasswordOtp,
  verifyResetPasswordOtp,
  resetPassword,
  refreshAccessToken,
} from '../controllers/authController.js';
import protect  from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/sendResetPasswordOtp', sendResetPasswordOtp);
router.post('/refresh', refreshAccessToken);

// Protected routes
router.post('/logout', protect, logoutUser); 
router.post('/sendOtpEmailVerification', protect, sendOtpEmailVerification); 
router.post('/verifyEmail', protect, verifyEmail); 
router.post('/isAuth', protect, isAuthenticated); 
router.post('/verifyResetPasswordOtp', protect, verifyResetPasswordOtp);
router.post('/resetPassword', protect, resetPassword);

export default router;