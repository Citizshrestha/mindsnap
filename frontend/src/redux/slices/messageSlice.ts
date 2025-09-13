// src/slices/messageSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface MessageState {
  activeChat: string | null; // Username of the active chat
  currentConversationId: string | null; // ID from backend
  conversations: { [key: string]: string }; // Map username to conversationId
}

const initialState: MessageState = {
  activeChat: null,
  currentConversationId: null,
  conversations: {
    // Hardcoded for now; replace with dynamic data later
    Citiz: '688db1bfe25f2958b5329fe0',
    Sycon: '688e38f86097c017e18a23b0',
  
  },
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string>) => {
      state.activeChat = action.payload;
      state.currentConversationId = state.conversations[action.payload] || null;
    },
    setConversationMap: (state, action: PayloadAction<{ [key: string]: string }>) => {
      state.conversations = action.payload;
    },
  },
});

export const { setActiveChat, setConversationMap } = messageSlice.actions;
export default messageSlice.reducer;