// backend/server.js
import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

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
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless'); // allows cross-origin resources without cookies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');      // required with COEP
  next();
});

// CORS for API requests
app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
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

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
