import { Routes, Route } from "react-router-dom";
import LoginForm from "./components/login/LoginForm";
import RegisterForm from "./components/Register/RegisterForm";
import ForgotPassword from "./components/verifications/forgotPassword/ForgotPassword";
import VerifyOtpForm from "./components/verifications/verifyOtp/VerifyOtpForm";
import VerifySignupOtpForm from "./components/verifications/verifySignupOtp/VerifySignupOtpForm";
import ResetPasswordForm from "./components/verifications/resetPassword/ResetPasswordForm";
import VerifyEmailForm from "./components/verifications/verifyEmail/VerifyEmailForm";
import UserProfile from "./components/userProfile/UserProfile";
import Home from "./components/home/Home";
import AuthenticatedLayout from "./layouts/AuthenticatedLayout";
import { Provider, useDispatch } from "react-redux";
import { store } from "./redux/store";
import "./App.css";
import { ToastContainer, Slide } from "react-toastify";
import EditProfile from "./components/editProfile/EditProfile";
import ErrorBoundary from "./components/errorBoundary/ErrorBoundary";
import Message from "./components/message/Message";
import Explore from "./components/explore/Explore";
import Connection from "./components/connections/Connection";
import PendingRequest from "./components/pendingRequest/PendingRequest";
import { useSocketNotifications } from "./hooks/useSocketNotifications";
import Settings from "./components/setting/Settings";
import Contacts from "./components/contacts/Contacts";
import { useEffect } from "react";
import { clearUserData } from "./redux/slices/userSlice";
import { clearUser } from "./redux/slices/authSlice";
import { clearNotifications } from "./redux/slices/notificationSlice";

const AppContent: React.FC = () => {
  useSocketNotifications();
  const dispatch = useDispatch();

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      // If no valid authentication data, clear everything
      if (!token || !userId || !username || username === "Guest") {
        dispatch(clearUserData());
        dispatch(clearUser());
        dispatch(clearNotifications());
      }
    };

    initializeAuth();
  }, [dispatch]);

  return (
    <Routes>
      {/* Public Routes (No Header) */}
      <Route path="/" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmailForm />} />
      <Route path="/verify-signup-otp" element={<VerifySignupOtpForm />} />
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
        <Route path="/follow_request" element={<PendingRequest />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/contacts" element={<Contacts />} />
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