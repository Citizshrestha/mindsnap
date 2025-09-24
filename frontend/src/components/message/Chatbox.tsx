// src/components/Message/ChatBox.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { FiPhoneCall, FiVideo } from "react-icons/fi";
import { BsThreeDots, BsArrowClockwise } from "react-icons/bs";
import {
  RiSendPlaneFill,
  RiDeleteBinLine,
  RiEditLine,
  RiMore2Fill,
} from "react-icons/ri";
import { IoCheckmarkDone, IoCheckmark, IoWarning } from "react-icons/io5";
import backgroundChatImage from "../../../public/images/background.png";
import type { MessageType } from "../../data/messageSample";
import MediaUploadButton from "./MediaUploadButton";
import MediaPreviewModal from "./MediaPreviewModal";
import MessageContent from "./MessageContent";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetMessagesQuery,
  useGetUserByIdQuery,
  useDeleteMessageMutation,
  useEditMessageMutation,
} from "../../services/messageApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { socketService } from "../../services/socketServices";

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) throw new Error("VITE_ENCRYPTION_KEY is not set in .env");

interface ChatBoxProps {
  activeChat: string;
  messages: MessageType[];
  onSendMessage: (msg: Omit<MessageType, "_id">) => void;
  onRetryMessage: (messageId: string) => void;
  isConnected: boolean;
  currentConversationId?: string | null;
}

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  fullname?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface MessagesResponse {
  success: boolean;
  messages: MessageType[];
  otherUser: User;
  conversationId: string;
}

interface UserResponse {
  success: boolean;
  username: string;
  fullname: string;
  profilePicture?: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string;
}

// Custom hook to get other user info
const useOtherUserInfo = (conversationId: string | null) => {
  const { data: messagesResponse } = useGetMessagesQuery(
    conversationId ? { receiverId: conversationId } : skipToken,
    { skip: !conversationId }
  );

  const { data: userResponse } = useGetUserByIdQuery(conversationId || "", {
    skip: !conversationId,
  });

  const otherUserInfo = useMemo(() => {
    // Priority 1: From messages API
    if (
      messagesResponse &&
      typeof messagesResponse === "object" &&
      "success" in messagesResponse &&
      messagesResponse.success
    ) {
      const messagesData = messagesResponse as MessagesResponse;
      if (messagesData.otherUser) {
        return messagesData.otherUser;
      }
    }

    // Priority 2: From user API
    if (
      userResponse &&
      typeof userResponse === "object" &&
      "username" in userResponse
    ) {
      const userData = userResponse as UserResponse;
      return {
        _id: conversationId!,
        username: userData.username,
        fullname: userData.fullname,
        profilePicture: userData.profilePicture,
        isOnline: userData.isOnline,
        lastSeen: userData.lastSeen,
      };
    }

    return null;
  }, [messagesResponse, userResponse, conversationId]);

  return otherUserInfo;
};

const ChatBox: React.FC<ChatBoxProps> = ({
  activeChat,
  messages,
  onSendMessage,
  onRetryMessage,
  isConnected,
  currentConversationId,
}) => {
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [mediaCaption, setMediaCaption] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedTypingRef = useRef<NodeJS.Timeout | null>(null);
  const userId = useSelector((state: RootState) => state.user._id);
  const currentUser = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  // Use the custom hook to get other user info
  const otherUserInfo = useOtherUserInfo(currentConversationId || null);

  // Use the messages query to fetch messages when conversation changes
  const {
    data: messagesResponse,
    isLoading: messagesLoading,
    refetch: refetchMessages,
    error: messagesError,
  } = useGetMessagesQuery(
    currentConversationId ? { receiverId: currentConversationId } : skipToken,
    {
      skip: !currentConversationId,
      refetchOnMountOrArgChange: true,
    }
  );

  // Delete and Edit mutations
  const [deleteMessage] = useDeleteMessageMutation();
  const [editMessage] = useEditMessageMutation();

  // Fixed: Wrap fetchedMessages in useMemo to prevent unnecessary re-renders
  const fetchedMessages = useMemo(() => {
    if (messagesResponse && typeof messagesResponse === "object") {
      if ("success" in messagesResponse && messagesResponse.success) {
        return (messagesResponse as MessagesResponse).messages || [];
      }
      // Handle case where the response might be the messages array directly
      if (Array.isArray(messagesResponse)) {
        return messagesResponse;
      }
    }
    return [];
  }, [messagesResponse]);

  // Merge fetched messages with live (socket) messages for instant UI updates
  const displayMessages = useMemo(() => {
    const byId = new Map<string, MessageType>();
    [...fetchedMessages, ...messages].forEach((m) => {
      if (!m) return;
      byId.set(m._id, m);
    });

    // REVERSED: Show latest messages last (descending by createdAt) - typical modern chat behavior
    return Array.from(byId.values()).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [fetchedMessages, messages]);

  // Debug logging
  useEffect(() => {
    console.log("ChatBox Debug:", {
      currentConversationId,
      activeChat,
      displayMessagesCount: displayMessages.length,
      fetchedMessagesCount: fetchedMessages.length,
      propMessagesCount: messages.length,
      otherUserInfo,
      messagesLoading,
      messagesError,
    });
  }, [
    currentConversationId,
    activeChat,
    displayMessages,
    fetchedMessages,
    messages,
    otherUserInfo,
    messagesLoading,
    messagesError,
  ]);

  // Check if user is near the bottom of the chat (where latest messages are)
  const checkScrollPosition = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold from bottom

    setIsNearBottom(nearBottom);

    // If user is near bottom (latest), enable auto-scroll
    if (nearBottom) {
      setIsAutoScrollEnabled(true);
    }
  }, []);

  // Scroll to bottom function (where latest messages are)
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (scrollRef.current && isAutoScrollEnabled) {
        // Force scroll to bottom - use scrollTop for immediate effect
        const scrollContainer = scrollRef.current;
        const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        
        if (behavior === "auto") {
          // Immediate scroll for initial load
          scrollContainer.scrollTop = maxScroll;
        } else {
          // Smooth scroll for user interactions
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: behavior,
          });
        }
      }
    },
    [isAutoScrollEnabled]
  );

  // Scroll to bottom on render and whenever messages change (to show latest)
  useEffect(() => {
    if (displayMessages.length > 0) {
      setIsAutoScrollEnabled(true);
      // Use multiple timeouts to ensure scroll works reliably
      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
      
      // Additional timeout for stubborn cases
      setTimeout(() => {
        scrollToBottom("auto");
      }, 300);
    }
  }, [displayMessages, scrollToBottom]);

  // Auto-scroll to bottom when conversation changes (higher priority with longer timeout)
  useEffect(() => {
    if (currentConversationId && displayMessages.length > 0) {
      setIsAutoScrollEnabled(true);
      
      // Immediate scroll attempt
      setTimeout(() => {
        scrollToBottom("auto");
      }, 50);
      
      // Follow-up scroll attempts to ensure it works
      setTimeout(() => {
        scrollToBottom("auto");
      }, 250);
      
      setTimeout(() => {
        scrollToBottom("auto");
      }, 500);
    }
  }, [currentConversationId, scrollToBottom]);

  // Enhanced initial load scroll - specifically for when chat first opens
  useEffect(() => {
    if (currentConversationId && displayMessages.length > 0 && scrollRef.current) {
      // Force scroll to bottom on initial load
      const forceScrollToBottom = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };

      // Multiple attempts with increasing delays to handle all scenarios
      forceScrollToBottom(); // Immediate
      setTimeout(forceScrollToBottom, 100);
      setTimeout(forceScrollToBottom, 250);
      setTimeout(forceScrollToBottom, 500);
      setTimeout(forceScrollToBottom, 1000); // Additional timeout for slow loading
    }
  }, [currentConversationId, displayMessages.length]);

  // Additional effect to ensure scroll to bottom when messages are first loaded
  useEffect(() => {
    if (displayMessages.length > 0 && scrollRef.current && !messagesLoading) {
      // Wait for DOM to update then scroll to bottom
      const scrollToBottomAfterRender = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          setIsAutoScrollEnabled(true);
          setIsNearBottom(true);
        }
      };

      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollToBottomAfterRender();
        // Additional timeout as backup
        setTimeout(scrollToBottomAfterRender, 100);
      });
    }
  }, [displayMessages.length, messagesLoading]);

  // Handle scroll events
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      checkScrollPosition();
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [checkScrollPosition]);

  // Auto-scroll to bottom when new message is sent by current user
  useEffect(() => {
    if (displayMessages.length > 0 && isNearBottom) {
      const latestMessage = displayMessages[displayMessages.length - 1];
      if (
        latestMessage?.sender &&
        latestMessage.sender._id === userId
      ) {
        setIsAutoScrollEnabled(true);
        setTimeout(() => {
          scrollToBottom("smooth");
        }, 100);
      }
    }
  }, [displayMessages, userId, scrollToBottom, isNearBottom]);

  // Listen for typing events from other users
  useEffect(() => {
    if (!isConnected || !currentConversationId) return;

    const handleTypingEvent = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== userId) {
        setOtherUserTyping(data.isTyping);

        if (data.isTyping) {
          setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      }
    };

    socketService.getSocket()?.on("userTyping", handleTypingEvent);

    return () => {
      socketService.getSocket()?.off("userTyping", handleTypingEvent);
    };
  }, [isConnected, currentConversationId, userId]);

  // Fixed: Wrap isMe in useCallback and guard against missing sender
  const isMe = useCallback(
    (msg: MessageType) => {
      if (!msg || !msg.sender) return false;
      const senderId = msg.sender._id;
      return senderId === userId;
    },
    [userId]
  );

  const formatTimestamp = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return "";
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.setDate(now.getDate() - 1)).toDateString() ===
      date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return (
        date.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "sending":
        return (
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse" />
        );
      case "sent":
        return <IoCheckmark className="w-3 h-3 text-gray-400" />; // Single tick - gray
      case "delivered":
        return <IoCheckmarkDone className="w-3 h-3 text-gray-400" />; // Double tick - gray
      case "seen":
        return <IoCheckmarkDone className="w-3 h-3 text-purple-600" />; // Double tick - purple (message bg color)
      case "failed":
        return <IoWarning className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  const getSenderProfilePicture = useCallback(
    (msg: MessageType) => {
      if (msg.sender?.profilePicture) {
        return msg.sender.profilePicture;
      }

      if (isMe(msg)) {
        return (
          currentUser.profilePicture ||
          `https://ui-avatars.com/api/?name=You&background=611DD0&color=fff`
        );
      } else {
        return (
          otherUserInfo?.profilePicture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            activeChat
          )}&background=611DD0&color=fff`
        );
      }
    },
    [isMe, currentUser.profilePicture, otherUserInfo, activeChat]
  );

  const getSenderName = useCallback(
    (msg: MessageType) => {
      if (msg.sender?.username && msg.sender.username !== "Unknown User") {
        return isMe(msg) ? "You" : msg.sender.username;
      }
      return isMe(msg) ? "You" : activeChat;
    },
    [isMe, activeChat]
  );

  const handleTyping = useCallback(() => {
    if (!isConnected || !currentConversationId) return;

    if (debouncedTypingRef.current) {
      clearTimeout(debouncedTypingRef.current);
    }

    socketService.startTyping(currentConversationId);

    debouncedTypingRef.current = setTimeout(() => {
      socketService.stopTyping(currentConversationId);
      debouncedTypingRef.current = null;
    }, 1000);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(currentConversationId);
      typingTimeoutRef.current = null;
    }, 1500);
  }, [isConnected, currentConversationId]);


  // COMPLETELY FIXED: Handle send message without duplicates
  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !currentConversationId || isSending) return;

    setIsSending(true);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please log in to send messages");
      navigate("/login");
      setIsSending(false);
      return;
    }

    const newMessage: Omit<MessageType, "_id"> = {
      receiver: {
        _id: currentConversationId,
        username: otherUserInfo?.username || activeChat,
        profilePicture: otherUserInfo?.profilePicture,
      },
      content: messageText,
      messageType: "text",
      createdAt: new Date().toISOString(),
      status: "sending",
      sender: {
        _id: userId,
        username: "You",
        profilePicture: "",
      },
    };

    try {
      // Delegate send to parent handler to avoid double-sends
      onSendMessage(newMessage);

      setMessageText("");

      // Clear typing indicators
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (debouncedTypingRef.current) {
        clearTimeout(debouncedTypingRef.current);
        debouncedTypingRef.current = null;
      }
      socketService.stopTyping(currentConversationId);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");

      // Parent handles failure state; nothing here
    } finally {
      setIsSending(false);
    }
  }, [
    messageText,
    currentConversationId,
    isSending,
    navigate,
    userId,
    onSendMessage,
    activeChat,
    otherUserInfo,
  ]);

  // Handle delete message with modern confirmation
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId).unwrap();
      toast.success("Message deleted successfully");
      refetchMessages();

      // Emit socket event for real-time deletion
      if (isConnected && currentConversationId) {
        socketService.getSocket()?.emit("deleteMessage", {
          messageId,
          conversationId: currentConversationId,
        });
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    } finally {
      setShowDeleteModal(null);
      setShowDropdown(null);
    }
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (messageId: string) => {
    setShowDropdown(showDropdown === messageId ? null : messageId);
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = (messageId: string) => {
    setShowDeleteModal(messageId);
    setShowDropdown(null);
  };

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".dropdown-menu") &&
        !target.closest(".dropdown-trigger")
      ) {
        setShowDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle edit message
  const handleEditMessage = (message: MessageType) => {
    if (message.messageType !== "text") {
      toast.error("Only text messages can be edited");
      return;
    }
    setEditingMessage({ id: message._id, content: message.content });
    setMessageText(message.content);
  };

  // Handle save edited message
  const handleSaveEdit = async () => {
    if (!editingMessage || !messageText.trim()) return;

    try {
      await editMessage({
        messageId: editingMessage.id,
        content: messageText,
      }).unwrap();

      toast.success("Message updated successfully");
      setEditingMessage(null);
      setMessageText("");
      refetchMessages();

      // Emit socket event for real-time edit
      if (isConnected && currentConversationId) {
        socketService.getSocket()?.emit("editMessage", {
          messageId: editingMessage.id,
          content: messageText,
          conversationId: currentConversationId,
        });
      }
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast.error("Failed to edit message");
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageText("");
  };

  // Handle file selection - show preview modal
  const handleFileSelection = (files: File[]) => {
    if (!files.length || !currentConversationId) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ];
    const maxSize = 10 * 1024 * 1024;

    // Validate all files
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type) || file.size > maxSize
    );
    if (invalidFiles.length > 0) {
      toast.error(
        "Please select valid image (JPEG, PNG, GIF, WebP) or video (MP4) files under 10MB each"
      );
      return;
    }

    // Set selected media and show preview modal
    setSelectedMedia(files);
    setShowMediaPreview(true);
    setMediaCaption("");
  };

  // Handle sending media from preview modal
  const handleSendMedia = async () => {
    if (!selectedMedia.length || !currentConversationId) return;

    setIsUploading(true);

    try {
      const token = localStorage.getItem("accessToken");

      // Upload and send each media file
      for (const file of selectedMedia) {
        const formData = new FormData();
        formData.append("media", file);

        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
          }/api/messages/upload/${currentConversationId}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Upload failed");
        }

        const result = await response.json();

        if (result.success && result.data) {
          const backendMessage = result.data;

          // Create media message without showing the Cloudinary URL in content
          const newMessage: Omit<MessageType, "_id"> = {
            receiver: {
              _id: currentConversationId,
              username: otherUserInfo?.username || activeChat,
              profilePicture: otherUserInfo?.profilePicture,
            },
            content: backendMessage.content, // Keep URL for backend compatibility but won't be displayed
            messageType: backendMessage.messageType,
            createdAt: backendMessage.createdAt || new Date().toISOString(),
            status: "sent",
            sender: {
              _id: userId,
              username: "You",
              profilePicture: "",
            },
            mediaUrl: backendMessage.content, // Store media URL separately
            fileName: backendMessage.fileName || file.name,
          };

          // Don't call onSendMessage here since the backend already emits via socket
          // The socket will handle adding the message to the UI
          console.log("Media uploaded successfully, socket will handle UI update");
        }
      }

      // Send caption as separate text message if provided
      if (mediaCaption.trim()) {
        const captionMessage: Omit<MessageType, "_id"> = {
          receiver: {
            _id: currentConversationId,
            username: otherUserInfo?.username || activeChat,
            profilePicture: otherUserInfo?.profilePicture,
          },
          content: mediaCaption.trim(),
          messageType: "text",
          createdAt: new Date().toISOString(),
          status: "sending",
          sender: {
            _id: userId,
            username: "You",
            profilePicture: "",
          },
        };

        onSendMessage(captionMessage);
      }

      toast.success(`${selectedMedia.length} media file(s) sent successfully`);

      // Close modal and reset
      setShowMediaPreview(false);
      setSelectedMedia([]);
      setMediaCaption("");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload media"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Close media preview modal
  const handleCloseMediaPreview = () => {
    setShowMediaPreview(false);
    setSelectedMedia([]);
    setMediaCaption("");
  };

  // Remove media from selection
  const handleRemoveMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    setSelectedMedia(newMedia);
    if (newMedia.length === 0) {
      handleCloseMediaPreview();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleSaveEdit();
      } else {
        // Do not attempt to send if a file picker is focused
        const active = document.activeElement as HTMLElement | null;
        const isFileInput =
          active &&
          active.tagName.toLowerCase() === "input" &&
          (active as HTMLInputElement).type === "file";
        if (!isFileInput) {
          handleSend();
        }
      }
    } else if (e.key === "Escape" && editingMessage) {
      handleCancelEdit();
    }
  };

  const handleRetry = (messageId: string) => {
    onRetryMessage(messageId);
  };

  const groupMessagesByDate = () => {
    const grouped: { [key: string]: MessageType[] } = {};
    displayMessages.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(msg);
    });
    return grouped;
  };

  const renderDateSeparator = (date: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let displayDate = date;

    // Guard invalid date strings
    if (!date || isNaN(new Date(date).getTime())) {
      return null;
    }

    if (date === today) displayDate = "Today";
    else if (date === yesterday) displayDate = "Yesterday";
    else
      displayDate = new Date(date).toLocaleDateString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
          {displayDate}
        </div>
      </div>
    );
  };

  const renderMessageContent = (msg: MessageType) => {
    return <MessageContent message={msg} />;
  };

  // Scroll to latest button handler (now scrolls to bottom where latest messages are)
  const handleScrollToLatest = () => {
    setIsAutoScrollEnabled(true);
    scrollToBottom("smooth");
  };

  if (!activeChat || !currentConversationId) {
    return (
      <main className="flex-1 bg-[#F5F6FA] flex flex-col overflow-y-auto h-[calc(100vh-80px)] w-[1120px]">
        <div className="flex-1 flex flex-col items-center justify-center h-full text-center text-gray-500">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <RiSendPlaneFill className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p>Select a chat from the list to start messaging</p>
        </div>
      </main>
    );
  }

  const groupedMessages = groupMessagesByDate();

  return (
    <main className="flex-1 bg-[#F5F6FA] flex flex-col overflow-y-auto  h-[calc(100vh-80px)] w-[1120px]">
      {/* FIXED HEADER - Now sticky/fixed */}
      <div className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src={
              otherUserInfo?.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                activeChat
              )}&background=611DD0&color=fff`
            }
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                activeChat
              )}&background=611DD0&color=fff`;
            }}
          />
          <div>
            <h2 className="font-bold text-xl text-gray-800">
              {otherUserInfo?.fullname || otherUserInfo?.username || activeChat}
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="text-sm text-gray-500">
                {isConnected ? "Online" : "Offline"}
              </span>
              {otherUserTyping && (
                <span className="text-sm text-purple-600 animate-pulse">
                  typing...
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white">
          <button className="h-10 w-10 bg-[#611DD0] rounded-full flex justify-center items-center hover:bg-[#4e16a8] transition">
            <FiPhoneCall size={20} />
          </button>
          <button className="h-10 w-10 bg-[#611DD0] rounded-full flex justify-center items-center hover:bg-[#4e16a8] transition">
            <FiVideo size={20} />
          </button>
          <button className="h-10 w-10 bg-[#611DD0] rounded-full flex justify-center items-center hover:bg-[#4e16a8] transition">
            <BsThreeDots size={24} />
          </button>
        </div>
      </div>

      {/* Messages Area - Adjusted for fixed header */}
      <div className="relative flex-1 flex flex-col">
        <div
          ref={scrollRef}
          style={{
            backgroundImage: `url(${backgroundChatImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay",
            backgroundColor: "rgba(245, 246, 250, 0.9)",
          }}
          className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-100"
        >
          {messagesLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <RiSendPlaneFill className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p>Send a message to start the conversation with {activeChat}</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  {renderDateSeparator(date)}
                  {dateMessages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${
                        isMe(msg) ? "justify-end" : "justify-start"
                      } mb-3 relative group`}
                      onMouseEnter={() => setHoveredMessage(msg._id)}
                      onMouseLeave={() => setHoveredMessage(null)}
                    >
                      {!isMe(msg) && (
                        <img
                          src={getSenderProfilePicture(msg)}
                          alt={getSenderName(msg)}
                          className="w-8 h-8 rounded-full mr-2 self-end mb-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              getSenderName(msg)
                            )}&background=611DD0&color=fff`;
                          }}
                        />
                      )}

                      <div
                        className={`rounded-2xl max-w-xs relative ${
                          msg.messageType !== "text"
                            ? "p-1" // Minimal padding for media messages with transparent background
                            : isMe(msg)
                            ? "bg-purple-600 text-white rounded-br-none p-3"
                            : "bg-white text-gray-800 rounded-bl-none shadow-sm p-3"
                        } ${msg.status === "failed" ? "opacity-80" : ""}`}
                      >
                        {!isMe(msg) && (
                          <div className="text-xs font-semibold mb-1 text-purple-600">
                            {getSenderName(msg)}
                          </div>
                        )}

                        {renderMessageContent(msg)}
                        {/* Timestamp and status - different styling for media vs text messages */}
                        {msg.messageType !== "text" ? (
                          // For media messages: overlay timestamp on bottom-right of media
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                            <span>{formatTimestamp(msg.createdAt)}</span>
                            {isMe(msg) && (
                              <span>{getMessageStatusIcon(msg.status)}</span>
                            )}
                          </div>
                        ) : (
                          // For text messages: normal positioning
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span
                              className={`text-xs opacity-70 ${
                                isMe(msg) ? "text-white" : "text-gray-500"
                              }`}
                            >
                              {formatTimestamp(msg.createdAt)}
                            </span>
                            {isMe(msg) && (
                              <span className="text-xs">
                                {getMessageStatusIcon(msg.status)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Three Dots Menu - Show on hover for user's messages */}
                        {isMe(msg) && hoveredMessage === msg._id && (
                          <div className="absolute -top-2 -left-8">
                            <button
                              onClick={() => handleDropdownToggle(msg._id)}
                              className="dropdown-trigger p-2 mt-5 mr-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition shadow-lg"
                              title="Message options"
                            >
                              <RiMore2Fill size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown === msg._id && (
                              <div className="dropdown-menu absolute top-8 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px] z-50">
                                {msg.messageType === "text" && (
                                  <button
                                    onClick={() => {
                                      handleEditMessage(msg);
                                      setShowDropdown(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <RiEditLine size={14} />
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleDeleteConfirmation(msg._id)
                                  }
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <RiDeleteBinLine size={14} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {isMe(msg) && msg.status === "failed" && (
                          <button
                            onClick={() => handleRetry(msg._id)}
                            className="absolute -bottom-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                            title="Retry sending"
                          >
                            <BsArrowClockwise size={12} />
                          </button>
                        )}
                      </div>

                      {isMe(msg) && (
                        <img
                          src={getSenderProfilePicture(msg)}
                          alt="You"
                          className="w-8 h-8 rounded-full ml-2 self-end mb-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=You&background=611DD0&color=fff`;
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {/* Invisible element at the bottom for scrolling reference */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Scroll to latest button - only show when not at bottom */}
        {!isNearBottom && (
          <button
            onClick={handleScrollToLatest}
            className="absolute bottom-20 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-200 z-20"
            title="Scroll to latest"
          >
            <RiSendPlaneFill size={20} className="rotate-90" />
          </button>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="sticky bottom-0 p-4 flex w-full items-center gap-3 border-t border-gray-200 bg-white z-40">
        <MediaUploadButton
          onFileSelect={handleFileSelection}
          disabled={!isConnected}
          isUploading={isUploading}
          currentConversationId={currentConversationId}
          editingMessage={editingMessage}
        />

        <div className="flex-1 relative">
          <input
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage ? "Edit your message..." : "Type your message..."
            }
            style={{ background: "#fff", color: "#000" }}
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
            disabled={!isConnected && !currentConversationId}
          />
          {!isConnected && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div
                className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
                title="Connecting..."
              />
            </div>
          )}

          {/* Edit mode buttons */}
          {editingMessage && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2 flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 transition shadow-sm"
                title="Save changes"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded-md hover:bg-gray-600 transition shadow-sm"
                title="Cancel editing"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <button
          onClick={editingMessage ? handleSaveEdit : handleSend}
          disabled={!messageText.trim() || !currentConversationId || isSending}
          className="flex items-center justify-center bg-purple-600 text-white rounded-full h-10 w-10 hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            !currentConversationId
              ? "Select a conversation"
              : editingMessage
              ? "Save changes"
              : "Send message"
          }
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : editingMessage ? (
            <RiEditLine size={20} />
          ) : (
            <RiSendPlaneFill size={20} />
          )}
        </button>
      </div>

      {/* Instagram-style Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
            <h3 className="text-black text-lg font-semibold mb-2">
              Unsend message?
            </h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              This will remove the message for everyone but people may have seen
              it already. Unsent messages may still be included if the
              conversation is reported.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleDeleteMessage(showDeleteModal)}
                className="w-full py-3 bg-red-500 text-white font-medium text-sm hover:bg-red-700 rounded-lg transition"
              >
                Unsend
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="w-full py-3 text-black font-medium text-sm hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={showMediaPreview}
        selectedMedia={selectedMedia}
        mediaCaption={mediaCaption}
        isUploading={isUploading}
        onClose={handleCloseMediaPreview}
        onRemoveMedia={handleRemoveMedia}
        onCaptionChange={setMediaCaption}
        onSendMedia={handleSendMedia}
      />

      {/* Legacy Media Preview Modal has been completely removed
          and replaced by the MediaPreviewModal component above */}

      {!isConnected && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          ⚡ Connecting to server...
        </div>
      )}
      {isUploading && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          📤 Uploading media...
        </div>
      )}
      {editingMessage && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          ✏️ Editing message...
        </div>
      )}
    </main>
  );
};

export default ChatBox;
