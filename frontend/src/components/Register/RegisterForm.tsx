import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { checkUserExists, register } from "../../api/auth";
import "./register.css";
import landingPageImg from "../../../public/images/SocialMediaConnection.png";
import logoImg from "../../../public/images/mindsnap logo.png";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

type FormData = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

type GoogleJwtPayload = {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
};

import GoogleConfirmModal from "./GoogleConfirmModal";

// Helper function to generate initials from full name
const generateInitials = (fullName: string): string => {
  const names = fullName.trim().split(' ').filter(name => name.length > 0);
  if (names.length === 0) return 'U'; // Default to 'U' for User
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  // Take first letter of first name and first letter of last name
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const RegisterForm = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleJwtPayload | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("componentBackground");
    return () => {
      document.body.classList.remove("componentBackground");
    };
  }, []);

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
      if (
        !formData.fullName ||
        !formData.username ||
        !formData.email ||
        !formData.password
      ) {
        throw new Error("Please fill in all fields");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const existsResponse = await checkUserExists(formData.email);
      if (!existsResponse.success) {
        throw new Error(existsResponse.message || "Failed to verify email");
      }
      if (existsResponse.exists) {
        throw new Error("This email is already registered. Please log in.");
      }

      // Store form data in localStorage for use in CompleteSignupForm
      localStorage.setItem("signupFormData", JSON.stringify(formData));
      toast.info("Please verify your email to continue.");
      navigate("/verify-email");
    } catch (err: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage =
            err.response.data?.message ||
            "Failed to proceed. Please try again later.";
        } else if (err.request) {
          errorMessage =
            "Network Error: Unable to reach the server. Please check your connection.";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Sign Up Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLoginClick = () => {
    navigate("/");
  };

  const handleGoogleSuccess = async (credentialResponse: import('@react-oauth/google').CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
        if (!decoded.email) {
          throw new Error("Google Sign Up failed: Email not provided");
        }
        setGoogleUser(decoded);
        setGoogleToken(credentialResponse.credential);
        setGoogleModalOpen(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to process Google Sign Up. Please try again.";
        toast.error(errorMessage);
        setError(errorMessage);
      }
    }
  };

  // Handler for confirming Google account registration
  const handleGoogleConfirm = async () => {
    if (!googleUser || !googleUser.email || !googleToken) return;
    setIsLoading(true);
    setGoogleModalOpen(false);
    try {
      const existsResponse = await checkUserExists(googleUser.email);
      if (!existsResponse.success) {
        throw new Error(existsResponse.message || "Failed to check user existence");
      }
      if (existsResponse.exists) {
        toast.info("This Google account is already registered. Please log in.");
        navigate("/");
        return;
      }
      
      // Actually register the user in the database
      const userData = {
        fullname: googleUser.name || "Google User",
        username: googleUser.email?.split('@')[0] || `user_${Date.now()}`,
        email: googleUser.email,
        password: "google-signup", // This will be converted to a secure password by the backend
      };
      
      // Determine profile picture: use Google picture or generate initials
      let profilePicture = googleUser.picture || null;
      if (!profilePicture) {
        // Generate initials if no Google profile picture
        const initials = generateInitials(userData.fullname);
        // You can create a placeholder URL or just store the initials
        // For now, we'll store the initials as a data URL or special format
        profilePicture = `initials:${initials}`;
      }
      
      const registerResponse = await register(
        "", // userId - not needed for new registration
        userData.email,
        userData.fullname,
        userData.username,
        userData.password,
        undefined, // gender
        undefined, // dob
        profilePicture
      );
      
      if (!registerResponse.success) {
        throw new Error(registerResponse.message || "Failed to register user");
      }
      
      // Store Google token for potential future use
      localStorage.setItem("googleToken", googleToken);
      toast.success("Google account registered successfully! Please log in.");
      navigate("/"); // Go to login page
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to process Google Sign Up. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setGoogleUser(null);
      setGoogleToken(null);
    }
  };

  // Handler for closing Google modal
  const handleGoogleModalClose = () => {
    setGoogleModalOpen(false);
    setGoogleUser(null);
    setGoogleToken(null);
    toast.info("Google sign-up cancelled by user.");
  };

  const handleGoogleError = () => {
    const errorMessage = "Google Sign Up failed. Please try again.";
    toast.error(errorMessage);
    setError(errorMessage);
  };

  return (
    <div className="mainContainer flex items-center justify-center w-full h-screen text-white">
      <GoogleConfirmModal
        open={googleModalOpen}
        onClose={handleGoogleModalClose}
        onConfirm={handleGoogleConfirm}
        name={googleUser?.name || ''}
        email={googleUser?.email || ''}
        picture={googleUser?.picture}
      />
      <div className="illustration w-1/2 flex justify-center items-center">
        <img
          src={landingPageImg}
          alt="Illustration"
          className="illustration-image ml-20 mt-20 w-full h-full object-contain"
        />
      </div>
      <div className="form-container w-1/2 p-8 flex flex-col items-center">
        <div className="flex items-center justify-center mb-8 mr-130">
          <div className="w-25 h-25 mr-2">
            <img
              src={logoImg}
              alt="MindSnap Logo"
              className="w-full h-full pb-3 pl-2 object-cover rounded-full"
            />
          </div>
          <h1 className="text-4xl font-bold pr-2">Mind<span className="text-yellow-400">Snap</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="w-72 mb-8 formContainer">
          <div className="form-group">
            <button
              type="button"
              className="register-btn font-semibold"
              onClick={handleLoginClick}
            >
              Log in
            </button>
            <button
              type="button"
              className="login-btn active font-semibold"
              disabled
            >
              Register
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700 placeholder-white"
              aria-label="Full Name"
            />
          </div>
          <div className="relative mb-6">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4a4 4 0 110 8 4 4 0 010-8z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 20v-2a6 6 0 0112 0v2"
                />
              </svg>
            </div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700 placeholder-white"
              aria-label="Username"
            />
          </div>
          <div className="relative mb-6">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700 placeholder-white"
              aria-label="Email"
            />
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
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700 placeholder-white"
              aria-label="Password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mb-4" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg mb-4 duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
            aria-label="Sign Up"
          >
            {isLoading ? "Processing..." : "Sign Up"}
          </button>
          <p className="text-white text-center text-sm pl-2">
            Have an account?{" "}
            <button
              type="button"
              onClick={handleLoginClick}
              className="text-pink-500 font-semibold underline-offset-2 hover:underline hover:scale-110 transition-all duration-200"
              aria-label="Log in"
            >
              Log in
            </button>
          </p>
          <div className="mt-4 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              ux_mode="popup"
              text="continue_with"
              shape="rectangular"
              theme="filled_blue"
              size="large"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;