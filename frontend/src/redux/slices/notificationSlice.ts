import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type{ Notification } from "../../services/socketServices";

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
}

const initialState: NotificationState = {
  unreadCount: parseInt(localStorage.getItem("unreadCount") || "0", 10),
  notifications: [],
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
      localStorage.setItem("unreadCount", action.payload.toString());
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
      localStorage.setItem("unreadCount", state.unreadCount.toString());
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
      localStorage.setItem("unreadCount", state.unreadCount.toString());
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Check if notification already exists to avoid duplicates
      const existingIndex = state.notifications.findIndex(
        (n: Notification) => n._id === action.payload._id
      );
      
      if (existingIndex === -1) {
        state.notifications.unshift(action.payload);
      } else {
        // Update existing notification
        state.notifications[existingIndex] = action.payload;
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n: Notification) => n._id === action.payload
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        localStorage.setItem("unreadCount", state.unreadCount.toString());
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      localStorage.setItem("unreadCount", "0");
    },
  },
});

export const { 
  setUnreadCount, 
  incrementUnreadCount, 
  decrementUnreadCount, 
  addNotification, 
  markNotificationAsRead, 
  clearNotifications 
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selector to access unreadCount from state
export const selectUnreadCount = (state: RootState) => state.notification.unreadCount;
export const selectNotifications = (state: RootState) => state.notification.notifications;