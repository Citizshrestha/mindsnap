import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, 
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: 6,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male','Female','Others',''],
      default: "",
    },
    dob:{
      type: Date,
      default: null,
    },
    profilePicture: {
      type: String,
      default: "https://example.com/default-profile-picture.png",
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verifyOtp: {
      type: String,
      default: "",
    },
    verifyOtpExpireAt: {
      type: Number,
      default: 0,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    resetOtp: {
      type: String,
      
      default: "",
    },
    resetOtpExpireAt: {
      type: Number,
      default: 0,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    lastOtpAttempt: {
      type: Date,
      default: null,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    storyHighlights: [
      {
        imageUrl: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
      },
    ],
    vibe: {
      type: String,
      default: "",
    },
    vibeDescription: {
      type: String,
      default: "",
    },
    aboutMe: {
      type: String,
      default: "",
    },
    Posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  { timestamps: true }
);

// Hash the password before saving the user document
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error); // Pass error to Mongoose error handling
  }
});

// Method to match passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if OTP can be sent or not
userSchema.methods.canSendOtp = function () {
  const now = Date.now();
  const oneHourInMs = 60 * 60 * 1000;
  const oneHourAgo = now - oneHourInMs;

  // Reset window if expired or first attempt
  if (!this.lastOtpAttempt || this.lastOtpAttempt < oneHourAgo) {
    this.otpAttempts = 0;
    return { canSend: true, attemptsLeft: 3, timeLeft: 0 };
  }

  if (this.otpAttempts >= 3) {
    const timeLeft = Math.max(0, Math.ceil(((this.lastOtpAttempt + oneHourInMs) - now) / (1000 * 60)));
    return { canSend: false, attemptsLeft: 0, timeLeft };
  }

  return {
    canSend: true,
    attemptsLeft: 3 - this.otpAttempts,
    timeLeft: 0,
  };
};

export const User = mongoose.model("User", userSchema);