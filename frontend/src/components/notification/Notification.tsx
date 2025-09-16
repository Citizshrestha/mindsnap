import { useState, useEffect, useCallback } from "react";
import { IoCloseSharp } from "react-icons/io5";
import axiosClient from "../../api/axiosClient";
import { socketService } from "../../services/socketServices";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { sampleNotifications } from "../../data/sampleNotification";

interface TargetId {
  _id: string;
  [key: string]: string | number | boolean | undefined;
}

interface Notification {
  _id: string;
  sender?: {
    _id: string;
    username: string;
    profilePicture: string;
  } | null;
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

const Notification: React.FC<NotificationProps> = ({ onClose, onUnreadCountChange }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No authentication token available");
        return;
      }

      const response = await axiosClient.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Response:", response.data);
      if (response.data.success) {
        const combinedNotifications = [...sampleNotifications, ...(response.data.notifications || [])];
        const updatedNotifications = await Promise.all(
          combinedNotifications.map(async (notif) => {
            if (notif.type === "follow" && notif.sender?._id) {
              const followStatus = await checkFollowStatus(notif.sender._id);
              return { ...notif, isFollowing: followStatus };
            }
            return notif;
          })
        );
        updatedNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(updatedNotifications);
        const unreadCount = updatedNotifications.filter((n) => !n.read).length;
        onUnreadCountChange(unreadCount);
      } else {
        setError("Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Error fetching notifications. Please try again.");
    }
  }, [onUnreadCountChange]);

  const checkFollowStatus = async (senderId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return false;
      const response = await axiosClient.get(`/api/users/${senderId}/follow-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.isFollowing || false;
    } catch (err) {
      console.error("Error checking follow status:", err);
      return false;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await axiosClient.patch(`/api/notifications/${notificationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });

      setNotifications((prev) =>
        prev.map((notif) => (notif._id === notificationId ? { ...notif, read: true } : notif))
      );
      const unreadCount = notifications.filter((n) => !n.read).length - 1;
      onUnreadCountChange(unreadCount);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleFollowBack = async (senderId: string, notificationId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosClient.post(`/api/users/${senderId}/follow`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) => (notif._id === notificationId ? { ...notif, isFollowing: true } : notif))
        );
        toast.success("Followed back successfully");
      } else {
        toast.error("Failed to follow back");
      }
    } catch (err) {
      console.error("Error following back:", err);
      toast.error("Failed to follow back");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    if (notification.type === "follow" && notification.sender?._id) {
      closeAll();
      navigate(`/profile/${notification.sender._id}`);
    }
  };

  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      console.log("Received new notification via socket:", notification);
      if (notification.type === "follow_back" && notification.sender?._id) {
        setNotifications((prev) => {
          const updated = prev.map((notif) => {
            if (notif.type === "follow" && notif.sender?._id === notification.sender?._id) {
              return { ...notif, isFollowing: true };
            }
            return notif;
          });
          const newNotifications = [notification, ...updated].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const unreadCount = newNotifications.filter((n) => !n.read).length;
          onUnreadCountChange(unreadCount);
          return newNotifications;
        });
      } else if (notification.type === "follow" && notification.sender?._id) {
        checkFollowStatus(notification.sender._id).then((followStatus) => {
          setNotifications((prev) => {
            const updated = prev.map((notif) => (notif._id === notification._id ? { ...notif, isFollowing: followStatus } : notif));
            const newNotifications = [notification, ...updated].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const unreadCount = newNotifications.filter((n) => !n.read).length;
            onUnreadCountChange(unreadCount);
            return newNotifications;
          });
        });
      } else {
        setNotifications((prev) => {
          const newNotifications = [notification, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const unreadCount = newNotifications.filter((n) => !n.read).length;
          onUnreadCountChange(unreadCount);
          return newNotifications;
        });
      }
    };

    socketService.onNotification(handleNewNotification);

    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (token && userId && !socketService.isSocketConnected()) {
      socketService.connect(token, userId).then(() => {
        console.log("Socket connected for notifications");
        socketService.joinUserRoom(userId);
      }).catch((err: unknown) => {
        console.error("Failed to connect socket:", err);
        setError("Failed to connect to notification service.");
      });
    }

    fetchNotifications();

    return () => {
      socketService.offNotification(handleNewNotification);
    };
  }, [fetchNotifications, onUnreadCountChange]);

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
            notifications
              .filter((notification) => notification.sender)
              .slice(0, 5)
              .map((notification) => {
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
                        {notification.message || `${notification.sender?.username || "Someone"} ${notification.type}d your ${notification.targetType.toLowerCase()}`}
                      </p>
                      <span className="text-xs text-left text-gray-500 block mb-2">{formattedDate}</span>
                      {notification.type === "follow" && notification.sender?._id && !notification.isFollowing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowBack(notification.sender._id, notification._id);
                          }}
                          className="mt-1 px-3 py-1 bg-[#611DD0] text-white rounded-full hover:bg-[#5000B9] text-sm"
                        >
                          Follow Back
                        </button>
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="relative w-full max-w-md max-h-[80vh] bg-white rounded-2xl p-4 overflow-y-auto">
            <button onClick={closeAll} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <IoCloseSharp size={24} />
            </button>

            <h2 className="text-center text-[#611DD0] text-xl font-semibold mb-4">All Notifications</h2>

            {notifications.length > 0 ? (
              notifications
                .filter((notification) => notification.sender)
                .map((notification) => {
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
                          {notification.message || `${notification.sender?.username || "Someone"} ${notification.type}d your ${notification.targetType.toLowerCase()}`}
                        </p>
                        <span className="text-xs text-left text-gray-500 block mb-2">{formattedDate}</span>
                        {notification.type === "follow" && notification.sender?._id && !notification.isFollowing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowBack(notification.sender._id, notification._id);
                            }}
                            className="mt-1 px-3 py-1 bg-[#611DD0] text-white rounded-full hover:bg-[#5000B9] text-sm"
                          >
                            Follow Back
                          </button>
                        )}
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