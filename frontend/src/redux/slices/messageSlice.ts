import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface MessageState {
  activeChat: string | null;
  currentConversationId: string | null;
  conversations: { [key: string]: unknown };
}

const initialState: MessageState = {
  activeChat: null,
  currentConversationId: null,
  conversations: {},
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setActiveChat(state, action: PayloadAction<string>) {
      state.activeChat = action.payload;
    },
    setCurrentConversationId(state, action: PayloadAction<string>) {
      state.currentConversationId = action.payload;
    },
    setConversationMap(state, action: PayloadAction<{ [key: string]: unknown }>) {
      state.conversations = action.payload;
    },
  },
});

export const { setActiveChat, setCurrentConversationId, setConversationMap } = messageSlice.actions;
export default messageSlice.reducer;

// Example MessageType
export interface Receiver {
  _id: string;
  username?: string;
  profilePicture?: string;
}

export interface Sender {
  _id: string;
  username?: string;
  profilePicture?: string;
}

export interface ReplyTo {
  _id: string;
  content: string;
  sender: Sender;
  messageType: MessageType["messageType"];
}

export interface Reaction {
  user: string;
  reaction: string;
}

export type MessageType = {
  _id: string;
  content: string;
  messageType: "text";
  createdAt: string;
  status: string;
  sender: Sender;
  receiver: Receiver; 
  replyTo?: string | ReplyTo;
  isPinned?: boolean;
  reactions?: Reaction[];
  mediaUrl?: string;
  fileName?: string;
};

export const messageSample: MessageType[] = [
  {
    _id: "m1",
    content: "Hey, are you free tomorrow?",
    messageType: "text",
    createdAt: "2025-09-05T09:00:00Z",
    status: "sent",
    sender: { _id: "user1" },
    receiver: { _id: "user2" },
  },
  {
    _id: "m2",
    content: "Yes! What time?",
    messageType: "text",
    createdAt: "2025-09-05T09:01:00Z",
    status: "sent",
    sender: { _id: "user2" },
    receiver: { _id: "user1" },
  },
  {
    _id: "m3",
    content: "How about 3 PM?",
    messageType: "text",
    createdAt: "2025-09-05T09:02:00Z",
    status: "sent",
    sender: { _id: "user1" },
    receiver: { _id: "user2" },
  },
  {
    _id: "m4",
    content: "Can we meet today?",
    messageType: "text",
    createdAt: "2025-09-05T09:10:00Z",
    status: "sent",
    sender: { _id: "user1" },
    receiver: { _id: "user3" },
  },
  {
    _id: "m5",
    content: "Sure, at 6 PM?",
    messageType: "text",
    createdAt: "2025-09-05T09:11:00Z",
    status: "sent",
    sender: { _id: "user3" },
    receiver: { _id: "user1" },
  },
];