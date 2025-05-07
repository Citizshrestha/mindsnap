import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
// import hashtagRoutes from "./routes/hashtagRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import userTagRoutes from "./routes/userTagRoutes.js";
import likeRoutes from "./routes/likeRoutes.js"; 
import notificationRoutes from "./routes/notificationRoutes.js"

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect Database (MongoDB)
connectDB();

// Route Testing
app.get("/", (req, res) => {
  res.send("MindSnap API is running...");
});

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
// app.use("/api/hashtag", hashtagRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/user-tags", userTagRoutes);
app.use("/api/likes", likeRoutes); 
app.use("/api/notifications", notificationRoutes); 

// Error-handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));