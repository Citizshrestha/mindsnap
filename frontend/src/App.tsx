// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import LoginForm from './components/login/LoginForm';
import RegisterForm from './components/Register/RegisterForm';
import ForgotPassword from './components/forgotPassword/ForgotPassword';
import VerifyOtpForm from './components/verifyOtp/VerifyOtpForm';
import './App.css';
import { ToastContainer } from 'react-toastify';
import ResetPasswordForm from './components/resetPassword/ResetPasswordForm';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtpForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm/>}/>
        <Route path="/home" element={<div>Home Page</div>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;