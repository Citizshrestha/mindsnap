// routes/messageRoutes.js - Fix route order and method
import express from "express";
import multer from "multer";
import fs from "fs";
import {
  sendMessage,
  getMessages,
  getUsersForChatList,
  deleteMessage,
  editMessage,
  bulkDeleteMessages,
  addReaction,
  pinMessage,
  uploadMedia,
  markConversationAsSeen,
} from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/messages/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory for messages');
}

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

// File filter for media files
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Specific routes first (before parameterized routes)
router.get("/unread-count", protect, async (req, res) => {
  try {
    const { Message } = await import('../models/message.models.js');
    const count = await Message.countDocuments({
      receiver: req.user._id,
      seen: false,
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, count: 0 });
  }
});
router.get("/users", protect, getUsersForChatList);
router.post("/reaction", protect, addReaction);
router.post("/pin", protect, pinMessage);
router.post("/upload/:conversationId", protect, upload.single('media'), uploadMedia);
router.post("/mark-seen/:conversationId", protect, markConversationAsSeen);
router.post("/send/:conversationId", protect, sendMessage);

// Edit message
router.put("/edit/:messageId", protect, editMessage);

// Bulk delete messages
router.delete("/bulk", protect, bulkDeleteMessages);

// Parameterized routes should come last
router.delete("/:messageId", protect, deleteMessage);
router.get("/:conversationId", protect, getMessages);

export default router;