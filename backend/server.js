// backend/server.js
import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from "http";
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import userTagRoutes from './routes/userTagRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();
const app = express();

// ---------------------- MIDDLEWARE ----------------------

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// COEP & COOP for cross-origin resources (Cloudinary images/videos)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// CORS for API requests
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ---------------------- DATABASE ----------------------
connectDB();

// ---------------------- ROUTES ----------------------
app.get('/', (req, res) => {
  res.send('MindSnap API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/user-tags', userTagRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/notifications', notificationRoutes);

// ---------------------- ERROR HANDLER ----------------------
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// ---------------------- SOCKET.IO SETUP ----------------------
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO authentication middleware (optional but recommended)
io.use((socket, next) => {
  // Add your authentication logic here
  // Example: verify JWT from handshake auth
  next();
});

io.on('connection', (socket) => {
  console.log('New Client Connected: ', socket.id);

  // Join a conversation (room)
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });

  // Leave a conversation
  socket.on('leaveConversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User ${socket.id} left conversation: ${conversationId}`);
  });

  // When message is sent - emit to room
socket.on('sendMessage', async (messageData) => {
    const { conversationId, message } = messageData;
    if (!conversationId || !message) {
      console.error('Invalid message data structure');
      return;
    }

    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        console.error('Conversation not found');
        return;
      }

      // Save message to database
      const newMessage = await Message.create({
        sender: message.sender._id,
        receiver: conversation.isGroup ? null : message.receiver,
        content: message.content,
        messageType: message.messageType || "text",
        mediaUrl: message.mediaUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        conversation: conversationId,
        status: "sent",
        replyTo: message.replyTo || null,
      });

      const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "username profilePicture")
        .populate("replyTo", "content sender messageType")
        .lean();

      populatedMessage.content =
        message.messageType === "text" ? decryptContent(populatedMessage.content) : populatedMessage.content;
      if (populatedMessage.mediaUrl) {
        populatedMessage.mediaUrl = populatedMessage.mediaUrl; // Already decrypted in controller
      }
      if (populatedMessage.replyTo && populatedMessage.replyTo.content) {
        populatedMessage.replyTo.content =
          populatedMessage.replyTo.messageType === "text"
            ? decryptContent(populatedMessage.replyTo.content)
            : populatedMessage.replyTo.content;
      }

      conversation.lastMessage = newMessage._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      io.to(conversationId).emit('newMessage', populatedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle typing indicators
  socket.on('typingStart', (conversationId) => {
    socket.to(conversationId).emit('userTyping', {
      userId: socket.userId, // You'll need to set this from auth
      conversationId,
      isTyping: true
    });
  });

  socket.on('typingStop', (conversationId) => {
    socket.to(conversationId).emit('userTyping', {
      userId: socket.userId,
      conversationId,
      isTyping: false
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Client Disconnected: ${socket.id} - Reason: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for real-time connections`);
});

export { io, app };