// hooks/useSocketNotifications.ts
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { socketService } from "../services/socketServices";
import { 
  setUnreadCount, 
  addNotification, 
  incrementUnreadCount 
} from "../redux/slices/notificationSlice";

export const useSocketNotifications = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) return;

    const connectSocket = async () => {
      try {
        await socketService.connect(token, userId);
        socketService.joinUserRoom(userId);
        
        // Handle new notifications
        socketService.onNotification((notification) => {
          console.log("📩 New notification received:", notification);
          
          // Add notification to the store
          dispatch(addNotification(notification));
          
          // Increment unread count for new notifications
          if (!notification.read) {
            dispatch(incrementUnreadCount()); // Fixed: Use action that doesn't need prev value
          }
        });

        // Fetch initial unread count
        socketService.getSocket()?.emit("fetchUnreadCount", userId, (count: number) => {
          console.log("📊 Initial unread count:", count);
          dispatch(setUnreadCount(count));
        });
      } catch (err) {
        console.error("Socket connection error:", err);
      }
    };

    connectSocket();

    return () => {
      if (socketService.isSocketConnected()) {
        socketService.disconnect();
      }
    };
  }, [dispatch]);
};