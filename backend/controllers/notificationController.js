import { asyncHandler } from "../utils/asyncHandler.js";
import { Notification } from "../models/notification.models.js";
import { emitNotification } from "../server.js"; // Adjust the path if necessary to import from your server file

// Create a new notification
export const createNotification = asyncHandler(async (req, res) => {
  const { senderId, recipient, type, message, targetType, targetId, isFollowing } = req.body;

  const notification = await Notification.create({
    sender: senderId,
    recipient,
    type,
    message,
    targetType,
    targetId,
    isFollowing: isFollowing || false,
  });

  // Populate the sender details for the notification (matching what the frontend expects)
  const populatedNotification = await Notification.findById(notification._id)
    .populate("sender", "username profilePicture")
    .lean(); // Use lean() for plain JS object

  // Emit the notification via Socket.IO for real-time update
  emitNotification(recipient, populatedNotification);

  res.status(201).json({ success: true, notification: populatedNotification });
});

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username profilePicture")
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error in getNotifications:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Mark a single notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    return res
      .status(404)
      .json({ success: false, message: "Notification not found" });
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({ success: false, message: "Not authorized to mark this notification as read" });
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({ success: true, message: "Notification marked as read" });
});

// New controller: Mark multiple notifications as read (to match frontend's handleSeeAll)
export const markNotificationsAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid notification IDs" });
  }

  const notifications = await Notification.find({
    _id: { $in: notificationIds },
    recipient: req.user._id,
  });

  if (notifications.length !== notificationIds.length) {
    return res.status(403).json({ success: false, message: "Not authorized or some notifications not found" });
  }

  await Notification.updateMany(
    { _id: { $in: notificationIds } },
    { $set: { read: true } }
  );

  res.status(200).json({ success: true, message: "Notifications marked as read" });
});