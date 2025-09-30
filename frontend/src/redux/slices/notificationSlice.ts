import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { Notification } from "../../components/notification/Notification";

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
}

const initialState: NotificationState = {
  unreadCount: parseInt(localStorage.getItem("unreadCount") || "0", 10),
  notifications: JSON.parse(localStorage.getItem("notifications") || "[]"),
  loading: false,
}

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
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      // Update unread count based on actual notifications
      state.unreadCount = action.payload.filter(notif => !notif.read).length;
      localStorage.setItem("notifications", JSON.stringify(action.payload));
      localStorage.setItem("unreadCount", state.unreadCount.toString());
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Check if notification already exists to avoid duplicates
      const existingIndex = state.notifications.findIndex(
        (n: Notification) => n._id === action.payload._id
      );
      
      if (existingIndex === -1) {
        // Add new notification to the beginning of the array
        state.notifications.unshift(action.payload);
        
        // Only increment count if notification is unread
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      } else {
        // Update existing notification
        const wasRead = state.notifications[existingIndex].read;
        state.notifications[existingIndex] = action.payload;
        
        // Update count if read status changed
        if (wasRead && !action.payload.read) {
          state.unreadCount += 1;
        } else if (!wasRead && action.payload.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
      
      // Persist to localStorage
      localStorage.setItem("notifications", JSON.stringify(state.notifications));
      localStorage.setItem("unreadCount", state.unreadCount.toString());
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notificationIndex = state.notifications.findIndex(
        (n: Notification) => n._id === action.payload
      );
      
      if (notificationIndex !== -1) {
        const notification = state.notifications[notificationIndex];
        if (!notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          
          // Persist to localStorage
          localStorage.setItem("notifications", JSON.stringify(state.notifications));
          localStorage.setItem("unreadCount", state.unreadCount.toString());
        }
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
      
      // Persist to localStorage
      localStorage.setItem("notifications", JSON.stringify(state.notifications));
      localStorage.setItem("unreadCount", "0");
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notificationIndex = state.notifications.findIndex(
        (n: Notification) => n._id === action.payload
      );
      
      if (notificationIndex !== -1) {
        const notification = state.notifications[notificationIndex];
        
        // Decrease unread count if notification was unread
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        // Remove notification from array
        state.notifications.splice(notificationIndex, 1);
        
        // Persist to localStorage
        localStorage.setItem("notifications", JSON.stringify(state.notifications));
        localStorage.setItem("unreadCount", state.unreadCount.toString());
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      localStorage.setItem("notifications", "[]");
      localStorage.setItem("unreadCount", "0");
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { 
  setUnreadCount, 
  incrementUnreadCount, 
  decrementUnreadCount, 
  setNotifications,
  addNotification, 
  removeNotification,
  markNotificationAsRead,
  markAllAsRead,
  clearNotifications,
  setLoading
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectUnreadCount = (state: RootState) => state.notification.unreadCount;
export const selectNotifications = (state: RootState) => state.notification.notifications;
export const selectNotificationsLoading = (state: RootState) => state.notification.loading;
export const selectUnreadNotifications = (state: RootState) => 
  state.notification.notifications.filter(notif => !notif.read);