import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { sendMessage } from "./controllers/messageController.js";

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

dotenv.config();
const app = express();

// ---------------------- MIDDLEWARE ----------------------
app.use(express.json());
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

// ---------------------- DATABASE ----------------------
connectDB();

// ---------------------- ROUTES ----------------------
app.get("/", (req, res) => {
  res.send("MindSnap API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/user-tags", userTagRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/notifications", notificationRoutes);

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
  const userId = socket.handshake.auth.userId || socket.handshake.auth.token; // Use userId or token as fallback
  if (userId) {
    socket.userId = userId; // Attach userId to socket for use in events
    console.log(`Socket connection for user: ${userId}`);
  } else {
    console.warn("No userId provided in socket handshake");
  }
  next(); // Proceed without token verification
});

io.on("connection", (socket) => {
  console.log("New Client Connected: ", socket.id);

  socket.on("joinUser", (userId) => {
    if (socket.userId && socket.userId !== userId) {
      console.warn(`Unauthorized join attempt by ${socket.userId} for user ${userId}`);
      return;
    }
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined notification room. Rooms:`, socket.rooms);

    // Emit initial unread count
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
    const { conversationId, message } = messageData;
    if (!conversationId || !message) {
      console.error("Invalid message data structure");
      return;
    }

    try {
      const req = {
        params: { conversationId },
        body: {
          content: message.content,
          type: message.messageType || "text",
          receiverId: message.receiver || null,
          replyTo: message.replyTo || null,
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
      }
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  socket.on("typingStart", (conversationId) => {
    socket.to(conversationId).emit("userTyping", {
      userId: socket.userId,
      conversationId,
      isTyping: true,
    });
  });

  socket.on("typingStop", (conversationId) => {
    socket.to(conversationId).emit("userTyping", {
      userId: socket.userId,
      conversationId,
      isTyping: false,
    });
  });

  socket.on("fetchUnreadCount", async (userId, callback) => {
    try {
      const notifications = await Notification.find({ recipient: userId, read: false });
      callback(notifications.length);
    } catch (err) {
      console.error("Error fetching unread count:", err);
      callback(0);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Client Disconnected: ${socket.id} - Reason: ${reason}`);
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