import axiosClient from "./axiosClient";
import axios from "axios";

interface EditPostResponse {
  success: boolean;
  message: string;
  post: {
    id: string;
    content: string;
    image?: string;
    user: {
      id: string;
      username: string;
      fullname: string;
      profilePicture?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export const editPost = async (
  postId: string,
  content: string,
  media?: File
): Promise<EditPostResponse> => {
  try {
    const formData = new FormData();
    formData.append("content", content);
    
    if (media) {
      formData.append("media", media);
    }

    const response = await axiosClient.put(`/api/posts/${postId}`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Edit Post API Error:", error.response.data);
    } else {
      console.error("Edit Post Error:", (error as Error).message);
    }
    throw error;
  }
};
