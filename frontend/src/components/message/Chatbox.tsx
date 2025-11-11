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
import { HiOutlineEmojiHappy } from "react-icons/hi";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import backgroundChatImage from "../../../public/images/background.png";
import type { MessageType } from "../../data/messageSample";
import MediaUploadButton from "./MediaUploadButton";
import MediaPreviewModal from "./MediaPreviewModal";
import MessageContent from "./MessageContent";
import CallModal from "./CallModal";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetMessagesQuery,
  useGetUserByIdQuery,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useBulkDeleteMessagesMutation,
  messageApi,
} from "../../services/messageApi";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../redux/store";
import { 
  addDeletedMessage, 
  clearDeletedMessages, 
  toggleSelectionMode,
  setSelectionMode,
  toggleMessageSelection,
  selectAllMessages,
  clearSelectedMessages,
  bulkAddDeletedMessages
} from "../../redux/slices/messageSlice";
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  // Note: Incoming calls are handled globally by IncomingCallNotification component
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedTypingRef = useRef<NodeJS.Timeout | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const userId = useSelector((state: RootState) => state.user._id);
  const currentUser = useSelector((state: RootState) => state.user);
  const deletedMessages = useSelector((state: RootState) => state.message.deletedMessages);
  const selectedMessages = useSelector((state: RootState) => state.message.selectedMessages);
  const isSelectionMode = useSelector((state: RootState) => state.message.isSelectionMode);
  const dispatch = useDispatch();
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

  // Join conversation room for real-time updates and clear deleted messages state
  useEffect(() => {
    if (currentConversationId && isConnected) {
      // console.log(`🔗 Joining conversation room: ${currentConversationId}`);
      socketService.joinConversation(currentConversationId);
      
      // Clear deleted messages when switching conversations
      dispatch(clearDeletedMessages());
      
      return () => {
        // console.log(`🔗 Leaving conversation room: ${currentConversationId}`);
        socketService.leaveConversation(currentConversationId);
      };
    }
  }, [currentConversationId, isConnected, dispatch]);

  // Delete and Edit mutations
  const [deleteMessage] = useDeleteMessageMutation();
  const [editMessage] = useEditMessageMutation();
  const [bulkDeleteMessages] = useBulkDeleteMessagesMutation();

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
      // Additional frontend filtering: exclude messages that are marked as deleted
      if (!deletedMessages.includes(m._id)) {
        byId.set(m._id, m);
      }
    });

    // REVERSED: Show latest messages last (descending by createdAt) - typical modern chat behavior
    const sortedMessages = Array.from(byId.values()).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    console.log(`💬 Displaying ${sortedMessages.length} messages for conversation ${currentConversationId} (filtered out ${deletedMessages.length} deleted)`);
    return sortedMessages;
  }, [fetchedMessages, messages, currentConversationId, deletedMessages]);

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

  // Enhanced scroll to bottom effect - scroll when messages change or conversation changes
  useEffect(() => {
    if (displayMessages.length > 0 && scrollRef.current && !messagesLoading) {
      const scrollContainer = scrollRef.current;
      
      // Enhanced scroll to bottom function
      const scrollToBottom = () => {
        if (scrollContainer) {
          // Use scrollIntoView for more reliable scrolling
          const lastMessage = scrollContainer.lastElementChild;
          if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'auto', block: 'end' });
          } else {
            // Fallback to scrollTop
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
          setIsAutoScrollEnabled(true);
          setIsNearBottom(true);
        }
      };

      // Immediate scroll
      scrollToBottom();
      
      // Backup scroll after DOM updates
      const timeoutId = setTimeout(scrollToBottom, 100);
      const timeoutId2 = setTimeout(scrollToBottom, 300);
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
      };
    }
  }, [displayMessages.length, currentConversationId, messagesLoading]);

  // Scroll to bottom when conversation changes - with higher priority
  useEffect(() => {
    if (currentConversationId && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      
      // Force scroll to bottom when switching conversations
      const forceScrollToBottom = () => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          setIsAutoScrollEnabled(true);
          setIsNearBottom(true);
        }
      };

      // Multiple attempts with increasing delays to ensure it works
      forceScrollToBottom();
      setTimeout(forceScrollToBottom, 50);
      setTimeout(forceScrollToBottom, 200);
      setTimeout(forceScrollToBottom, 500);
    }
  }, [currentConversationId]);

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

    const handleTypingEvent = (data: { userId: string; isTyping: boolean; receiverId?: string }) => {
      if (data.userId !== userId) {
        setOtherUserTyping(data.isTyping);

        if (data.isTyping) {
          setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      }
    };

    // Listen for message deletion events
    const handleMessageDeleted = (data: { messageId: string; deletedFor: string[]; hardDelete: boolean; conversationId: string }) => {
      console.log("🗑️ Message deleted event received:", data);
      console.log("Current conversation ID:", currentConversationId);
      console.log("Event conversation ID:", data.conversationId);
      console.log("Current user ID:", userId);
      console.log("Deleted for users:", data.deletedFor);
      
      // Add message to deleted list for immediate UI update
      dispatch(addDeletedMessage(data.messageId));
      
      // Invalidate both Messages and ChatList cache to refresh everything
      dispatch(messageApi.util.invalidateTags(['ChatList', 'Messages']));
      
      console.log("🔄 Invalidated ChatList and Messages cache due to message deletion");
      
      // Only refetch if this is for the current conversation
      if (data.conversationId === currentConversationId) {
        console.log("✅ Refetching messages due to deletion event");
        refetchMessages();
      } else {
        console.log("❌ Ignoring deletion event - different conversation");
      }
    };

    // Listen for message edit events
    const handleMessageEdited = (data: { messageId: string; content: string; isEdited: boolean; editedAt: string }) => {
      console.log("Message edited event received:", data);
      // Refetch messages to update the UI
      refetchMessages();
    };

    // Listen for conversation refresh events (for seen deleted messages)
    const handleConversationRefresh = (data: { conversationId: string; reason: string }) => {
      console.log("🔄 Conversation refresh event received:", data);
      if (data.conversationId === currentConversationId) {
        console.log("✅ Refreshing conversation due to:", data.reason);
        refetchMessages();
        // Also clear any stale deleted messages from Redux
        dispatch(clearDeletedMessages());
      }
    };

    // Listen for chat list refresh events
    const handleChatListRefresh = (data: { reason: string; conversationId: string; deletedBy: string }) => {
      console.log("💬 Chat list refresh event received:", data);
      // Force invalidate chat list cache
      dispatch(messageApi.util.invalidateTags(['ChatList']));
      console.log("✅ Chat list cache invalidated due to:", data.reason);
    };

    // Listen for bulk message deletion events
    const handleBulkMessageDeleted = (data: { messageIds: string[]; conversationId: string; deletedBy: string; count: number }) => {
      console.log("🗑️ Bulk message deleted event received:", data);
      
      // Add all deleted messages to Redux state for immediate UI update
      dispatch(bulkAddDeletedMessages(data.messageIds));
      
      // Invalidate cache
      dispatch(messageApi.util.invalidateTags(['ChatList', 'Messages']));
      
      // If this is for the current conversation, refetch messages
      if (data.conversationId === currentConversationId) {
        console.log("✅ Refetching messages due to bulk deletion");
        refetchMessages();
      }
      
      // Exit selection mode if we were in it
      if (isSelectionMode) {
        dispatch(setSelectionMode(false));
      }
    };

    // Handle user account deletion
    const handleUserAccountDeleted = (data: { deletedUserId: string; deletedUsername: string; message: string }) => {
      console.log(`🗑️ User account deleted: ${data.deletedUsername}`);
      
      // If the deleted user is the current conversation partner, show message and redirect
      if (currentConversationId === data.deletedUserId) {
        toast.info(`${data.deletedUsername} has deleted their account`);
        navigate('/messages');
        return;
      }
      
      // Refresh messages to get updated data from backend
      refetchMessages();
    };

    // Use the socket service methods for better event handling
    socketService.onUserTyping(handleTypingEvent);
    socketService.onMessageDeleted(handleMessageDeleted);
    socketService.onMessageEdited(handleMessageEdited);
    socketService.onConversationRefresh(handleConversationRefresh);
    socketService.onChatListRefresh(handleChatListRefresh);
    socketService.onBulkMessageDeleted(handleBulkMessageDeleted);
    socketService.onUserAccountDeleted(handleUserAccountDeleted);

    return () => {
      socketService.getSocket()?.off("userTyping", handleTypingEvent);
      socketService.offMessageDeleted(handleMessageDeleted);
      socketService.offMessageEdited(handleMessageEdited);
      socketService.offConversationRefresh(handleConversationRefresh);
      socketService.offChatListRefresh(handleChatListRefresh);
      socketService.offBulkMessageDeleted(handleBulkMessageDeleted);
      socketService.offUserAccountDeleted(handleUserAccountDeleted);
    };
  }, [isConnected, currentConversationId, userId, refetchMessages, dispatch, clearDeletedMessages]);

  // NOTE: Incoming call listeners are now handled globally in IncomingCallNotification component
  // This ensures calls are received even when user is not on the messages page

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
        return <IoCheckmark size={16} className="text-white" />; // Single tick
      case "delivered":
        return <IoCheckmarkDone size={16} className="text-white" />; // Double tick
      case "seen":
        return <IoCheckmarkDone size={16} className="text-[#E1C13B]" />; // Double tick - yellow
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

  // Emoji picker functions
  const toggleEmojiPicker = useCallback(() => {
    if (emojiButtonRef.current) {
      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      const pickerHeight = 400; // Approximate height of emoji picker
      
      // Calculate position - show above button if not enough space below
      let top = buttonRect.top - pickerHeight - 8; // Show above button
      let left = buttonRect.left;
      
      // Ensure picker doesn't go off-screen horizontally
      const pickerWidth = 320; // Approximate width of emoji picker
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 20;
      }
      if (left < 20) {
        left = 20;
      }
      
      // Ensure picker doesn't go off-screen vertically
      if (top < 20) {
        top = 20;
      }
      
      setEmojiPickerPosition({ top, left });
    }
    setShowEmojiPicker(!showEmojiPicker);
  }, [showEmojiPicker]);

  const handleEmojiSelect = useCallback((emoji: any) => {
    if (messageInputRef.current) {
      const input = messageInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newText = messageText.slice(0, start) + emoji.native + messageText.slice(end);
      setMessageText(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  }, [messageText]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showEmojiPicker &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target) &&
        !target.closest('.emoji-picker')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);


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
      // Immediately add to deleted messages for instant UI feedback
      dispatch(addDeletedMessage(messageId));
      
      const result = await deleteMessage(messageId).unwrap();
      toast.success("Message deleted successfully");
      
      // Refetch messages to get updated data from backend
      refetchMessages();

      // The backend already emits socket events, but we can emit additional event if needed
      if (isConnected && currentConversationId) {
        socketService.getSocket()?.emit("deleteMessage", {
          messageId,
          conversationId: currentConversationId,
          deletedFor: [userId],
          hardDelete: result.hardDelete || false
        });
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
      // If deletion failed, we might want to remove it from deleted list
      // But for now, let refetch handle the correct state
    } finally {
      setShowDeleteModal(null);
      setShowDropdown(null);
    }
  };

  // Handle bulk delete messages
  const handleBulkDeleteMessages = async () => {
    if (selectedMessages.length === 0) {
      toast.warning("No messages selected");
      return;
    }

    try {
      // Immediately add to deleted messages for instant UI feedback
      dispatch(bulkAddDeletedMessages(selectedMessages));
      
      const result = await bulkDeleteMessages({ messageIds: selectedMessages }).unwrap();
      
      // Show success message with count
      const deletedCount = result.deletedCount || selectedMessages.length;
      toast.success(`Successfully deleted ${deletedCount} message${deletedCount > 1 ? 's' : ''}`);
      
      // Emit socket event for real-time bulk deletion to both users
      if (isConnected && currentConversationId) {
        socketService.getSocket()?.emit("bulkDeleteMessages", {
          messageIds: selectedMessages,
          conversationId: currentConversationId,
          deletedBy: userId,
          count: deletedCount,
        });
      }
      
      // Exit selection mode and clear selections
      dispatch(setSelectionMode(false));
      
      // Refetch messages to get updated data from backend
      refetchMessages();
      
    } catch (error) {
      console.error("Failed to bulk delete messages:", error);
      toast.error("Failed to delete selected messages. Please try again.");
      
      // Remove the optimistically deleted messages from Redux if the API call failed
      dispatch(clearSelectedMessages());
    }
  };

  // Toggle selection mode
  const handleToggleSelectionMode = () => {
    dispatch(toggleSelectionMode());
  };

  // Handle message selection
  const handleMessageSelection = (messageId: string) => {
    if (isSelectionMode) {
      dispatch(toggleMessageSelection(messageId));
    }
  };

  // Select all messages (only current user's messages)
  const handleSelectAllMessages = () => {
    const myMessageIds = displayMessages.filter(msg => isMe(msg)).map(msg => msg._id);
    dispatch(selectAllMessages(myMessageIds));
  };

  // Clear all selections
  const handleClearSelections = () => {
    dispatch(clearSelectedMessages());
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
      
      // Emit socket event for real-time edit to both users
      if (isConnected && currentConversationId) {
        socketService.getSocket()?.emit("editMessage", {
          messageId: editingMessage.id,
          content: messageText,
          conversationId: currentConversationId,
          isEdited: true,
          editedAt: new Date().toISOString(),
        });
      }
      
      // Refetch messages to ensure UI is updated
      refetchMessages();
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast.error("Failed to edit message. Please try again.");
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
    setShowEmojiPicker(false); // Close emoji picker when opening media modal
  };

  // Handle adding more files to existing selection
  const handleAddMoreFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const newFiles = Array.from(target.files || []);
      if (newFiles.length > 0) {
        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "video/mp4",
          "video/quicktime",
        ];
        const maxSize = 10 * 1024 * 1024;
        
        const invalidFiles = newFiles.filter(
          (file) => !validTypes.includes(file.type) || file.size > maxSize
        );
        
        if (invalidFiles.length > 0) {
          toast.error(
            "Please select valid image (JPEG, PNG, GIF, WebP) or video (MP4) files under 10MB each"
          );
          return;
        }
        
        // Add new files to existing selection
        setSelectedMedia(prev => [...prev, ...newFiles]);
      }
    };
    input.click();
  };


  // Handle sending media from preview modal
  const handleSendMedia = async () => {
    if (!selectedMedia.length || !currentConversationId) {
      console.error("No media selected or conversation ID missing");
      toast.error("No media selected or conversation not found");
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      console.log(`Starting upload of ${selectedMedia.length} files to conversation: ${currentConversationId}`);

      // Test endpoint connectivity first
      const testUrl = `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
      }/api/messages/users`;
      
      try {
        const testResponse = await fetch(testUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("API connectivity test:", testResponse.status, testResponse.ok);
      } catch (testError) {
        console.error("API connectivity test failed:", testError);
        throw new Error("Cannot connect to server. Please check your connection.");
      }

      // Upload and send each media file
      for (let i = 0; i < selectedMedia.length; i++) {
        const file = selectedMedia[i];
        console.log(`Uploading file ${i + 1}/${selectedMedia.length}: ${file.name} (${file.type}, ${file.size} bytes)`);

        const formData = new FormData();
        formData.append("media", file);

        const uploadUrl = `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
        }/api/messages/upload/${currentConversationId}`;
        
        console.log("Upload URL:", uploadUrl);

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type header - let browser set it with boundary for FormData
          },
          body: formData,
        });

        console.log("Upload response status:", response.status, response.statusText);

        if (!response.ok) {
          let errorMessage = `Upload failed with status ${response.status}`;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            console.error("Upload error details:", errorData);
          } catch (parseError) {
            console.error("Could not parse error response:", parseError);
            try {
              const errorText = await response.text();
              console.error("Raw error response:", errorText);
            } catch (textError) {
              console.error("Could not read error response as text:", textError);
            }
          }
          
          // Show user-friendly error based on status code
          if (response.status === 401) {
            errorMessage = "Authentication failed. Please log in again.";
          } else if (response.status === 403) {
            errorMessage = "Access denied to this conversation.";
          } else if (response.status === 404) {
            errorMessage = "Conversation not found.";
          } else if (response.status === 413) {
            errorMessage = "File too large. Please select files under 50MB.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please check if Cloudinary is configured.";
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("Upload result:", result);

        if (result.success && result.data) {
          console.log(`✅ File ${i + 1} uploaded successfully:`, result.data._id);
          console.log("📤 Backend should emit socket event for message:", result.data);
          
          // The message should appear via socket event, not manual addition
          // Backend emits: io.to(conversationId).emit("newMessage", populatedMessage);
        } else {
          console.warn("Upload response indicates failure:", result);
          throw new Error(result.message || "Upload response indicates failure");
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

  // Call handlers (for outgoing calls only)
  const handleVoiceCall = () => {
    setCallType('voice');
    setShowCallModal(true);
  };

  const handleVideoCall = () => {
    setCallType('video');
    setShowCallModal(true);
  };

  const handleCloseCall = () => {
    setShowCallModal(false);
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
    <main 
    style={{textAlign: "left"}}
    className="flex-1 bg-[#F5F6FA] flex flex-col overflow-y-auto  h-[calc(100vh-80px)] w-[1120px]">
      {/* FIXED HEADER - Now sticky/fixed */}
      <div className="sticky top-0 z-30 flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
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
                  otherUserInfo?.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="text-sm text-gray-500">
                {otherUserInfo?.isOnline ? "Online" : "Offline"}
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
          {/* Voice Call Button */}
          <button
            onClick={handleVoiceCall}
            className="h-10 w-10 rounded-full flex justify-center items-center bg-[#611DD0] hover:bg-[#4e16a8] transition"
            title="Voice Call"
          >
            <FiPhoneCall size={18} />
          </button>

          {/* Video Call Button */}
          <button
            onClick={handleVideoCall}
            className="h-10 w-10 rounded-full flex justify-center items-center bg-[#611DD0] hover:bg-[#4e16a8] transition"
            title="Video Call"
          >
            <FiVideo size={18} />
          </button>

          {/* Selection Mode Toggle */}
          <button 
            onClick={handleToggleSelectionMode}
            className={`h-10 w-10 rounded-full flex justify-center items-center transition ${
              isSelectionMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-[#611DD0] hover:bg-[#4e16a8]'
            }`}
            title="Select Messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
    
          <button className="h-10 w-10 bg-[#611DD0] rounded-full flex justify-center items-center hover:bg-[#4e16a8] transition">
            <BsThreeDots size={20} />
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
            // backgroundColor: "",
          }}
          className="flex-1 p-4 overflow-y-auto chat-scrollbar"
        >
          {messagesLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
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
                      } mb-3 relative group ${isSelectionMode ? 'items-center' : ''}`}
                      onMouseEnter={() => setHoveredMessage(msg._id)}
                      onMouseLeave={() => setHoveredMessage(null)}
                    >
                      {/* Selection Checkbox - Only for current user's messages */}
                      {isSelectionMode && isMe(msg) && (
                        <div className="flex-shrink-0 mr-10">
                          <input
                            type="checkbox"
                            checked={selectedMessages.includes(msg._id)}
                            onChange={() => handleMessageSelection(msg._id)}
                            className="w-4 h-4  text-white bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                      )}
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

         {/* Selection Mode Toolbar */}
         {isSelectionMode && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedMessages.length} of your messages selected
            </span>
            <button
              onClick={handleSelectAllMessages}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Select All My Messages
            </button>
            <button
              onClick={handleClearSelections}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkDeleteMessages}
              disabled={selectedMessages.length === 0}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete ({selectedMessages.length})</span>
            </button>
            <button
              onClick={() => dispatch(setSelectionMode(false))}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
            ref={messageInputRef}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 pr-20"
            disabled={!isConnected && !currentConversationId}
          />
          
          {/* Emoji Button */}
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={toggleEmojiPicker}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
            title="Add emoji"
          >
            <HiOutlineEmojiHappy size={20} />
          </button>
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
            <p className="text-gray-800 text-sm mb-6 leading-relaxed">
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
        onAddMoreFiles={handleAddMoreFiles}
      />

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          className="emoji-picker fixed z-[999999]"
          style={{
            top: `${emojiPickerPosition.top}px`,
            left: `${emojiPickerPosition.left}px`,
            zIndex: 999999
          }}
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            set="native"
            showPreview={false}
            showSkinTones={false}
            emojiButtonSize={28}
            emojiSize={20}
            maxFrequentRows={2}
          />
        </div>
      )}

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

      {/* Call Modal */}
      {/* Call Modal for outgoing calls only - Incoming calls handled by global component */}
      <CallModal
        isOpen={showCallModal}
        callType={callType}
        isIncoming={false}
        caller={{
          id: otherUserInfo?._id || currentConversationId || '',
          name: otherUserInfo?.fullname || otherUserInfo?.username || activeChat,
          profilePicture: otherUserInfo?.profilePicture || '',
        }}
        onClose={handleCloseCall}
        conversationId={currentConversationId || undefined}
      />
    </main>
  );
};

export default ChatBox;