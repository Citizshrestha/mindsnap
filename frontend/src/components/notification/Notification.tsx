import { useState, useEffect, useCallback } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { socketService } from "../../services/socketServices";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { incrementUnreadMessageCount } from "../../redux/slices/messageSlice";
import {
  setNotifications,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  setLoading,
} from "../../redux/slices/notificationSlice";
import axiosClient from "../../api/axiosClient";
import { setNotificationModalOpen } from "../../redux/slices/uiSlice";
import type { RootState } from "../../redux/store";
// import LoadingSpinner from "../ui/LoadingSpinner";
import NotificationSkeleton from "../ui/NotificationSkeleton";
export interface TargetId {
  _id: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Notification {
  _id: string;
  sender?: {
    _id: string;
    username: string;
    profilePicture: string;
  };
  type: "like" | "comment" | "follow" | "tag" | "message" | "follow_back";
  targetType: "Post" | "Comment" | "Message" | "Story" | "Profile";
  targetId: TargetId;
  createdAt: string;
  read: boolean;
  message: string;
  action?: string;
  isFollowing?: boolean;
  reactionType?: string; 
}

interface NotificationProps {
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const Notification: React.FC<NotificationProps> = ({ onClose, onUnreadCountChange }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get notifications from Redux store
  const notifications = useSelector((state: RootState) => state.notification.notifications);
  const isLoading = useSelector((state: RootState) => state.notification.loading);
  const [showDropdown, setShowDropdown] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFollowStatus = async (senderId: string): Promise<boolean> => {
    // Skip API call for invalid/sample notification IDs
    if (!isValidObjectId(senderId)) {
      console.warn(`Skipping follow status check for invalid ID: ${senderId}`);
      return false;
    }
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token || typeof token !== "string") return false;
      const response = await axiosClient.get(`/api/users/${senderId}/follow-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.isFollowing || false;
    } catch (err) {
      console.error("Error checking follow status:", err);
      return false;
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const token = localStorage.getItem("accessToken");
      if (!token || typeof token !== "string") {
        setError("No authentication token available");
        dispatch(setLoading(false));
        return;
      }

      const response = await axiosClient.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        // Only use real notifications from the server
        const dbNotifications = response.data.notifications || [];
        
        // Process notifications - only check follow status for valid IDs
        const updatedNotifications = await Promise.all(
          dbNotifications.filter((notif: Notification) => notif && notif.sender && notif.sender?._id).map(async (notif: Notification) => {
            if (notif.type === "follow" && notif.sender?._id && isValidObjectId(notif.sender?._id)) {
              const followStatus = await checkFollowStatus(notif.sender?._id);
              return { ...notif, isFollowing: followStatus };
            }
            return notif;
          })
        );
        
        // Combine with sample notifications
        const combinedNotifications = updatedNotifications.filter(
          (notif) => notif.sender && notif.sender?._id && notif.sender.username && notif.sender.profilePicture
        );
        
        combinedNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Update Redux store with fetched notifications
        dispatch(setNotifications(combinedNotifications));
        
        const unreadCount = combinedNotifications.filter((n: Notification) => !n.read).length;
        onUnreadCountChange(unreadCount);
      } else {
        setError("Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Error fetching notifications. Please try again.");
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, onUnreadCountChange]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token || typeof token !== "string") return;

      await axiosClient.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update Redux store
      dispatch(markNotificationAsRead(notificationId));
      
      const unreadCount = notifications.filter((n: Notification) => !n.read).length - 1;
      onUnreadCountChange(unreadCount);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification);
    
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    // Close the notification dropdown
    onClose();
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case "follow":
      case "follow_back":
        // Navigate to the profile of the user who followed
        if (notification.sender?._id && isValidObjectId(notification.sender._id)) {
          navigate(`/profile/${notification.sender._id}`);
          toast.success(`Viewing ${notification.sender?.username || 'user'}'s profile`);
        } else {
          toast.error("Cannot navigate to profile - invalid user ID");
        }
        break;
        
      case "message":
        // Navigate to the conversation with the message sender
        // Use targetId if it contains conversation ID, otherwise use sender ID
        const conversationId = (notification.targetType === "Message" && notification.targetId?._id) 
          ? notification.targetId._id 
          : notification.sender?._id;
          
        if (conversationId && isValidObjectId(conversationId)) {
          navigate(`/messages?conversationId=${conversationId}`);
          toast.success(`Opening conversation with ${notification.sender?.username || 'user'}`);
        } else {
          toast.error("Cannot navigate to conversation - invalid conversation ID");
        }
        break;
        
      case "like":
      case "comment":
        // Navigate to home page with post ID as query parameter
        // Since there's no dedicated post route, we'll go to home where posts are displayed
        if (notification.targetId?._id && isValidObjectId(notification.targetId._id)) {
          navigate(`/home?postId=${notification.targetId._id}`);
          toast.info(`Navigating to ${notification.type} on your post`);
        } else {
          // Fallback to home page
          navigate('/home');
          toast.info(`Viewing your posts`);
        }
        break;
        
      case "tag":
        // Navigate to home page for tagged post
        if (notification.targetId?._id && isValidObjectId(notification.targetId._id)) {
          navigate(`/home?postId=${notification.targetId._id}`);
          toast.info("Navigating to post where you were tagged");
        } else {
          navigate('/home');
          toast.info("Viewing posts");
        }
        break;
        
      default:
        // Fallback to profile navigation for unknown types
        if (notification.sender?._id && isValidObjectId(notification.sender._id)) {
          navigate(`/profile/${notification.sender._id}`);
        } else {
          toast.info("Cannot navigate - invalid notification data");
        }
        break;
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNewNotification = (notification: Notification) => {
      console.log("Received new notification via socket:", notification);
      
      // Add notification to Redux store
      dispatch(addNotification(notification));
      
      // Show toast notification based on type
      if (notification.type === "message") {
        toast.info(`💬 ${notification.sender?.username}: ${notification.message}`);
        // Increment unread message count in sidebar
        dispatch(incrementUnreadMessageCount());
      } else if (notification.type === "like") {
        toast.success(`👍 ${notification.sender?.username} liked your post`);
      } else if (notification.type === "comment") {
        toast.info(`💬 ${notification.sender?.username} commented on your post`);
      } else if (notification.type === "follow") {
        toast.success(`👤 ${notification.sender?.username} started following you`);
      }
    };

    const handleNotificationDeleted = (data: { notificationId: string; messageId: string }) => {
      console.log("Notification deleted via socket:", data);
      
      // Remove notification from Redux store
      dispatch(removeNotification(data.notificationId));
      
      // Show toast that message was deleted
      toast.info("📭 A message notification was removed");
    };

    socketService.onNotification(handleNewNotification);

    // Listen for real-time message notifications
    const handleNewMessageNotification = (notification: Notification) => {
      console.log("Received new message notification:", notification);
      
      // Add notification to Redux store
      dispatch(addNotification(notification));
      
      // Show toast notification for message
      if (notification.type === "message") {
        toast.info(`💬 ${notification.sender?.username}: ${notification.message}`);
        // Increment unread message count in sidebar
        dispatch(incrementUnreadMessageCount());
      }
    };

    // Use the socket instance directly for the new notification event
    const socket = (socketService as any).socket;
    if (socket) {
      socket.on("newNotification", handleNewMessageNotification);
      socket.on("notificationDeleted", handleNotificationDeleted);
    }

    return () => {
      socketService.offNotification(handleNewNotification);
      if (socket) {
        socket.off("newNotification", handleNewMessageNotification);
        socket.off("notificationDeleted", handleNotificationDeleted);
      }
    };
  }, [dispatch, onUnreadCountChange]);

  const handleSeeAll = useCallback(() => {
    setShowAll(true);
    setShowDropdown(false);
    dispatch(setNotificationModalOpen(true));
  }, [dispatch]);

  const closeAll = useCallback(() => {
    setShowDropdown(false);
    setShowAll(false);
    dispatch(setNotificationModalOpen(false));
    onClose();
  }, [onClose, dispatch]);

  const currentYear = new Date().getFullYear();

  if (error) {
    return (
      <div className="fixed right-4 top-20 w-96 bg-white rounded-[20px] shadow-lg z-[999998] p-4">
        <p className="text-red-500">{error}</p>
        <button onClick={closeAll} className="mt-2 text-[#611DD0] text-xl cursor-pointer">
          <IoCloseSharp size={25} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {showDropdown && (
        <div className="fixed right-4 top-20 w-96 bg-white rounded-[20px] shadow-lg z-[999998] p-4 max-h-96 overflow-y-auto">
          <h3 className="text-[#611DD0] h-[5px] text-lg font-semibold mb-2">Notifications</h3>
          <button onClick={closeAll} className="absolute top-4 right-2 text-[#611DD0] text-xl cursor-pointer">
            <IoCloseSharp size={25} />
          </button>

          {/* Notification list */}
          {isLoading ? (
            <NotificationSkeleton count={3} />
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-500 mb-2">{error}</p>
              <button 
                onClick={fetchNotifications}
                className="text-[#611DD0] hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : notifications.length > 0 ? (
  notifications.slice(0, 5).map((notification) => {
    const date = new Date(notification.createdAt);
    const isCurrentYear = date.getFullYear() === currentYear;
    const formattedDate = date.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: isCurrentYear ? undefined : "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Format the notification message properly
    let displayMessage = notification.message;
    
    // If message contains raw _id or isn't properly formatted, create a proper message
    if (!displayMessage || displayMessage.includes('_id') || displayMessage.includes('ObjectId')) {
      const username = notification.sender?.username || "Someone";
      const reactionType = notification.type === "like" ? "reacted to" : notification.type;
      const target = notification.targetType.toLowerCase();
      
      displayMessage = `${username} ${reactionType} your ${target}`;
      
      // For like reactions, include the specific reaction type if available
      if (notification.type === "like" && notification.reactionType) {
        const reactionMap: {[key: string]: string} = {
          'like': 'liked',
          'love': 'loved',
          'haha': 'laughed at',
          'wow': 'was amazed by',
          'sad': 'felt sad about',
          'angry': 'felt angry about'
        };
        
        const reactionVerb = reactionMap[notification.reactionType] || 'reacted to';
        displayMessage = `${username} ${reactionVerb} your ${target}`;
      }
    }

    return (
      <div
        key={notification._id}
        onClick={() => handleNotificationClick(notification)}
        className={`p-2 mt-5 mb-0 border-b border-gray-200 last:border-0 hover:bg-gray-50 rounded transition-colors flex items-start cursor-pointer ${
          !notification.read ? "bg-blue-50" : "bg-white"
        }`}
      >
        <img
          src={notification.sender?.profilePicture || "/default-avatar.png"}
          alt={`${notification.sender?.username || "Unknown"}'s profile`}
          className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0"
          onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 text-left mb-1">
            {displayMessage}
          </p>
          <span className="text-xs text-left text-gray-500 block mb-2">{formattedDate}</span>
       
          {notification.type === "follow_back" && <p className="mt-1 text-sm text-green-600">Followed you back!</p>}
        </div>
      </div>
    );
  })
) : (
  <p className="text-sm text-gray-500 py-4 text-center">No notifications yet</p>
)}

          {notifications.length > 5 && (
            <button
              onClick={handleSeeAll}
              className="mt-3 w-full py-2 bg-[#611DD0] text-white rounded-lg hover:bg-[#5000B9] transition-colors text-sm font-medium"
            >
              See All Notifications
            </button>
          )}
        </div>
      )}

      {showAll && (
        <div className="fixed inset-0 bg-transparent bg-opacity-70  flex items-center justify-center z-[999999]">
          <div className="relative w-full max-w-md max-h-[80vh] bg-white rounded-2xl p-4 overflow-y-auto z-[999999]">
            <button onClick={closeAll} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <IoCloseSharp size={24} />
            </button>

            <h2 className="text-center text-[#611DD0] text-xl font-semibold mb-4">All Notifications</h2>

            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const date = new Date(notification.createdAt);
                const isCurrentYear = date.getFullYear() === currentYear;
                const formattedDate = date.toLocaleString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: isCurrentYear ? undefined : "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b border-gray-200 last:border-0 hover:bg-gray-50 rounded transition-colors flex items-start cursor-pointer ${
                      !notification.read ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <img
                      src={notification.sender?.profilePicture || "/default-avatar.png"}
                      alt={`${notification.sender?.username || "Unknown"}'s profile`}
                      className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0"
                      onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 text-left mb-1">
                        {notification.message ||
                          `${notification.sender?.username || "Someone"} ${notification.type}d your ${notification.targetType.toLowerCase()}`}
                      </p>
                      <span className="text-xs text-left text-gray-500 block mb-2">{formattedDate}</span>
            
                      {notification.type === "follow_back" && <p className="mt-1 text-sm text-green-600">Followed you back!</p>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 py-8 text-center">No notifications yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
