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
  checkUserExists,
  googleLogin,
  changePassword
} from '../controllers/authController.js';
import protect  from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/check',checkUserExists);
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/google-login',googleLogin);
router.post('/sendResetPasswordOtp', sendResetPasswordOtp);
router.post('/refresh', refreshAccessToken);

// Protected routes
router.post('/logout', protect, logoutUser); 
router.post('/sendOtpEmailVerification', protect, sendOtpEmailVerification); 
router.post('/verifyEmail', protect, verifyEmail); 
router.post('/isAuth', protect, isAuthenticated); 
router.post('/verifyResetPasswordOtp',protect, verifyResetPasswordOtp);
router.post('/resetPassword', protect, resetPassword);
router.post('/change-password', protect, changePassword);


export default router;