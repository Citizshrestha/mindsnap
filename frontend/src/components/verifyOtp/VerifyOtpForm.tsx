import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { verifyResetPasswordOtp } from "../../api/auth";
import logoImg from "../../../public/images/mindsnap logo.png";
import { HiOutlineMail } from "react-icons/hi";

type FormData = {
  otp: string;
};

const VerifyOtpForm = () => {
  const [formData, setFormData] = useState<FormData>({ otp: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") || "";
  const email = localStorage.getItem("resetEmail") || "";

  useEffect(() => {
    document.body.classList.add("componentBackground");
    return () => {
      document.body.classList.remove("componentBackground");
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ otp: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.otp) {
        throw new Error("Please enter the OTP");
      }
      if (!userId) {
        throw new Error("User ID not found. Please try again.");
      }

      const response = await verifyResetPasswordOtp(userId, formData.otp);
      toast.success(response.message);
      navigate("/reset-password");
    } catch (err: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      // Check if the error is an Axios error with a response
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage = err.response.data?.message || "Failed to verify OTP.";
        } else if (err.request) {
          errorMessage =
            "Network Error: Unable to reach the server. Please check your connection.";
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      console.error("Verify OTP Error:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div
      style={{ background: "transparent" }}
      className="flex flex-col items-center justify-center h-screen text-white "
    >
      <div className="flex items-center mb-8">
        <div className="w-20 h-20 mr-4">
          <img
            src={logoImg}
            alt="MindSnap Logo"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <h1 className="text-5xl font-bold">MindSnap</h1>
      </div>
      <div className="formContainer p-8 bg-[#16024B] rounded-2xl flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-6">Verify OTP</h2>
        <p className="flex flex-col items-center text-sm mb-4 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2B0889] to-[#16024B] text-gray-200 border border-purple-900 shadow-md">
          <HiOutlineMail className="inline-block mr-3 text-blue-400 text-xl" />
          An OTP has been sent to{" "}
          <span className="text-white font-semibold ml-1 bg-[#20035F] px-2 py-1 rounded">
            {email}
          </span>
        </p>

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
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={formData.otp}
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
            {isLoading ? "Verifying..." : "Verify OTP"}
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

export default VerifyOtpForm;
