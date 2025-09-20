import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login,googleLogin } from "../../api/auth";
import logoImg from "../../../public/images/mindsnap logo.png";
import mobilePic from "../../../public/images/mobilePic.png";
import "./login.css";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";


type FormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("componentBackground");
    return () => {
      document.body.classList.remove("componentBackground");
    };
  }, []);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("rememberedEmail");
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, email: savedEmail, rememberMe: true }));
      }
    } catch (err) {
      console.error("Error accessing localStorage:", err);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.email || !formData.password) throw new Error("Please fill in all fields");

      if (formData.rememberMe) localStorage.setItem("rememberedEmail", formData.email);
      else localStorage.removeItem("rememberedEmail");

      const response = await login(formData.email, formData.password);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("userId", response._id);
      toast.success("Login successful!");
      navigate("/home");
    } catch (err: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (axios.isAxiosError(err)) {
        if (err.response) errorMessage = err.response?.data?.message || "Invalid Credentials";
        else if (err.request) errorMessage = "Network Error please check your connection";
      } else if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Login error", err);
    } finally {
      setIsLoading(false);
    }
  };
const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
  try {
    setIsLoading(true);

    if (!credentialResponse.credential) {
      throw new Error("No credential received from Google.");
    }

    // Call our API helper
    const response = await googleLogin(credentialResponse.credential);
    
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("userId", response._id);
    
    toast.success(`Welcome ${response.username || "User"}!`);
    navigate("/home");
  } catch (error) {
    let errorMessage = "Google login failed";
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || errorMessage;
      // If the error is "no account found", redirect to register
      if (errorMessage.includes("No account found")) {
        toast.info("No account found. Please register first.");
        navigate("/register");
        return;
      }
    }
    toast.error(errorMessage);
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const togglePasswordVisibility = () => setShowPassword((p) => !p);
  const handleForgotPasswordClick = () => navigate("/forgot-password");
  const handleRegisterClick = () => navigate("/register");

  return (
    <div className="flex flex-col items-center justify-center text-white">
      {/* Logo */}
      <div className="flex items-center mb-8">
        <div className="w-25 h-25">
          <img src={logoImg} alt="SnapMind Logo" className="w-full h-full pb-3 pl-2 object-cover rounded-full" />
        </div>
        <h1 className="text-4xl font-bold">
          Mind<span className="text-yellow-400">Snap</span>
        </h1>
      </div>

      <div className="flex items-center gap-10 space-x-14">
        {/* Phone preview */}
        <div className="phoneContainer">
          <div className="phone-screen">
            <img src={mobilePic} alt="Mobile preview" />
          </div>
        </div>

        {/* Login form */}
        <div className="formContainer p-3 bg-[#16024B] rounded-2xl flex flex-col items-center">
          <div className="form-group rounded-4xl">
            <button className="login-btn active font-semibold">Log in</button>
            <button className="register-btn font-semibold" onClick={handleRegisterClick}>
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="w-64 mx-10">
            {/* Email */}
            <div className="relative mb-6">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                📧
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700"
              />
            </div>

            {/* Password */}
            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">🔒</div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
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

            {/* Remember me + Forgot password */}
            <div className="mb-2 flex justify-between">
              <label className="flex items-center">
                <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} className="mr-2" />
                <span className="text-sm">Remember me</span>
              </label>
              <button type="button" onClick={handleForgotPasswordClick} className="text-pink-500 text-sm font-semibold underline-offset-2 hover:underline">
                Forgot Password?
              </button>
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg mb-4 duration-300 hover:scale-105 disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>

            {/* Register link */}
            <p className="text-white text-center text-sm pl-2">
              Don't have an account?{" "}
              <button type="button" onClick={handleRegisterClick} className="regBtn text-pink-500 font-semibold underline-offset-2 hover:underline">
                Register
              </button>
            </p>

            {/* Google login */}
            <div className="mt-4 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error("Google Login Failed");
                  setError("Google authentication failed. Please try again.");
                }}
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
    </div>
  );
};

export default LoginForm;
