import logoImg from "../../../public/images/logoImg.png";
import socialImage from "../../../public/images/Screenshot 2025-05-08 132825.png";
import "./register.css";

const RegisterForm = () => {
  return (
    <div className="flex items-center justify-center w-full h-screen text-white">
      <div className="illustration w-1/2 flex justify-center items-center">
        <img
          src={socialImage}
          alt="Illustration"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="form-container w-1/2 p-8 flex flex-col items-center">
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
        <div className="formHeader flex justify-between gap-10 mb-5">
          <a
            className="loginToggle text-white text-lg font-semibold rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors"
            href="#"
          >
            Log in
          </a>
          <a
            className="registerToggle bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg px-4 py-2 hover:from-blue-600 hover:to-purple-600 transition-colors"
            href="#"
          >
            Register
          </a>
        </div>
        <div className="w-72">
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
              placeholder="Full Name"
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
              placeholder="Username"
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
              placeholder="Email"
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
              type="password"
              placeholder="Password"
              className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700 placeholder-white"
            />
          </div>
          <button className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg mb-4 duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50">
            Sign Up
          </button>
          <p className="text-white text-center text-sm pl-2">
            Have an account?{" "}
            <a
              className="text-pink-500 font-semibold underline-offset-2 hover:underline hover:scale-110 transition-all duration-200"
              href="#"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
