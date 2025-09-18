import { useState, useEffect, useCallback } from "react";
import { IoCloseSharp } from "react-icons/io5";
import axiosClient from "../../api/axiosClient";
import { socketService } from "../../services/socketServices";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { sampleNotifications } from "../../data/sampleNotification";

export interface TargetId {
  _id: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Notification {
  _id: string;
  sender: {
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
      const token = localStorage.getItem("accessToken");
      if (!token || typeof token !== "string") {
        setError("No authentication token available");
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
          dbNotifications.map(async (notif: Notification) => {
            if (notif.type === "follow" && notif.sender._id && isValidObjectId(notif.sender._id)) {
              const followStatus = await checkFollowStatus(notif.sender._id);
              return { ...notif, isFollowing: followStatus };
            }
            return notif;
          })
        );
        
        // Combine with sample notifications
        const combinedNotifications = [...sampleNotifications, ...updatedNotifications].filter(
          (notif) => notif.sender && notif.sender._id && notif.sender.username && notif.sender.profilePicture
        );
        
        combinedNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(combinedNotifications);
        const unreadCount = combinedNotifications.filter((n: Notification) => !n.read).length;
        onUnreadCountChange(unreadCount);
      } else {
        setError("Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Error fetching notifications. Please try again.");
    }
  }, [onUnreadCountChange]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token || typeof token !== "string") return;

      await axiosClient.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev: Notification[]) =>
        prev.map((notif: Notification) => (notif._id === notificationId ? { ...notif, read: true } : notif))
      );
      const unreadCount = notifications.filter((n: Notification) => !n.read).length - 1;
      onUnreadCountChange(unreadCount);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    // Only navigate to profile if it's a valid user ID
    if (notification.sender._id && isValidObjectId(notification.sender._id)) {
      if (notification.type === "follow") {
        navigate(`/profile/${notification.sender._id}`);
      } else {
        navigate(`/profile/${notification.sender._id}`);
      }
    } else {
      console.warn("Cannot navigate to profile - invalid user ID:", notification.sender._id);
      toast.info("This is a sample notification - cannot navigate to profile");
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNewNotification = (notification: Notification) => {
      console.log("Received new notification via socket:", notification);
      
      // Update notifications list with new notification
      setNotifications((prev: Notification[]) => {
        const newNotifications = [notification, ...prev].sort(
          (a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const unreadCount = newNotifications.filter((n: Notification) => !n.read).length;
        onUnreadCountChange(unreadCount);
        return newNotifications;
      });
    };

    socketService.onNotification(handleNewNotification);

    return () => {
      socketService.offNotification(handleNewNotification);
    };
  }, [onUnreadCountChange, fetchNotifications]);

  const handleSeeAll = useCallback(() => {
    setShowAll(true);
    setShowDropdown(false);
  }, []);

  const closeAll = useCallback(() => {
    setShowDropdown(false);
    setShowAll(false);
    onClose();
  }, [onClose]);

  const currentYear = new Date().getFullYear();

  if (error) {
    return (
      <div className="absolute right-0 mt-2 w-96 bg-white rounded-[20px] shadow-lg z-50 p-4">
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
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-[20px] shadow-lg z-50 p-4 max-h-96 overflow-y-auto">
          <h3 className="text-[#611DD0] text-lg font-semibold mb-2">Notifications</h3>
          <button onClick={closeAll} className="absolute top-4 right-2 text-[#611DD0] text-xl cursor-pointer">
            <IoCloseSharp size={25} />
          </button>

          {notifications.length > 0 ? (
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

              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-200 last:border-0 hover:bg-gray-50 rounded transition-colors flex items-start cursor-pointer ${
                    !notification.read ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <img
                    src={notification.sender.profilePicture || "/default-avatar.png"}
                    alt={`${notification.sender.username || "Unknown"}'s profile`}
                    className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0"
                    onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 text-left mb-1">
                      {notification.message ||
                        `${notification.sender.username || "Someone"} ${notification.type}d your ${notification.targetType.toLowerCase()}`}
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
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-60">
          <div className="relative w-full max-w-md max-h-[80vh] bg-white rounded-2xl p-4 overflow-y-auto">
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
                      src={notification.sender.profilePicture || "/default-avatar.png"}
                      alt={`${notification.sender.username || "Unknown"}'s profile`}
                      className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0"
                      onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 text-left mb-1">
                        {notification.message ||
                          `${notification.sender.username || "Someone"} ${notification.type}d your ${notification.targetType.toLowerCase()}`}
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