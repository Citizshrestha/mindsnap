import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface NotificationState {
  unreadCount: number;
}

const initialState: NotificationState = {
  unreadCount: parseInt(localStorage.getItem("unreadCount") || "0", 10),
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
      localStorage.setItem("unreadCount", action.payload.toString());
    },
  },
});

export const { setUnreadCount } = notificationSlice.actions;

export default notificationSlice.reducer;

// Selector to access unreadCount from state
export const selectUnreadCount = (state: RootState) => state.notification.unreadCount;