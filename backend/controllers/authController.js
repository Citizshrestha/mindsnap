import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { transporter } from "../config/nodemailer.js";

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
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ username, email, password });

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

  const token = generateToken(user._id);

  // Set the token as a cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Login successful",
    _id: user._id,
    username: user.username,
    email: user.email,
    token: token,
  });
});

// @route POST /api/auth/sendOtp
export const sendOtp = asyncHandler(async (req, res) => {
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

// @route POST /api/auth/logout
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});