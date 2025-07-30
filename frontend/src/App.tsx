// src/App.tsx
import { Routes, Route } from "react-router-dom";
import LoginForm from "./components/login/LoginForm";
import RegisterForm from "./components/Register/RegisterForm";
import ForgotPassword from "./components/forgotPassword/ForgotPassword";
import VerifyOtpForm from "./components/verifyOtp/VerifyOtpForm";
import ResetPasswordForm from "./components/resetPassword/ResetPasswordForm";
import UserProfile from "./components/userProfile/UserProfile";
import Home from "./components/home/Home";
import AuthenticatedLayout from "../src/layouts/AuthenticatedLayout";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import "./App.css";
import { ToastContainer, Slide } from "react-toastify";
import EditProfile from "./components/editProfile/EditProfile";
import ErrorBoundary from "./components/errorBoundary/ErrorBoundary";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
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
            <Route path="/edit-userprofile" element={<EditProfile />} />
          </Route>
        </Routes>
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
