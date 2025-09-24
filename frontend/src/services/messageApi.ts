// services/messageApi.ts - Fixed version
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { MessageType } from "../data/messageSample";

interface MessagesResponse {
  success: boolean;
  messages: MessageType[];
  otherUser: {
    _id: string;
    username: string;
    profilePicture?: string;
    fullname?: string;
  };
  conversationId: string;
}

interface UserResponse {
  success: boolean;
  username: string;
  fullname: string;
  profilePicture?: string;
  email: string;
}

interface ChatUser {
  id: string;
  userId: string;
  name: string;
  username: string;
  profilePicture: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const messageApi = createApi({
  reducerPath: "messageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
    }/api`,
    prepareHeaders: (headers, { endpoint }) => {
      const token = localStorage.getItem("accessToken");
      console.log("API Token check:", token ? "Token exists" : "No token found");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      
      // Don't set Content-Type for file uploads (let browser set it with boundary)
      if (endpoint !== 'uploadMedia') {
        headers.set("Content-Type", "application/json");
      }
      
      return headers;
    },
  }),
  tagTypes: ["Messages", "Users", "ChatList"],
  endpoints: (builder) => ({
    getUsersForChatList: builder.query<ChatUser[], void>({
      query: () => "/messages/users",
      transformResponse: (response: ApiResponse<ChatUser[]>) => {
        console.log("ChatList API Response:", response);
        if (response?.success && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      },
      providesTags: ["ChatList"],
    }),

    getMessages: builder.query<MessagesResponse, { receiverId: string }>({
      query: ({ receiverId }) => `/messages/${receiverId}`,
      providesTags: (result, error, { receiverId }) => [
        { type: "Messages", id: receiverId },
      ],
    }),

    sendMessage: builder.mutation<
      MessageType,
      { receiverId: string; content: string }
    >({
      query: ({ receiverId, content }) => ({
        url: `/messages/send/${receiverId}`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { receiverId }) => [
        { type: "Messages", id: receiverId },
        "ChatList",
      ],
    }),

    getUserById: builder.query<UserResponse, string>({
      query: (userId) => `/users/${userId}`,
      providesTags: ["Users"],
    }),

    deleteMessage: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (messageId) => ({
        url: `/messages/${messageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Messages", "ChatList"],
    }),

    editMessage: builder.mutation<
      { success: boolean; message: string; data: MessageType },
      { messageId: string; content: string }
    >({
      query: ({ messageId, content }) => ({
        url: `/messages/edit/${messageId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: ["Messages", "ChatList"],
    }),

    markConversationAsSeen: builder.mutation<
      { success: boolean; message: string; updatedCount: number },
      string
    >({
      query: (conversationId) => ({
        url: `/messages/mark-seen/${conversationId}`,
        method: "POST",
      }),
      invalidatesTags: ["Messages", "ChatList"],
    }),

    uploadMedia: builder.mutation<
      { success: boolean; message: string; data: MessageType },
      { conversationId: string; file: File }
    >({
      query: ({ conversationId, file }) => {
        const formData = new FormData();
        formData.append('media', file);
        
        return {
          url: `/messages/upload/${conversationId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Messages", "ChatList"],
    }),
  }),
});

export const {
  useGetUsersForChatListQuery,
  useSendMessageMutation,
  useGetMessagesQuery,
  useGetUserByIdQuery,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useMarkConversationAsSeenMutation,
  useUploadMediaMutation,
} = messageApi;
