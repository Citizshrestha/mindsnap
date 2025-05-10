// src/components/Register/RegisterForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../../api/auth';
import './register.css';

type FormData = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

const RegisterForm = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      const response = await register(formData.fullName, formData.username, formData.email, formData.password);
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('userId', response._id);
      toast.success('Registration successful! Please verify your email.');
      navigate('/home');
    } catch (err: unknown) {
      const errorMessage =  
        err  instanceof Error && err.message? err.message :'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLoginClick = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center w-full h-screen text-white">
      <div className="illustration w-1/2 flex justify-center items-center">
        <img
          src="/images/Screenshot 2025-05-08 132825.png"
          alt="Illustration"
          className="illustration-image w-full h-full object-contain"
        />
      </div>
      <div className="form-container w-1/2 p-8 flex flex-col items-center">
        <div className="flex items-center mb-8">
          <div className="w-20 h-20 mr-4">
            <img src="/images/logoImg.png" alt="MindSnap Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <h1 className="text-5xl font-bold">MindSnap</h1>
        </div>
        <div className="formHeader flex justify-between gap-10 mb-5">
          <button
            className="loginToggle text-white text-lg font-semibold rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors"
            onClick={handleLoginClick}
          >
            Log in
          </button>
          <button
            className="registerToggle bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg px-4 py-2 hover:from-blue-600 hover:to-purple-600 transition-colors"
            disabled
          >
            Register
          </button>
        </div>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 110 8 4 4 0 010-8z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-2a6 6 0 0112 0v2" />
              </svg>
            </div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700 placeholder-white"
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
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700 placeholder-white"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg mb-4 duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
          >
            {isLoading ? 'Registering...' : 'Sign Up'}
          </button>
          <p className="text-white text-center text-sm pl-2">
            Have an account?{' '}
            <button
              type="button"
              onClick={handleLoginClick}
              className="text-pink-500 font-semibold underline-offset-2 hover:underline hover:scale-110 transition-all duration-200"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;