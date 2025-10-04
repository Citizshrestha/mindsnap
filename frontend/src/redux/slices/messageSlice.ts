import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface MessageState {
  activeChat: string | null;
  currentConversationId: string | null;
  conversations: { [key: string]: unknown };
  messages: { [conversationId: string]: MessageType[] }; // Store messages by conversation
  chatSummaries: { [chatId: string]: ChatSummary }; // Store chat summaries
  unreadMessageCount: number; // Total unread message count
  deletedMessages: string[]; // Track deleted message IDs
  selectedMessages: string[]; // Track selected message IDs for bulk operations
  isSelectionMode: boolean; // Whether we're in selection mode
}

interface ChatSummary {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  profilePicture?: string;
}

const initialState: MessageState = {
  activeChat: null,
  currentConversationId: null,
  conversations: {},
  messages: {},
  chatSummaries: {},
  unreadMessageCount: 0,
  deletedMessages: [],
  selectedMessages: [],
  isSelectionMode: false,
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setActiveChat(state, action: PayloadAction<string>) {
      state.activeChat = action.payload;
    },
    setCurrentConversationId(state, action: PayloadAction<string | null>) {
      state.currentConversationId = action.payload;
    },
    setConversationMap(state, action: PayloadAction<{ [key: string]: unknown }>) {
      state.conversations = action.payload;
    },
    addDeletedMessage(state, action: PayloadAction<string>) {
      if (!state.deletedMessages.includes(action.payload)) {
        state.deletedMessages.push(action.payload);
      }
    },
    removeDeletedMessage(state, action: PayloadAction<string>) {
      state.deletedMessages = state.deletedMessages.filter(id => id !== action.payload);
    },
    clearDeletedMessages(state) {
      state.deletedMessages = [];
    },
    // Selection mode actions
    toggleSelectionMode(state) {
      state.isSelectionMode = !state.isSelectionMode;
      if (!state.isSelectionMode) {
        state.selectedMessages = []; // Clear selections when exiting selection mode
      }
    },
    setSelectionMode(state, action: PayloadAction<boolean>) {
      state.isSelectionMode = action.payload;
      if (!state.isSelectionMode) {
        state.selectedMessages = []; // Clear selections when exiting selection mode
      }
    },
    toggleMessageSelection(state, action: PayloadAction<string>) {
      const messageId = action.payload;
      const index = state.selectedMessages.indexOf(messageId);
      if (index > -1) {
        state.selectedMessages.splice(index, 1); // Remove if already selected
      } else {
        state.selectedMessages.push(messageId); // Add if not selected
      }
    },
    selectAllMessages(state, action: PayloadAction<string[]>) {
      state.selectedMessages = action.payload;
    },
    clearSelectedMessages(state) {
      state.selectedMessages = [];
    },
    bulkAddDeletedMessages(state, action: PayloadAction<string[]>) {
      action.payload.forEach(messageId => {
        if (!state.deletedMessages.includes(messageId)) {
          state.deletedMessages.push(messageId);
        }
      });
    },
    // Real-time message actions
    addNewMessage(state, action: PayloadAction<{ conversationId: string; message: MessageType }>) {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
      
      // Update chat summary
      if (state.chatSummaries[conversationId]) {
        state.chatSummaries[conversationId].lastMessage = message.content;
        state.chatSummaries[conversationId].time = message.createdAt;
      }
    },
    updateChatSummary(state, action: PayloadAction<ChatSummary>) {
      const summary = action.payload;
      state.chatSummaries[summary.id] = summary;
    },
    setChatSummaries(state, action: PayloadAction<ChatSummary[]>) {
      const summaries = action.payload;
      state.chatSummaries = {};
      summaries.forEach(summary => {
        state.chatSummaries[summary.id] = summary;
      });
    },
    setUnreadMessageCount(state, action: PayloadAction<number>) {
      state.unreadMessageCount = action.payload;
    },
    incrementUnreadMessageCount(state) {
      state.unreadMessageCount += 1;
    },
    decrementUnreadMessageCount(state) {
      state.unreadMessageCount = Math.max(0, state.unreadMessageCount - 1);
    },
  },
});

export const { 
  setActiveChat, 
  setCurrentConversationId, 
  setConversationMap, 
  addDeletedMessage, 
  removeDeletedMessage, 
  clearDeletedMessages,
  toggleSelectionMode,
  setSelectionMode,
  toggleMessageSelection,
  selectAllMessages,
  clearSelectedMessages,
  bulkAddDeletedMessages,
  addNewMessage,
  updateChatSummary,
  setChatSummaries,
  setUnreadMessageCount,
  incrementUnreadMessageCount,
  decrementUnreadMessageCount
} = messageSlice.actions;
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