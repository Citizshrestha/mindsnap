import axiosClient from "./axiosClient";
import axios from "axios";

interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  _id: string;
  username: string;
  email: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  emailStatus: string;
  _id: string;
  fullname: string;
  username: string;
  email: string;
  token: string;
}

interface SendOtpResponse {
  success: boolean;
  message: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface isAuthResponse {
  success: boolean;
  message: string;
}

interface CheckUserExistsResponse {
  success: boolean;
  exists: boolean;
  message?: string;
}

interface GoogleLoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  _id: string;
  username: string;
  email: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
}


export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axiosClient.post("/api/auth/login", { email, password });
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("userId", response.data._id);
      localStorage.setItem("email", response.data.email);
      axiosClient.defaults.headers.Authorization = `Bearer ${response.data.accessToken}`;
    }
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Login API Error:", error.response.data);
    } else {
      console.error("Login API Error:", (error as Error).message);
    }
    throw error;
  }
};

export const register = async (
  fullname: string,
  username: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  try {
    const response = await axiosClient.post("/api/auth/register", { fullname, username, email, password });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Registration API Error:", error.response.data);
    } else {
      console.error("Registration Error:", (error as Error).message);
    }
    throw error;
  }
};

export const googleLogin = async (credential: string): Promise<GoogleLoginResponse> => {
  try {
    const res = await axiosClient.post("/api/auth/google-login", { credential });
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("userId", res.data._id);
      axiosClient.defaults.headers.Authorization = `Bearer ${res.data.accessToken}`;
    }
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Google Login API Error: ", error.response.data);
    } else {
      console.error("Google Login API Error: ", (error as Error).message);
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await axiosClient.post("/api/auth/logout");
    
    // Clear ALL localStorage data completely
    localStorage.clear();
    
    // Clear Authorization header
    delete axiosClient.defaults.headers.Authorization;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Logout API Error:", error.response.data);
    } else {
      console.error("Logout API Error:", (error as Error).message);
    }
    
    // Ensure complete cleanup even if server call fails
    localStorage.clear();
    delete axiosClient.defaults.headers.Authorization;
    throw error;
  }
};

export const sendOtpEmailVerification = async (userId: string): Promise<SendOtpResponse> => {
  try {
    const response = await axiosClient.post("/api/auth/sendOtpEmailVerification", { userId });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Send OTP Email Verification API Error:", error.response.data);
    } else {
      console.error("Send OTP Email Verification Error:", (error as Error).message);
    }
    throw error;
  }
};

export const verifyEmail = async (userId: string, otp: string): Promise<VerifyOtpResponse> => {
  try {
    const response = await axiosClient.post("/api/auth/verifyEmail", { userId, otp });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Verify Email API Error:", error.response.data);
    } else {
      console.error("Verify Email Error:", (error as Error).message);
    }
    throw error;
  }
};

export const isAuthenticated = async (userId: string): Promise<isAuthResponse> => {
  try {
    const response = await axiosClient.post("/api/auth/isAuth", { userId });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Is Authenticated API Error:", error.response.data);
    } else {
      console.error("Is Authenticated Error:", (error as Error).message);
    }
    throw error;
  }
};

export const sendResetPasswordOtp = async (email: string): Promise<ResetPasswordResponse & { userId?: string }> => {
  try {
    const response = await axiosClient.post("/api/auth/sendResetPasswordOtp", { email });
    if (response.data.success && response.data.userId) {
      localStorage.setItem("userId", response.data.userId); 
    }
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      console.error("Send Reset Password Otp Error: ", err.response.data);
    } else {
      console.error("Send Reset Password Otp Error:", (err as Error).message);
    }
    throw err;
  }
};

export const verifyResetPasswordOtp = async (userId: string, otp: string): Promise<VerifyOtpResponse> => {
  try {
    const response = await axiosClient.post("/api/auth/verifyResetPasswordOtp", { userId, otp });
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      console.error("Verify Reset Password OTP API Error:", err.response.data);
    } else {
      console.error("Verify Reset Password OTP API Error:", (err as Error).message);
    }
    throw err;
  }
};

export const resetPassword = async (userId: string, newPassword: string): Promise<ResetPasswordResponse> => {
  try {
    const response = await axiosClient.post("/api/auth/resetPassword", { userId, newPassword });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Reset Password API Error:", error.response.data);
    } else {
      console.error("Reset Password Error:", (error as Error).message);
    }
    throw error;
  }
};

export const checkUserExists = async (email: string): Promise<CheckUserExistsResponse> => {
  try {
    const response = await axiosClient.get(`/api/auth/check?email=${encodeURIComponent(email)}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Check User Exists API Error:", error.response.data);
    } else {
      console.error("Check User Exists API Error:", (error as Error).message);
    }
    throw error;
  }
};

export const changePassword = async (newPassword: string): Promise<ChangePasswordResponse> => {
  try {
    const response = await axiosClient.post("/api/auth/change-password", { 
      newPassword 
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Change Password API Error:", error.response.data);
    } else {
      console.error("Change Password Error:", (error as Error).message);
    }
    throw error;
  }
};