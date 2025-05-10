import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthContainer = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleToggleForm = () => {
    setShowLogin(!showLogin);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    // Implement your forgot password logic here
    console.log("Forgot password clicked");
  };

  if (showForgotPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#16024B]">
        <div className="w-full max-w-md p-8 rounded-lg">
          <h2 className="text-3xl font-bold mb-6 text-center">Reset Password</h2>
          <div className="mb-6">
            <p className="text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="relative mb-6">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700"
              />
            </div>
            <button
              className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg mb-4 duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
            >
              Send Reset Link
            </button>
            <button
              onClick={() => setShowForgotPassword(false)}
              className="w-full p-3 text-pink-500 font-semibold rounded-lg border border-pink-500 hover:bg-pink-500 hover:text-white transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showLogin ? (
        <LoginForm 
          onToggleForm={handleToggleForm} 
          onForgotPassword={handleForgotPassword} 
        />
      ) : (
        <RegisterForm onToggleForm={handleToggleForm} />
      )}
    </>
  );
};

export default AuthContainer;