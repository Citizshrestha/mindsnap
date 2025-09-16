import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markNotificationsAsRead, 
} from "../controllers/notificationController.js";

const router = express.Router();

// Create a new notification
router.post("/", protect, createNotification);

// Get all notifications for logged-in user
router.get("/", protect, getNotifications);

// Mark a single notification as read
router.patch("/:id/read", protect, markNotificationAsRead);

// New route: Mark multiple notifications as read
router.patch("/mark-read", protect, markNotificationsAsRead);

export default router;