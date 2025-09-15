import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { MessageType } from "../data/messageSample";

export const messageApi = createApi({
  reducerPath: "messageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/messages`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Messages"],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<
      MessageType,
      {
        conversationId: string;
        content: string;
        type: MessageType["messageType"];
        receiverId: string;
        replyTo?: string;
      }
    >({
      query: ({ conversationId, ...body }) => ({
        url: `send/${conversationId}`, // Ensure the URL includes conversationId
        method: "POST",
        body,
      }),
      invalidatesTags: ["Messages"],
    }),
    addReaction: builder.mutation<
      MessageType,
      { messageId: string; reaction: string }
    >({
      query: (body) => ({
        url: "/reaction",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Messages"],
    }),
    pinMessage: builder.mutation<MessageType, { messageId: string }>({
      query: (body) => ({
        url: "/pin",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Messages"],
    }),
    getMessages: builder.query<MessageType[], { conversationId: string }>({
      query: ({ conversationId }) => `/${conversationId}`,
      providesTags: ["Messages"],
    }),
    createConversation: builder.mutation<
      { _id: string; participants: string[]; isGroup: boolean; groupName?: string },
      { participantIds: string[]; isGroup: boolean; groupName?: string }
    >({
      query: (body) => ({
        url: "/conversation",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Messages"],
    }),
    getUser: builder.query<{ _id: string; username: string; profilePicture?: string }, string>({
      query: (userId) => `/users/${userId}`,
      providesTags: ["Messages"],
    }),
  }),
});

export const {
  useSendMessageMutation,
  useAddReactionMutation,
  usePinMessageMutation,
  useGetMessagesQuery,
  useCreateConversationMutation,
  useGetUserQuery,
} = messageApi;