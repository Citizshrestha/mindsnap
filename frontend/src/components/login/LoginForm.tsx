// src/components/login/LoginForm.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../../api/auth';
import logoImg from '../../../public/images/logoImg.png';
import mobilePic from '../../../public/images/mobilePic.png';
import './login.css';
import axios from 'axios';

type FormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const LoginForm = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('componentBackground');
    return () => {
      document.body.classList.remove('componentBackground');
    };
  }, []);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, email: savedEmail, rememberMe: true }));
      }
    } catch (err) {
      console.error('Error accessing localStorage:', err);
      setError('Failed to load saved email.');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const response = await login(formData.email, formData.password);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('userId', response._id);
      toast.success('Login successful!');
      navigate('/home');
    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (axios.isAxiosError(err)){
        if (err.response){
            errorMessage = err.response?.data?.message || "Invalid Credentials";
        } else if (err.request){
          errorMessage = "Network Error please check your connection"
        } else {
          errorMessage = err.message || errorMessage;
        }
      }
      setError(errorMessage)
      toast.error(errorMessage);
      console.error("Login error",err)
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleForgotPasswordClick = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="flex flex-col items-center justify-center text-white">
      <div className="flex items-center mb-8">
        <div className="w-20 h-20 mr-10">
          <img src={logoImg} alt="SnapMind Logo" className="w-full h-full object-cover rounded-full" />
        </div>
        <h1 className="text-5xl font-bold font-['Lora']">MindSnap</h1>
      </div>
      <div className="flex items-center gap-10 space-x-14">
        <div className="phoneContainer">
          <div className="phone-screen">
            <img src={mobilePic} alt="Mobile preview" />
          </div>
        </div>
        <div className="formContainer p-3 bg-[#16024B] rounded-2xl flex flex-col items-center">
          <div className="form-group rounded-4xl">
            <button className="login-btn active">Log in</button>
            <button className="register-btn" onClick={handleRegisterClick}>
              Register
            </button>
          </div>
          <form onSubmit={handleSubmit} className="w-64 mx-10">
            <div className="relative mb-6">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                required
                className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700"
              />
            </div>
            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.104 0 2-.896 2-2V7a2 2 0 10-4 0v2c0 1.104.896 2 2 2zm6 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="mb-2 flex justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-pink-500 text-sm font-semibold underline-offset-2 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg mb-4 duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
            <p className="text-white text-center text-sm pl-2">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={handleRegisterClick}
                className="regBtn text-pink-500 font-semibold underline-offset-2 hover:underline"
                style={{ border: 'none' }}
              >
                Register
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;