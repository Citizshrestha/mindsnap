import { useState, useEffect, useCallback, useRef } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { socketService, type NotificationType } from "../../services/socketServices";
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

// Helper function to convert NotificationType to component Notification type
const convertSocketNotification = (socketNotification: NotificationType): Notification => {
  return {
    _id: socketNotification._id,
    sender: socketNotification.relatedUser ? {
      _id: socketNotification.relatedUser._id,
      username: socketNotification.relatedUser.username,
      profilePicture: socketNotification.relatedUser.profilePicture || ""
    } : undefined,
    type: socketNotification.type as "like" | "comment" | "follow" | "tag" | "message" | "follow_back",
    targetType: "Post" as "Post" | "Comment" | "Message" | "Story" | "Profile", // Default, should be from backend
    targetId: socketNotification.post ? { _id: socketNotification.post._id } : { _id: "" },
    createdAt: socketNotification.createdAt,
    read: socketNotification.read,
    message: socketNotification.message,
    action: socketNotification.action,
    isFollowing: socketNotification.isFollowing,
    reactionType: socketNotification.reactionType
  };
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
      console.log("📡 Fetching notifications...");
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
      
      console.log("✅ Notification response:", response.data);
      
      if (response.data.success) {
        // Only use real notifications from the server
        const dbNotifications = response.data.notifications || [];
        
        console.log(`📊 Processing ${dbNotifications.length} notifications`);
        
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
        
        // Filter out invalid notifications and notifications from deleted users
        const validNotifications = updatedNotifications.filter(
          (notif) => 
            notif && 
            notif.sender && 
            notif.sender?._id && 
            notif.sender.username && 
            notif.sender.username !== "Unknown" && 
            notif.sender._id !== null
        );
        
        // Sort by creation date (newest first)
        validNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        console.log(`✅ Displaying ${validNotifications.length} valid notifications`);
        
        // Update Redux store with fetched notifications
        dispatch(setNotifications(validNotifications));
        
        const unreadCount = validNotifications.filter((n: Notification) => !n.read).length;
        onUnreadCountChange(unreadCount);
        
        // Set loading to false after successful fetch
        dispatch(setLoading(false));
      } else {
        setError("Failed to fetch notifications");
        dispatch(setLoading(false));
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Error fetching notifications. Please try again.");
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

  // Add ref to track if we've fetched
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedRef.current) {
      console.log('🔔 Notification useEffect triggered - fetching notifications...');
      hasFetchedRef.current = true;
      fetchNotifications();
    }

    const handleNewNotification = (socketNotification: NotificationType) => {
      console.log("Received new notification via socket:", socketNotification);
      
      // Convert socket notification to component notification type
      const notification = convertSocketNotification(socketNotification);
      
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
    const handleNewMessageNotification = (socketNotification: NotificationType) => {
      console.log("Received new message notification:", socketNotification);
      
      // Convert socket notification to component notification type
      const notification = convertSocketNotification(socketNotification);
      
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

    // Listen for user deletion events to remove notifications from deleted users
    const handleUserAccountDeleted = (data: { deletedUserId: string; deletedUsername: string; message: string }) => {
      console.log(`🗑️ Removing notifications from deleted user: ${data.deletedUsername}`);
      
      // Fetch fresh notifications after user deletion
      fetchNotifications();
      
      // Show notification
      toast.info(`Notifications from ${data.deletedUsername} have been removed`);
    };

    const handleUserDeleted = (data: { deletedUserId: string; deletedUsername: string; message: string }) => {
      
      // Fetch fresh notifications after user deletion
      fetchNotifications();
    };

    socketService.onUserAccountDeleted(handleUserAccountDeleted);
    socketService.onUserDeleted(handleUserDeleted);

    return () => {
      socketService.offNotification(handleNewNotification);
      socketService.offUserAccountDeleted(handleUserAccountDeleted);
      socketService.offUserDeleted(handleUserDeleted);
      if (socket) {
        socket.off("newNotification", handleNewMessageNotification);
        socket.off("notificationDeleted", handleNotificationDeleted);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeeAll = useCallback(() => {
    setShowAll(true);
    setShowDropdown(false);
    dispatch(setNotificationModalOpen(true));
  }, [dispatch]);

  const closeAll = useCallback(() => {
    setShowDropdown(false);
    setShowAll(false);
    dispatch(setNotificationModalOpen(false));
    // Reset fetch ref so next open will fetch fresh data
    hasFetchedRef.current = false;
    onClose();
  }, [onClose, dispatch]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="relative">
      {showDropdown && (
        <div 
          className="fixed inset-0 bg-transparent z-[200000]" 
          onClick={closeAll}
        >
          <div 
            className="fixed right-4 top-20 w-96 bg-white/95 backdrop-blur-md rounded-[20px] shadow-2xl border border-gray-200/50 z-[200001] p-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-[#611DD0] text-xl font-bold">Notifications</h3>
              <button 
                onClick={closeAll} 
                className="text-gray-500 hover:text-[#611DD0] transition-colors p-1 hover:bg-gray-100 rounded-full"
              >
                <IoCloseSharp size={25} />
              </button>
            </div>

            {/* Notification list - Always visible */}
            <div className="space-y-2">
              {isLoading ? (
                <NotificationSkeleton count={5} />
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
                // Show only first 5 notifications in dropdown, all in modal
                (showAll ? notifications : notifications.slice(0, 5)).map((notification) => {
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
                
                if (!displayMessage || displayMessage.includes('_id') || displayMessage.includes('ObjectId')) {
                  const username = notification.sender?.username || "Someone";
                  const target = notification.targetType.toLowerCase();
                  let action: string = notification.type;

                  if (notification.type === "like" && notification.reactionType) {
                    const reactionMap: {[key: string]: string} = {
                      'like': 'liked', 'love': 'loved', 'haha': 'laughed at',
                      'wow': 'was amazed by', 'sad': 'felt sad about', 'angry': 'was angry about'
                    };
                    action = reactionMap[notification.reactionType] || 'reacted to';
                  }
                  
                  displayMessage = `${username} ${action} your ${target}`;
                }

                  return (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-start cursor-pointer ${
                        !notification.read ? "bg-blue-50/80 border-l-4 border-[#611DD0]" : "bg-white/50"
                      }`}
                    >
                      <img
                        src={notification.sender?.profilePicture || "/default-avatar.png"}
                        alt={`${notification.sender?.username || "Unknown"}'s profile`}
                        className="w-12 h-12 rounded-full mr-3 object-cover flex-shrink-0 ring-2 ring-gray-200"
                        onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 text-left mb-1 font-medium">
                          {displayMessage}
                        </p>
                        <span className="text-xs text-left text-gray-500 block">{formattedDate}</span>
                    
                        {notification.type === "follow_back" && <p className="mt-1 text-sm text-green-600 font-medium">Followed you back!</p>}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-[#611DD0] rounded-full flex-shrink-0 ml-2"></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-3">🔔</div>
                  <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
                </div>
              )}
              
              {/* See All Notifications Button */}
              {!showAll && notifications.length > 5 && (
                <button
                  onClick={handleSeeAll}
                  className="w-full mt-4 py-3 bg-[#611DD0] text-white font-semibold rounded-lg hover:bg-[#7d3ae8] transition-colors"
                >
                  See All Notifications
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Full Notifications Modal */}
      {showAll && (
        <div className="fixed inset-0 bg-black/50 z-[200002] flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-[#611DD0] text-2xl font-bold">All Notifications</h2>
              <button 
                onClick={() => setShowAll(false)} 
                className="text-gray-500 hover:text-[#611DD0] transition-colors p-1 hover:bg-gray-100 rounded-full"
              >
                <IoCloseSharp size={28} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-2">
              {notifications.map((notification) => {
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
                
                if (!displayMessage || displayMessage.includes('_id') || displayMessage.includes('ObjectId')) {
                  const username = notification.sender?.username || "Someone";
                  const target = notification.targetType.toLowerCase();
                  let action: string = notification.type;

                  if (notification.type === "like" && notification.reactionType) {
                    const reactionMap: {[key: string]: string} = {
                      'like': 'liked', 'love': 'loved', 'haha': 'laughed at',
                      'wow': 'was amazed by', 'sad': 'felt sad about', 'angry': 'was angry about'
                    };
                    action = reactionMap[notification.reactionType] || 'reacted to';
                  }
                  
                  displayMessage = `${username} ${action} your ${target}`;
                }

                return (
                  <div
                    key={notification._id}
                    onClick={() => {
                      handleNotificationClick(notification);
                      setShowAll(false);
                    }}
                    className={`p-3 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-start cursor-pointer ${
                      !notification.read ? "bg-blue-50/80 border-l-4 border-[#611DD0]" : "bg-white/50"
                    }`}
                  >
                    <img
                      src={notification.sender?.profilePicture || "/default-avatar.png"}
                      alt={`${notification.sender?.username || "Unknown"}'s profile`}
                      className="w-12 h-12 rounded-full mr-3 object-cover flex-shrink-0 ring-2 ring-gray-200"
                      onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 text-left mb-1 font-medium">
                        {displayMessage}
                      </p>
                      <span className="text-xs text-left text-gray-500 block">{formattedDate}</span>
                  
                      {notification.type === "follow_back" && <p className="mt-1 text-sm text-green-600 font-medium">Followed you back!</p>}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#611DD0] rounded-full flex-shrink-0 ml-2"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
