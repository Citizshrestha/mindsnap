// controllers/notificationController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import {Notification} from "../models/notification.models.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "username profilePicture")
    .populate("targetId")
    .sort({ createdAt: -1 });
  res.json(notifications);
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to mark this notification as read");
  }
  notification.read = true;
  await notification.save();
  res.json({ message: "Notification marked as read" });
});