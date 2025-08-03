# 🌟🚀 MindSnap – A Modern Social Media Web Application

MindSnap is a next-generation **social media web application** designed to provide **creative, safe, and distraction-free** user experiences.  
Unlike traditional platforms, MindSnap emphasizes **privacy, authenticity, and meaningful engagement** without the noise of intrusive algorithms or cluttered interfaces.

---

## 🚀 Features

### 👤 User Features
- **User Authentication** – Register, login, and secure sessions using JWT.
- **Post Feed** – Create, like, comment, bookmark, and share posts.
- **Stories & Highlights** – Share temporary stories and pin highlights on your profile.
- **Messaging System** – Real-time private messaging (future: Socket.io integration).
- **Profile Customization** – Edit profile info, add profile picture, and manage settings.
- **Privacy Controls** – Manage who can see your posts, stories, and profile.
- **Report & Block** – Flag inappropriate content and block unwanted users.

### 🛠 Admin Features
- **Admin Dashboard** – Manage users, posts, and reported content.
- **Content Moderation** – Approve or remove reported posts.
- **Analytics** – Track user growth, engagement, and content performance.

---

## 📸 UI / UX Highlights
- **Modern & Minimal UI** – Inspired by Instagram, Snapchat, and Telegram but redesigned for uniqueness.
- **Bright Gradient Themes** – Purple, pink, orange, and blue tones.
- **Responsive Design** – Fully optimized for desktop, tablet, and mobile.
- **Animations & Hover Effects** – Smooth transitions for a delightful experience.

---

## 🏗 Tech Stack

### **Frontend**
- [Next.js](https://nextjs.org/) (with TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- Modern UI Components

### **Backend**
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) + Mongoose ORM
- [JWT Authentication](https://jwt.io/)

### **Other Tools**
- Cloudinary (Image Uploads)
- CORS Handling
- dotenv for environment variables

---

## 📂 Folder Structure

```plaintext
mindsnap/
│
├── backend/                  # Node.js + Express API
│   ├── config/               # DB connection, env config
│   ├── controllers/          # API route controllers
│   ├── middleware/           # Auth & error handling middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routes
│   ├── utils/                 # Utility functions
│   └── server.js             # Main server file
│
├── frontend/                 # Next.js + TypeScript frontend
│   ├── app/                  # Next.js app directory
│   ├── components/           # Reusable UI components
│   ├── pages/                # Pages
│   ├── public/               # Public assets
│   └── styles/               # Global styles
│
└── README.md
⚙️ Installation
1️⃣ Clone the repository
git clone https://github.com/Citizshrestha/mindsnap.git
cd mindsnap
2️⃣ Backend Setup
cd backend
npm install
Create a .env file:
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
Run backend:
npm run dev
3️⃣ Frontend Setup
cd frontend
npm install
npm run dev / npx vite
🔮 Future Enhancements

AI-powered content moderation

Dark mode & customizable themes

Voice & video calling features

Advanced analytics dashboard for admins
📬 Contact
Author: Citiz Shrestha
📧 Email: citizshresthaa@gmail.com
🌐 GitHub: @Citizshrestha
