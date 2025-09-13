// src/services/messageApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define types for your API responses
export interface User {
  _id: string;
  username: string;
}

export interface Message {
  _id: string;
  sender: { _id: string; username: string; profilePicture: string };
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio' | 'system';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: 'sent' | 'delivered' | 'seen';
  createdAt: string;
}

export const messageApi = createApi({
  reducerPath: 'messageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/messages',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getUsersForChatList: builder.query<User[], void>({
      query: () => '/users',
    }),
    sendMessage: builder.mutation({
      query: ({ conversationId, ...body }) => ({
        url: `send/${conversationId}`,
        method: 'POST',
        body,
      }),
    }),
    getMessages: builder.query<Message[], string>({
      query: (conversationId) => `/${conversationId}`,
    }),
  }),
});

export const {
  useGetUsersForChatListQuery,
  useSendMessageMutation,
  useGetMessagesQuery,
} = messageApi;