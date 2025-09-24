// server.js
import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { sendMessage } from "./controllers/messageController.js";
import multer from "multer";
import jwt from "jsonwebtoken";
import { Notification } from "./models/notification.models.js";
import { User } from "./models/user.models.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import userTagRoutes from "./routes/userTagRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import hashtagRoutes  from "./routes/hashtagRoutes.js";
import highlightRoutes  from "./routes/highlightRoutes.js";

dotenv.config();
const app = express();

// ---------------------- MIDDLEWARE ----------------------
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------- DATABASE ----------------------
connectDB();

// ---------------------- MULTER CONFIGURATION ----------------------
const upload = multer({ dest: "uploads/" });

// ---------------------- ROUTES ----------------------
app.get("/", (req, res) => {
  res.send("MindSnap API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/conversations", conversationRoutes);
console.log('Registering routes...');
app.use("/api/messages", messageRoutes);

console.log('=== REGISTERED MESSAGE ROUTES ===');
messageRoutes.stack.forEach(layer => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).map(method => method.toUpperCase()).join(', ');
    console.log(`${methods} ${layer.route.path}`);
  }
});
console.log('=================================');
app.use("/api/stories", storyRoutes);
app.use("/api/user-tags", userTagRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/hashtags", hashtagRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/highlights", highlightRoutes);

// ---------------------- ERROR HANDLER ----------------------
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// ---------------------- SOCKET.IO SETUP ----------------------
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.warn("No token provided in socket handshake");
    return next(new Error("Authentication required: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.userId = decoded.id;
    console.log(`Socket connection for user: ${socket.userId}`);
    next();
  } catch (error) {
    console.error("Invalid token in socket handshake:", {
      message: error.message,
      token: token.substring(0, 20) + "...",
    });
    next(new Error(`Invalid authentication token: ${error.message}`));
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`New Client Connected: ${socket.id} (User: ${socket.userId})`);
  
  // Track user as online
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    status: "online",
    lastSeen: new Date()
  });

  // Update user status in database
  User.findByIdAndUpdate(socket.userId, {
    onlineStatus: "online",
    isOnline: true,
    lastSeen: new Date(),
    socketId: socket.id
  }).exec();

  // Broadcast online status to all users
  io.emit("userStatusUpdate", {
    userId: socket.userId,
    status: "online",
    isOnline: true
  });

  socket.on("joinUser", (userId) => {
    if (socket.userId !== userId) {
      console.warn(`Unauthorized join attempt by ${socket.userId} for user ${userId}`);
      return;
    }
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined notification room. Rooms:`, socket.rooms);

    socket.emit("fetchUnreadCount", userId, (unreadCount) => {
      console.log(`Initial unread count for ${userId}: ${unreadCount}`);
    });
  });

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`✅ User ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on("leaveConversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`✅ User ${socket.id} left conversation: ${conversationId}`);
  });

  socket.on("sendMessage", async (messageData) => {
    console.log("Received sendMessage event:", messageData);
    
    const { conversationId, content, receiverId } = messageData;
    
    if (!conversationId || !content) {
      console.error("Invalid message data structure:", messageData);
      socket.emit("messageError", { error: "Invalid message data: conversationId and content are required" });
      return;
    }

    try {
      const req = {
        params: { conversationId },
        body: {
          content: content,
          type: "text",
          receiverId: receiverId || null,
          replyTo: null,
        },
        user: { _id: socket.userId },
      };
      
      const res = {
        status: function (code) {
          this.statusCode = code;
          return this;
        },
        json: function (data) {
          this.data = data;
        },
        statusCode: 200,
      };

      await sendMessage(req, res);

      if (res.data) {
        io.to(conversationId).emit("newMessage", res.data);
        console.log("Message sent successfully:", res.data._id);
      }
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

 socket.on("typingStart", (data) => {
  socket.to(data.receiverId).emit("userTyping", { // ← This emits 'userTyping'
    userId: data.userId,
    receiverId: data.receiverId,
    isTyping: true
  });
});

  socket.on("typingStop", (data) => {
    const { receiverId, userId } = data;
    // Broadcast to all users in the conversation except the sender
    socket.to(receiverId).emit("userTyping", {
      userId: userId,
      receiverId: receiverId,
      isTyping: false
    });
  });

  socket.emit("fetchUnreadCount", async (userId, callback) => {
    try {
      const notifications = await Notification.find({ recipient: userId, read: false });
      callback(notifications.length);
    } catch (err) {
      console.error("Error fetching unread count:", err);
      callback(0);
    }
  });

 socket.on("sendNotification", async (data) => {
  try {
    const { recipientId, senderId, senderUsername, senderProfilePicture, targetType, targetId, type, message, reactionType } = data;

    const sender = await User.findById(senderId);
    if (!sender) {
      console.error("Sender not found:", senderId);
      return;
    }

    // Check for existing notification to avoid duplicates
    const existingNotification = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      targetType,
      targetId: targetId, // Fixed: removed the incorrect "_id" nesting
      type: type,
    });

    let notification;
    
    if (existingNotification) {
      // Update existing notification
      existingNotification.message = message;
      existingNotification.read = false;
      existingNotification.createdAt = new Date();
      if (reactionType) {
        existingNotification.reactionType = reactionType;
      }
      await existingNotification.save();
      notification = existingNotification;
    } else {
      // Create new notification
      const notificationData = {
        recipient: recipientId,
        sender: senderId,
        type: type,
        targetType,
        targetId: targetId, // Fixed: store targetId directly, not nested
        read: false,
        message: message,
      };
      
      // Add reactionType if it exists (for like notifications)
      if (reactionType) {
        notificationData.reactionType = reactionType;
      }
      
      notification = await Notification.create(notificationData);
    }

    // Populate the notification
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "username profilePicture")
      .populate("recipient", "username");

    // Emit to the recipient
    io.to(`user_${recipientId}`).emit("newNotification", populatedNotification);
    console.log(`📩 ${type} notification (${targetType}) sent to user_${recipientId}`);

  } catch (error) {
    console.error("Error sending notification:", error);
  }
});

socket.on("sendLikeNotification", async (data) => {
  try {
    const { recipientId, senderId, senderUsername, senderProfilePicture, targetType, targetId, type, reactionType = "like", message } = data;
    
    // Verify the sender is authenticated
    const sender = await User.findById(senderId);
    if (!sender) {
      console.error("Sender not found:", senderId);
      return;
    }
    
    // Check if there's an existing like notification for this target
    const existingNotification = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      targetType,
      targetId: targetId,
      type: "like"
    });
    
    // Map reaction types to proper display names
    const reactionDisplayNames = {
      like: "liked",
      love: "loved",
      haha: "laughed at",
      wow: "was amazed by",
      sad: "felt sad about",
      angry: "got angry at"
    };
    
    const displayReaction = reactionDisplayNames[reactionType] || 'reacted to';
    const notificationMessage = message || `${senderUsername || sender.username} ${displayReaction} your ${targetType.toLowerCase()}`;
    
    if (existingNotification) {
      // Update existing notification
      existingNotification.message = notificationMessage;
      existingNotification.read = false;
      existingNotification.createdAt = new Date();
      existingNotification.reactionType = reactionType;
      await existingNotification.save();
      
      // Populate the updated notification
      const populatedNotification = await Notification.findById(existingNotification._id)
        .populate("sender", "username profilePicture")
        .populate("recipient", "username");
      
      // Emit to the recipient
      io.to(`user_${recipientId}`).emit("newNotification", populatedNotification);
      console.log(`📩 Like notification updated for user_${recipientId}`);
    } else {
      // Create new notification
      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: "like",
        targetType,
        targetId: targetId,
        read: false,
        message: notificationMessage,
        reactionType: reactionType
      });
      
      // Populate the notification
      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "username profilePicture")
        .populate("recipient", "username");
      
      // Emit to the recipient
      io.to(`user_${recipientId}`).emit("newNotification", populatedNotification);
      console.log(`📩 New like notification sent to user_${recipientId}`);
    }
    
  } catch (error) {
    console.error("Error sending like notification:", error);
  }
});

  // socket.on("sendCommentNotification", async (data) => {
  //   try {
  //     const { recipientId, senderId, senderUsername, senderProfilePicture, targetType, targetId, type, message } = data;

  //     const sender = await User.findById(senderId);
  //     if (!sender) {
  //       console.error("Sender not found:", senderId);
  //       return;
  //     }

  //     const existingNotification = await Notification.findOne({
  //       recipient: recipientId,
  //       sender: senderId,
  //       targetType,
  //       "targetId._id": targetId,
  //       type: "comment",
  //     });

  //     if (existingNotification) {
  //       existingNotification.message = message;
  //       existingNotification.read = false;
  //       existingNotification.createdAt = new Date();
  //       await existingNotification.save();

  //       const populatedNotification = await Notification.findById(existingNotification._id)
  //         .populate("sender", "username profilePicture")
  //         .populate("recipient", "username");

  //       io.to(`user_${recipientId}`).emit("newNotification", populatedNotification);
  //       console.log(`📩 Comment notification updated for user_${recipientId}`);
  //     } else {
  //       const notification = await Notification.create({
  //         recipient: recipientId,
  //         sender: senderId,
  //         type: "comment",
  //         targetType,
  //         targetId: { _id: targetId },
  //         read: false,
  //         message,
  //       });

  //       const populatedNotification = await Notification.findById(notification._id)
  //         .populate("sender", "username profilePicture")
  //         .populate("recipient", "username");

  //       io.to(`user_${recipientId}`).emit("newNotification", populatedNotification);
  //       console.log(`📩 New comment notification sent to user_${recipientId}`);
  //     }
  //   } catch (error) {
  //     console.error("Error sending comment notification:", error);
  //   }
  // });

  // socket.on("sendCommentLikeNotification", async (data) => {
  //   try {
  //     const { recipientId, senderId, senderUsername, senderProfilePicture, targetType, targetId, type, message } = data;

  //     const sender = await User.findById(senderId);
  //     if (!sender) {
  //       console.error("Sender not found:", senderId);
  //       return;
  //     }

  //     const existingNotification = await Notification.findOne({
  //       recipient: recipientId,
  //       sender: senderId,
  //       targetType: "Comment",
  //       "targetId._id": targetId,
  //       type: "like",
  //     });

  //     if (existingNotification) {
  //       existingNotification.message = message;
  //       existingNotification.read = false;
  //       existingNotification.createdAt = new Date();
  //       await existingNotification.save();

  //       const populatedNotification = await Notification.findById(existingNotification._id)
  //         .populate("sender", "username profilePicture")
  //         .populate("recipient", "username");

  //       io.to(`user_${recipientId}`).emit("newNotification", populatedNotification);
  //       console.log(`📩 Comment like notification updated for user_${recipientId}`);
  //     } else {
  //       const notification = await Notification.create({
  //         recipient: recipientId,
  //         sender: senderId,
  //         type: "like",
  //         targetType: "Comment",
  //         targetId: { _id: targetId },
  //         read: false,
  //         message,
  //       });

  //       const populatedNotification = await Notification.findById(notification._id)
  //         .populate("sender", "username profilePicture")
  //         .populate("recipient", "username");

  //       io.to(`user_${recipientId}`).emit("newNotification", populatedNotification);
  //       console.log(`📩 New comment like notification sent to user_${recipientId}`);
  //     }
  //   } catch (error) {
  //     console.error("Error sending comment like notification:", error);
  //   }
  // });

 // In your socket service or server.js
socket.on("deleteMessage", (data) => {
  socket.to(data.conversationId).emit("messageDeleted", {
    messageId: data.messageId
  });
});

socket.on("editMessage", (data) => {
  socket.to(data.conversationId).emit("messageEdited", {
    messageId: data.messageId,
    content: data.content,
    isEdited: true,
    editedAt: new Date()
  });
});

  // Handle manual logout
  socket.on("userLogout", async (data) => {
    console.log(`🔌 User ${data.userId} manually logging out`);
    
    try {
      // Update user status to offline immediately
      await User.findByIdAndUpdate(data.userId, {
        onlineStatus: "offline",
        isOnline: false,
        lastSeen: new Date()
      });

      // Remove from online users
      onlineUsers.delete(data.userId);

      // Broadcast offline status
      io.emit("userStatusUpdate", {
        userId: data.userId,
        status: "offline",
        isOnline: false
      });

      console.log(`✅ User ${data.userId} status updated to offline`);
    } catch (error) {
      console.error("Error updating user status on manual logout:", error);
    }
  });
  socket.on("disconnect", (reason) => {
    console.log(`❌ Client Disconnected: ${socket.id} (User: ${socket.userId}) - Reason: ${reason}`);
    
    // Update user status to offline
    onlineUsers.delete(socket.userId);
    
    User.findByIdAndUpdate(socket.userId, {
      onlineStatus: "offline",
      isOnline: false,
      lastSeen: new Date()
    }).exec();

    // Broadcast offline status
    io.emit("userStatusUpdate", {
      userId: socket.userId,
      status: "offline",
      isOnline: false
    });
  });

  socket.on("error", (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

const emitNotification = (recipientId, notification) => {
  if (io.sockets.adapter.rooms.get(`user_${recipientId}`)?.size > 0) {
    io.to(`user_${recipientId}`).emit("newNotification", notification);
    console.log(`📩 Notification emitted to user_${recipientId}:`, notification);
  } else {
    console.warn(`⚠️ No active sockets in room user_${recipientId} for notification:`, notification);
  }
};

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for real-time connections`);
});

export { io, app, emitNotification };