import { Routes, Route } from "react-router-dom";
import LoginForm from "./components/login/LoginForm";
import RegisterForm from "./components/Register/RegisterForm";
import ForgotPassword from "./components/forgotPassword/ForgotPassword";
import VerifyOtpForm from "./components/verifyOtp/VerifyOtpForm";
import ResetPasswordForm from "./components/resetPassword/ResetPasswordForm";
import UserProfile from "./components/userProfile/UserProfile";
import Home from "./components/home/Home";
import AuthenticatedLayout from "./layouts/AuthenticatedLayout";
import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import { store } from "./redux/store";
import "./App.css";
import { ToastContainer, Slide } from "react-toastify";
import EditProfile from "./components/editProfile/EditProfile";
import ErrorBoundary from "./components/errorBoundary/ErrorBoundary";
import Message from "./components/message/Message";
import Explore from "./components/explore/Explore";
import Connection from "./components/connections/Connection";
import { socketService } from "./services/socketServices";
import { setUnreadCount } from "./redux/slices/notificationSlice";
import type { Notification as NotificationType } from "./services/socketServices";
import { toast } from "react-toastify";

const useNotificationSync = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      console.warn("Cannot connect to socket: Missing token or userId");
      return;
    }

    const connectAndFetch = async () => {
      try {
        await socketService.connect(token, userId);
        socketService.joinUserRoom(userId);

        const handleNewNotification = (notification: NotificationType) => {
          console.log("New notification received:", notification);
          socketService.getSocket()?.emit("fetchUnreadCount", userId, (unreadCount: number) => {
            dispatch(setUnreadCount(unreadCount));
          });
        };

        socketService.onNotification(handleNewNotification);

        // Fetch initial unread count
        socketService.getSocket()?.emit("fetchUnreadCount", userId, (unreadCount: number) => {
          dispatch(setUnreadCount(unreadCount));
          console.log("Unread count fetched:", unreadCount);
        });

        return () => {
          socketService.offNotification(handleNewNotification);
          if (socketService.isSocketConnected()) {
            socketService.disconnect();
          }
        };
      } catch (err) {
        console.error("Failed to connect socket or fetch unread count:", err);
        toast.error("Failed to initialize notifications. Please refresh the page.");
      }
    };

    connectAndFetch();
  }, [dispatch]);
};

const AppContent: React.FC = () => {
  useNotificationSync();

  return (
    <Routes>
      {/* Public Routes (No Header) */}
      <Route path="/" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtpForm />} />
      <Route path="/reset-password" element={<ResetPasswordForm />} />

      {/* Authenticated Routes (With Header and Sidebar) */}
      <Route element={<AuthenticatedLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/edit-userprofile" element={<EditProfile />} />
        <Route path="/messages" element={<Message />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/connections" element={<Connection />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppContent />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          draggable
          pauseOnFocusLoss
          transition={Slide}
        />
      </Provider>
    </ErrorBoundary>
  );
};

export default App;