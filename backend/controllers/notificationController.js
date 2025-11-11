import { asyncHandler } from "../utils/asyncHandler.js";
import { Notification } from "../models/notification.models.js";
import { emitNotification } from "../server.js"; 
import axios from "axios"; 

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

  const populatedNotification = await Notification.findById(notification._id)
    .populate("sender", "username profilePicture")
    .lean();

  emitNotification(recipient, populatedNotification);

  res.status(201).json({ success: true, notification: populatedNotification });
});

export const followBack = asyncHandler(async (req, res) => {
  const { senderId } = req.body; // The user who was initially followed
  const recipientId = req.user._id; // The current user following back

  try {
    // Perform the follow action
    const followResponse = await axios.post(
      `${process.env.API_URL}/api/users/${senderId}/follow`,
      {},
      {
        headers: { Authorization: req.headers.authorization },
      }
    );

    if (followResponse.data.success) {
      // Verify the follow status after the action
      const followStatusResponse = await axios.get(
        `${process.env.API_URL}/api/users/${senderId}/follow-status`,
        {
          headers: { Authorization: req.headers.authorization },
        }
      );
      if (!followStatusResponse.data.isFollowing) {
        return res.status(400).json({ success: false, message: "Follow status not updated" });
      }

      // Create a follow_back notification for the original follower
      const followBackNotification = await Notification.create({
        sender: recipientId, // The user who followed back
        recipient: senderId, // The original follower
        type: "follow_back",
        message: `${req.user.username} followed you back!`,
        targetType: "Profile",
        targetId: { _id: senderId },
        isFollowing: true,
      });

      const populatedFollowBackNotification = await Notification.findById(followBackNotification._id)
        .populate("sender", "username profilePicture")
        .lean();
      emitNotification(senderId, populatedFollowBackNotification);

      res.status(200).json({
        success: true,
        message: "Followed back successfully",
        notification: {
          _id: followBackNotification._id,
          sender: populatedFollowBackNotification.sender,
          type: "follow_back",
          message: populatedFollowBackNotification.message,
          isFollowing: true,
        },
      });
    } else {
      res.status(400).json({ success: false, message: "Failed to follow back" });
    }
  } catch (err) {
    console.error("Error following back:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username profilePicture")
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Mark a single notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
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

// Mark multiple notifications as read
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