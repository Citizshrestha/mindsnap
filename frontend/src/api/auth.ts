import axiosClient from "./axiosClient";
import axios from "axios";

interface LoginResponse {
    success: boolean;
    message: string;
    accessToken : string;
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
    token : string;
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



export const login = async(email: string, password: string): Promise<LoginResponse> => {
    const response = await axiosClient.post('/api/auth/login', {email,password});
    return response.data;
}

export const register = async (fullname: string, username: string, email: string, password: string): Promise<RegisterResponse> => {
  try {
    const response = await axiosClient.post('/api/auth/register', { fullname, username, email, password });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Register API Error:', error.response.data);
    } else {
      console.error('Register API Error:', (error as Error).message);
    }
    throw error;
  }
};
export const logout = async (): Promise<void> => {
  await axiosClient.post('/api/auth/logout');
  localStorage.removeItem('accessToken');
};

export const sendOtpEmailVerification = async(userId: string, email: string) : Promise<SendOtpResponse> => {
    const response = await axiosClient.post('/api/auth/sendOtpEmailVerification', {userId, email});
    return response.data;
}

export const verifyEmail = async (userId:string, otp:string ) : Promise <VerifyOtpResponse> => {
    const response = await axiosClient.post('/api/auth/verifyEmail', {userId, otp});
    return response.data;
}

export const isAuthenticated = async (userId: string) : Promise <isAuthResponse> =>  {
    const response = await axiosClient.post('/api/auth/isAuth',{userId});
    return response.data;
}

export const sendResetPasswordOtp = async(email: string) : Promise <ResetPasswordResponse> => {
    const response = await axiosClient.post('/api/auth/sendResetPasswordOtp',{email});
    return response.data;
}

export const verifyResetPasswordOtp  = async (userId: string, otp: string) : Promise<VerifyOtpResponse> => {
    const response = await axiosClient.post('/api/auth/verifyResetPasswordOtp',{userId,otp})
    return response.data;
}

export const resetPassword =  async(userId: string, newPassword: string) : Promise<ResetPasswordResponse> => {
    const response = await axiosClient.post('/api/auth/resetPassword', { userId, newPassword });
  return response.data;
}