import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { transporter } from "../config/nodemailer.js";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils.js";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Reusable function to send email
const sendEmail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${mailOptions.to}`);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Email error:", {
      message: error.message,
      code: error.code,
      response: error.response || "No response",
    });
    return { success: false, message: "Failed to send email" };
  }
};

// @route POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const {fullname, username, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ fullname,username, email, password });

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: `🎉 Welcome to MindSnap, ${username}! 🚀`,
    text: `
Hello ${username} 🌟,

Welcome to MindSnap! We're excited to have you here. 🎈
Your account has been successfully created with the email: ${email}.

Start exploring now: ${process.env.CLIENT_URL}/login

If you need any assistance, reach out to us at ${process.env.SUPPORT_EMAIL}. 💌

Cheers,
The MindSnap Team 🌱
    `,
  };

  const emailResult = await sendEmail(mailOptions);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    emailStatus: emailResult.message,
    _id: user._id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    token: generateToken(user._id),
  });
});

// @route POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token as cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken: accessToken,
    _id: user._id,
    username: user.username,
    email: user.email,
  });
});

// @route POST /api/auth/sendOtpEmailVerification
export const sendOtpEmailVerification = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Request body is empty or invalid" });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.isAccountVerified) {
    return res.status(400).json({ success: false, message: "User is already verified" });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.verifyOtp = otp;
  user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: user.email,
    subject: `🔐 MindSnap OTP - Verify Your Account 🛡️`,
    text: `
Hi ${user.username}, 👋

You're almost there! 🥳
To complete your account verification, please enter the OTP below:

🔢 OTP: ${otp}

This OTP is valid for the next 24 hours. ⏰
If you didn't request this verification, let us know at ${process.env.SUPPORT_EMAIL}. 🚨

Stay awesome,
The MindSnap Team 🚀
    `,
  };

  const emailResult = await sendEmail(mailOptions);

  return res.status(200).json({
    success: true,
    message: emailResult.message,
  });
});


// @route POST /api/auth/verifyEmail
export const verifyEmail = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.isAccountVerified) {
    return res.status(400).json({
      success: false,
      message: "Account is already verified",
    });
  }

  if (user.verifyOtp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  if (user.verifyOtpExpireAt < Date.now()) {
    return res.status(400).json({
      success: false,
      message: "OTP has expired",
    });
  }

  user.isAccountVerified = true;
  user.verifyOtp = "";
  user.verifyOtpExpireAt = 0;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Account verified successfully",
  });
});

// @route POST /api/auth/isAuth
export const isAuthenticated = asyncHandler(async (req,res) => {
   try {
      return res.status(200).json({success: true, message: "User is Authenticated"})
   } catch (error) {
     res.json({success: false, message: error.message})
   }
})

// @route POST /api/auth/sendResetPasswordOtp
export const sendResetPasswordOtp = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Request body is empty or invalid. Please recheck."
    });
  }

  const email = req.body.email?.toLowerCase().trim();

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or email is empty."
    });
  }

  const user = await User.findOne({ email });

  if (user) {
    // Generate a 6-digit OTP as a string
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: `🔒 MindSnap Password Reset OTP 🔑`,
      text: `
Hi ${user.username}, 👋

We received a request to reset your MindSnap password. 🔐
Please use the OTP below to proceed:

🔢 OTP: ${otp}

This OTP is valid for the next 15 minutes. ⏰
If you didn't request a password reset, please contact us at ${process.env.SUPPORT_EMAIL}. 🚨

Stay secure,
The MindSnap Team 🚀
      `,
    };

    try {
      await sendEmail(mailOptions);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again later."
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "If an account with this email exists, an OTP has been sent."
  });
});

// @route POST /api/auth/verifyResetPasswordOtp
export const verifyResetPasswordOtp = asyncHandler(async(req,res) => {
  const {userId, otp} = req.body;
  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      message: "userId and OTP are required"
    });
  }
  const user = await User.findById(userId);

  if (!user){
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  if (user.resetOtp !== otp){
    return res.status(400).json({
      success: false,
      message: "Invalid OTP Please try again"
    });
  }

  if (user.resetOtpExpireAt < Date.now()){
    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new one."
    })
  }

  user.resetOtp = "";
  user.resetOtpExpireAt = 0;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "OTP verified succesfully. You can now reset your password."
  });
  
})

// @route POST /api/auth/resetPassword
export const resetPassword = asyncHandler(async (req, res) => {
  const { userId, newPassword } = req.body;

  // Validate required fields
  if (!userId || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "userId and newPassword are required"
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long"
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found in DB"
    });
  }

  // Check if OTP verification was completed (optional, for added security)
  if (user.resetOtp || user.resetOtpExpireAt !== 0) {
    return res.status(400).json({
      success: false,
      message: "OTP verification required before resetting password"
    });
  }

  
  const isSamePassword = await user.matchPassword(newPassword);
  if (isSamePassword) {
    return res.status(400).json({
      success: false,
      message: "New password cannot be the same as the old password"
    });
  }
  

  user.password = newPassword;
  user.resetOtp = "";
  user.resetOtpExpireAt = 0;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successfully"
  });
});

// @route POST /api/auth/logout
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    expires: new Date(0),
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});


// @route POST /api/auth/refresh
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token){
    return res.status(401).json({
      success: false,
      message: "No refresh token provided",
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user){
      return res.status(404).json({
        success: false,
        message: "User not Found"
      })
    }

    const newAccessToken = generateAccessToken(user._id);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh Token",
    })
    
  }
})