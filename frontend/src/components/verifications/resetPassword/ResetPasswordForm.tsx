import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPassword } from "../../../api/auth";
import logoImg from "../../../../public/images/mindsnap logo.png";
import axios from "axios";

type FormData = {
  newPassword: string;
  confirmPassword: string;
};

const ResetPasswordForm = () => {
  const [formData, setFormData] = useState<FormData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") || "";

   useEffect(() => {
      document.body.classList.add("componentBackground");
      
      // Only check session if reset hasn't been successful yet
      if (!isResetSuccessful) {
        const resetEmail = localStorage.getItem("resetEmail");
        if (!userId || !resetEmail) {
          toast.error("Invalid session. Please request a new OTP.");
          navigate("/forgot-password");
        }
      }
      
      return () => {
        document.body.classList.remove("componentBackground");
      };
    }, [userId, navigate, isResetSuccessful]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  try {
    if (!formData.newPassword || !formData.confirmPassword) {
      throw new Error("Please fill in all fields");
    }
    if (formData.newPassword !== formData.confirmPassword) {
      throw new Error("Passwords do not match");
    }
    if (!userId) {
      throw new Error("User ID not found. Please try again.");
    }

    const response = await resetPassword(userId, formData.newPassword);
    
    // Mark reset as successful to prevent session check
    setIsResetSuccessful(true);
    
    // Clean up session data
    localStorage.removeItem("resetEmail");
    localStorage.removeItem("userId");
    
    toast.success(response.message);
    
    // Navigate to login after a short delay to ensure toast is shown
    setTimeout(() => {
      navigate("/");
    }, 1000);
  } catch (err: unknown) {
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please request a new OTP.";
        navigate("/forgot-password"); // Redirect to request new OTP
      } else {
        errorMessage = err.response?.data?.message || "Failed to reset password.";
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = "Network Error: Unable to reach the server. Please check your connection.";
    }

    console.error("Reset Password Error:", err);
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-screen text-white"
      style={{ background: "transparent" }}
    >
      <div className="flex items-center mb-8">
        <div className="w-25 h-25 mr-2">
          <img
            src={logoImg}
            alt="MindSnap Logo"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
         <h1 className="text-4xl font-bold">
          Mind<span className="text-yellow-400">Snap</span>
        </h1>
      </div>
      <div className="formContainer p-8 bg-[#16024B] rounded-2xl flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-6">Reset Password</h2>
        <form onSubmit={handleSubmit} className="w-72">
          <div className="relative mb-6">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c1.104 0 2-.896 2-2V7a2 2 0 10-4 0v2c0 1.104.896 2 2 2zm6 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="newPassword"
              placeholder="New Password"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative mb-6">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c1.104 0 2-.896 2-2V7a2 2 0 10-4 0v2c0 1.104.896 2 2 2zm6 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg mb-4 duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
          <p className="text-white text-center text-sm">
            Back to{" "}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-pink-500 font-semibold underline-offset-2 hover:underline"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;