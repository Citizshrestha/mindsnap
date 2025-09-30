import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { sendSignupOtp } from "../../../api/auth";
import logoImg from "../../../../public/images/mindsnap logo.png";
import { HiOutlineMail } from "react-icons/hi";
import axios from "axios";

type FormData = {
  email: string;
};

const VerifyEmailForm = () => {
  const [formData, setFormData] = useState<FormData>({ email: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("componentBackground");
    // Prefill email from localStorage if available
    const storedFormData = localStorage.getItem("signupFormData");
    if (storedFormData) {
      const { email } = JSON.parse(storedFormData);
      setFormData({ email });
    }
    return () => {
      document.body.classList.remove("componentBackground");
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.email) {
        throw new Error("Please enter an email address");
      }

      // Get signup form data from localStorage
      const storedFormData = localStorage.getItem("signupFormData");
      if (!storedFormData) {
        throw new Error("Signup form data not found. Please start registration again.");
      }

      const signupFormData = JSON.parse(storedFormData);
      const response = await sendSignupOtp(formData.email, signupFormData);

      localStorage.setItem("signupEmail", formData.email);
      if (response.userId) {
        localStorage.setItem("signupUserId", response.userId);
      }
      toast.success(response.message || "OTP sent to your email!");
      navigate("/verify-signup-otp");
    } catch (err: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) {
          errorMessage = err.response.data.message || "Invalid email address.";
        } else if (err.response?.status === 429) {
          errorMessage = "Too many OTP requests. Please wait and try again.";
        } else if (err.response?.status === 404) {
          errorMessage = "API endpoint not found. Please check server configuration.";
        } else if (err.response) {
          errorMessage = err.response.data.message || "Failed to send OTP.";
        } else if (err.request) {
          errorMessage = "Network Error: Unable to reach the server.";
        }
      }

      console.error("Send OTP Error:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignup = () => {
    navigate("/register");
  };

  return (
    <div
      style={{ background: "transparent" }}
      className="flex flex-col items-center justify-center h-screen text-white"
    >
      <div className="flex items-center mb-8">
        <div className="w-20 h-20 mr-4">
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
        <h2 className="text-2xl font-semibold mb-6">Verify Email</h2>
        <p className="flex flex-col items-center text-sm mb-4 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2B0889] to-[#16024B] text-gray-200 border border-purple-900 shadow-md">
          <HiOutlineMail className="inline-block mr-3 text-blue-400 text-xl" />
          Enter your email to receive an OTP for verification
        </p>

        <form onSubmit={handleSubmit} className="w-72">
          <div className="relative mb-6">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
              <HiOutlineMail className="h-5 w-5" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
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
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </button>
          <p className="text-white text-center text-sm">
            Back to{" "}
            <button
              type="button"
              onClick={handleBackToSignup}
              className="text-pink-500 font-semibold underline-offset-2 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmailForm;