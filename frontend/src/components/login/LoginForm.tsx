import { useState } from "react";
import "./login.css"

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');



  return (
    <div className="flex flex-col items-center justify-center text-white">
      <div className="flex items-center mb-8">
        <div className="w-20 h-20 mr-10">
          <img src="../../../public/images/logoImg.png" alt="SnapMind Logo" className="w-full h-full object-cover rounded-full" />
        </div>
        <h1 className="text-5xl font-bold">MindSnap</h1>
      </div>
      <div className=" flex items-center gap-10 space-x-14">
        <div className="phoneContainer">
          <div className="phone-screen">
            <img src="../../../public/images/mobilePic.png" alt="" />
          </div>
        </div>
        <div className="formContainer p-2 bg-[#16024B] rounded-2xl flex flex-col items-center">
        <div className="form-group rounded-4xl">
        <button className="login-btn active">Log in</button>
        <button className="register-btn">Register</button>
      </div>
              <div className="w-64 mx-10">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div className="relative mb-6">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.104 0 2-.896 2-2V7a2 2 0 10-4 0v2c0 1.104.896 2 2 2zm6 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-10 border-2 border-gray-600 rounded-lg bg-[#20035F] text-white text-sm focus:outline-none focus:border-blue-700"
                  />
                </div>
                <button
                  className="w-full p-3  bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold rounded-lg mb-4 duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                >
                  Log in
                </button>
                <p className="text-white text-center text-sm pl-2">
                  Don't have an account? <button className="regBtn text-pink-500 font-semibold underline-offset-2 hover:underline " style={{ border: "none" }}>
                    Register
                  </button>
                </p>
              </div>
            </div>
          </div>
      </div>
  )
}
    export default LoginForm;