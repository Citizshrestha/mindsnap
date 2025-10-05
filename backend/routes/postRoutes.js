// routes/postRoutes.js
import express from "express";
import { createPost, getPosts, commentOnPost, deletePost, getMyPosts, getUserPosts, editPost } from "../controllers/postController.js";
import protect from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
  // Allow both images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
}
});

const router = express.Router();

router.post("/createPost", protect, upload.single('media'), (req, res, next) => {
  console.log('File received:', req.file);
  next();
}, createPost);

router.get("/getPosts", protect, getPosts);
router.put("/:id", protect, upload.single('media'), editPost);
router.delete("/:id", protect, deletePost);
router.post("/:postId/comments/:commentId/like", protect, commentOnPost);
router.get("/profile/posts", protect, getMyPosts);
router.get("/:userId/posts", protect, getUserPosts);

export default router;