import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface MessageState {
  activeChat: string | null; // Username or group name
  currentConversationId: string | null; // ID from backend
  conversations: { [key: string]: string }; // Map username/group name to conversationId
}

const initialState: MessageState = {
  activeChat: null,
  currentConversationId: null,
  conversations: {
    // Hardcoded for now; replace with dynamic data later
    "Nocys": "conv1",
    "Abisha Karki": "conv2",
    "Manish Bhatta": "conv3",
    "Marshal Chaudhary": "conv4",
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
    setCurrentConversationId: (state, action: PayloadAction<string | null>) => {
      state.currentConversationId = action.payload;
    },
    setConversationMap: (state, action: PayloadAction<{ [key: string]: string }>) => {
      state.conversations = action.payload;
    },
  },
});

export const { setActiveChat, setCurrentConversationId, setConversationMap } = messageSlice.actions;
export default messageSlice.reducer;