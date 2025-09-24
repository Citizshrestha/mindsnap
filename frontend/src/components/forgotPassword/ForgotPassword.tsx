import { useState, useEffect } from "react";
import logoImg from "../../../public/images/mindsnap logo.png";
import { sendResetPasswordOtp } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

type FormData = {
  email: string;
};

const ForgotPassword = () => {
  const [formData, setFormData] = useState<FormData>({ email: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


   useEffect(() => {
      document.body.classList.add("componentBackground");
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
      throw new Error("Please enter your email");
    }

    const response = await sendResetPasswordOtp(formData.email);
    localStorage.setItem("resetEmail", formData.email);
    if (response.userId) {
      localStorage.setItem("userId", response.userId); // Ensure userId is set
    }
    toast.success(response.message);
    navigate("/verify-otp");
  } catch (err: unknown) {
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (axios.isAxiosError(err)) {
      if (err.response) {
        errorMessage = err.response.data?.message || "Failed to send OTP. Please try again later.";
        switch (err.response.status) {
          case 400:
            errorMessage = err.response.data?.message || "Invalid email format. Please try again.";
            break;
          case 404:
            errorMessage = "User not found. Please register first.";
            break;
          case 429:
            errorMessage = err.response.data?.message || "Too many OTP requests. Please try again later.";
            break;
          case 500:
            errorMessage = "Failed to send OTP email. Please try again later.";
            break;
          default:
            errorMessage = "Failed to send OTP. Please try again later.";
        }
      } else {
        errorMessage = "Network Error: Unable to reach the server. Please check your connection.";
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.error("Forgot Password Error:", err);
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
        <h2 className="text-2xl font-semibold mb-6">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="w-72">
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
              onClick={handleBackToLogin}
              className="text-pink-500 font-semibold underline-offset-2 hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
