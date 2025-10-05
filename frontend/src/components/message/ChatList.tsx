// src/components/Message/ChatList.tsx
import React, { useEffect, useRef, useState,  } from "react";
import { RiMore2Fill, RiRefreshLine, RiErrorWarningLine, RiSearchLine, RiCloseLine } from "react-icons/ri";
import { useSelector } from "react-redux";
import defaultAvatar from "../../../public/images/default.jpg";
import type { Chat } from "./Message";
import type { RootState } from "../../redux/store";
import { toast } from "react-toastify";
import { useGetUsersForChatListQuery } from "../../services/messageApi";
import axiosClient from "../../api/axiosClient";
import { socketService } from "../../services/socketServices";

interface ChatListProps {
  chats: Chat[];
  activeChatId?: string;
  onSelectChat: (chatId: string) => void;
  onOpenSearch?: () => void;
  onStartChat?: (user: { id: string; username: string; fullname: string; profilePicture: string }) => void;
  isConnected: boolean;
  hasError?: boolean;
  onlineUsers?: string[];
}

interface Connection {
  _id: string;
  username: string;
  fullname: string;
  profilePicture: string;
  isOnline?: boolean;
}

interface User {
  id: string;
  userId: string;
  name: string;
  username: string;
  profilePicture: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  lastActive: string;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  // onOpenSearch,
  onStartChat,
  isConnected,
  hasError = false,
  // onlineUsers = [],
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userState = useSelector((state: RootState) => state.user);
  const profilePicture = userState.profilePicture;
  const username = userState.username;
  const fullname = userState.fullname;
  // const currentUserId = userState._id;
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());

    // Use RTK Query instead of manual fetch
  const { 
    data: apiUsers = [], 
    isLoading: usersLoading, 
    error: usersError,
    refetch: refetchUsers 
  } = useGetUsersForChatListQuery();

  const [users, setUsers] = useState<User[]>([]);
  const [apiStatus, setApiStatus] = useState<'working' | 'failing'>('working');

  const handleSelectChat = (conversationId: string) => {
    console.log("Selecting conversation:", conversationId);
    
    const chat = users.find(user => user.id === conversationId);
    
    if (!chat) {
      console.error("Conversation not found:", conversationId);
      toast.error("Conversation not found. Please try again.");
      return;
    }
    
    onSelectChat(conversationId);
    
    setUsers(prev =>
      prev.map(u =>
        u.id === conversationId ? { ...u, unreadCount: 0 } : u
      )
    );
  };
  // Transform API data to User format
  useEffect(() => {
    if (apiUsers && apiUsers.length > 0) {
      console.log("Transforming API users:", apiUsers);
      const formattedUsers: User[] = apiUsers.map((user: any) => ({
        id: user.id || user.userId, // Use id if available, fallback to userId
        userId: user.userId,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture || defaultAvatar,
        lastMessage: user.lastMessage || 'No messages yet',
        time: user.time || new Date().toISOString(),
        unreadCount: user.unreadCount || 0,
        isOnline: user.isOnline || false,
        lastActive: user.lastActive || new Date().toISOString()
      }));
      
      setUsers(formattedUsers);
      setApiStatus('working');
    } else if (apiUsers && apiUsers.length === 0) {
      // No chats from API, use local chats as fallback
      if (chats.length > 0) {
        console.log("Using local chats as fallback");
        const fallbackUsers: User[] = chats.map(chat => ({
          id: chat.id,
          userId: chat.userId,
          name: chat.name,
          username: chat.name.toLowerCase().replace(/\s+/g, ''),
          profilePicture: chat.profilePicture || chat.image || defaultAvatar,
          lastMessage: chat.lastMessage,
          time: chat.time || new Date().toISOString(),
          unreadCount: chat.unreadCount || 0,
          isOnline: false,
          lastActive: new Date().toISOString()
        }));
        setUsers(fallbackUsers);
      } else {
        setUsers([]);
      }
    }
  }, [apiUsers, chats]);

  // Transform API data to User format
  useEffect(() => {
    if (apiUsers && apiUsers.length > 0) {
      console.log("Transforming API users:", apiUsers);
      const formattedUsers: User[] = apiUsers.map((user: any) => ({
        id: user.id || user.userId,
        userId: user.userId,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture || defaultAvatar,
        lastMessage: user.lastMessage || 'No messages yet',
        time: user.time || new Date().toISOString(),
        unreadCount: user.unreadCount || 0,
        isOnline: user.isOnline || false,
        lastActive: user.lastActive || new Date().toISOString()
      }));
      
      setUsers(formattedUsers);
      setApiStatus('working');
    } else if (apiUsers && apiUsers.length === 0) {
      if (chats.length > 0) {
        console.log("Using local chats as fallback");
        const fallbackUsers: User[] = chats.map(chat => ({
          id: chat.id,
          userId: chat.userId,
          name: chat.name,
          username: chat.name.toLowerCase().replace(/\s+/g, ''),
          profilePicture: chat.profilePicture || chat.image || defaultAvatar,
          lastMessage: chat.lastMessage,
          time: chat.time || new Date().toISOString(),
          unreadCount: chat.unreadCount || 0,
          isOnline: false,
          lastActive: new Date().toISOString()
        }));
        setUsers(fallbackUsers);
      } else {
        setUsers([]);
      }
    }
  }, [apiUsers, chats]);

   // Handle API errors
  useEffect(() => {
    if (usersError) {
      console.error("API Error:", usersError);
      setApiStatus('failing');
      
      // Check if it's an authentication error
      if ('status' in usersError && usersError.status === 401) {
        console.error("Authentication failed - redirecting to login");
        toast.error("Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "/login";
        return;
      }
      
      if (chats.length > 0) {
        const fallbackUsers: User[] = chats.map(chat => ({
          id: chat.id,
          userId: chat.userId,
          name: chat.name,
          username: chat.name.toLowerCase().replace(/\s+/g, ''),
          profilePicture: chat.profilePicture || chat.image || defaultAvatar,
          lastMessage: chat.lastMessage,
          time: chat.time || new Date().toISOString(),
          unreadCount: chat.unreadCount || 0,
          isOnline: false,
          lastActive: new Date().toISOString()
        }));
        setUsers(fallbackUsers);
      }
    }
  }, [usersError, chats]);


  const handleRetryUsers = () => {
    refetchUsers();
  };

  // Debug logging
  useEffect(() => {
    console.log("ChatList Debug Info:", {
      apiUsersCount: apiUsers?.length || 0,
      usersCount: users.length,
      users: users.map(u => ({ id: u.id, userId: u.userId, name: u.name })),
      activeChatId,
      apiStatus,
      usersLoading,
      usersError: usersError ? true : false
    });
  }, [users, activeChatId, apiStatus, usersLoading, usersError, apiUsers]);

  useEffect(() => {
    if (scrollRef.current && users.length > 0) {
      scrollRef.current.scrollTop = 0;
    }
  }, [users]);

  const formatLastMessageTime = (timeString?: string) => {
    if (!timeString) return "";

    try {
      const messageTime = new Date(timeString);
      const now = new Date();
      const isToday = messageTime.toDateString() === now.toDateString();
      const isYesterday =
        new Date(now.setDate(now.getDate() - 1)).toDateString() ===
        messageTime.toDateString();

      if (isToday) {
        return messageTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (isYesterday) {
        return "Yesterday";
      } else {
        return messageTime.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  const getUnreadBadge = (unreadCount?: number) => {
    if (!unreadCount || unreadCount === 0) return null;

    return (
      <div className="bg-purple-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ml-2">
        {unreadCount > 99 ? "99+" : unreadCount}
      </div>
    );
  };

  const isUserOnline = (userId: string) => {
    // Find the user in the users list and check their isOnline status
    const user = users.find(u => u.userId === userId);
    return user?.isOnline || false;
  };

  // Fetch user connections (followers + following)
  const fetchConnections = async () => {
    if (loadingConnections) return;
    
    setLoadingConnections(true);
    try {
      const token = localStorage.getItem("accessToken");
      // Get all followers and following without backend filtering
      const [followersResponse, followingResponse] = await Promise.all([
        axiosClient.get(`/api/users/profile/connections?type=followers`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosClient.get(`/api/users/profile/connections?type=following`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      console.log("Followers response:", followersResponse.data);
      console.log("Following response:", followingResponse.data);
      
      const allConnections = [
        ...(followersResponse.data.followers || []),
        ...(followingResponse.data.following || [])
      ];
      
      console.log("All connections:", allConnections);
      
      // Remove duplicates based on _id
      const uniqueConnections = allConnections.filter((connection, index, self) => 
        index === self.findIndex(c => c._id === connection._id)
      );
      
      console.log("Unique connections:", uniqueConnections);
      
      setConnections(uniqueConnections);
      setFilteredConnections(uniqueConnections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoadingConnections(false);
    }
  };

  // Handle search input
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredConnections(connections);
      return;
    }
    
    const filtered = connections.filter(connection => 
      connection.username.toLowerCase().includes(query.toLowerCase()) ||
      connection.fullname.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredConnections(filtered);
  };

  // Handle starting a chat with a connection
  const handleStartChatWithConnection = (connection: Connection) => {
    console.log("Starting chat with connection:", connection);
    if (onStartChat) {
      console.log("Calling onStartChat with:", {
        id: connection._id,
        username: connection.username,
        fullname: connection.fullname,
        profilePicture: connection.profilePicture
      });
      onStartChat({
        id: connection._id,
        username: connection.username,
        fullname: connection.fullname,
        profilePicture: connection.profilePicture
      });
    } else {
      console.log("onStartChat is not available");
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  // Fetch connections when search is opened
  useEffect(() => {
    if (showSearch && connections.length === 0) {
      fetchConnections();
    }
  }, [showSearch]);

  // Listen for typing events
  useEffect(() => {
    if (!isConnected) return;

    const handleTypingEvent = (data: { userId: string; isTyping: boolean; receiverId?: string }) => {
      console.log('ChatList received typing event:', data);
      
      // Find the conversation ID for this user
      const conversation = users.find(user => user.userId === data.userId);
      if (conversation) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(conversation.id, true);
            // Auto-clear typing indicator after 3 seconds
            setTimeout(() => {
              setTypingUsers(current => {
                const updated = new Map(current);
                updated.delete(conversation.id);
                return updated;
              });
            }, 3000);
          } else {
            newMap.delete(conversation.id);
          }
          return newMap;
        });
      }
    };

    socketService.onUserTyping(handleTypingEvent);

    return () => {
      socketService.getSocket()?.off("userTyping", handleTypingEvent);
    };
  }, [isConnected, users]);

  // Loading skeleton component
  const ChatSkeleton = () => (
    <div className="flex items-center justify-between w-full px-5 py-3 border-b border-purple-200/20">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-purple-400/30 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-purple-400/30 rounded w-24 animate-pulse" />
            <div className="h-3 bg-purple-400/20 rounded w-12 animate-pulse ml-2" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="h-3 bg-purple-400/20 rounded w-32 animate-pulse" />
            <div className="h-5 w-5 bg-purple-400/30 rounded-full animate-pulse ml-2" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section style={{textAlign: "left"}} className="hidden lg:flex flex-col bg-[#611DD0] text-white h-screen w-full md:w-[350px] border-r border-purple-300/30 rounded-l-2xl">
      {/* Header */}
      <header className="flex items-center justify-between p-4 sticky top-0 z-10 border-b border-purple-200/30 bg-[#611DD0]">
        <main className="flex items-center gap-3">
          <img
            src={profilePicture || defaultAvatar}
            alt={`${fullname || username} profile`}
            className="w-11 h-11 rounded-full object-cover cursor-pointer"
          />
          <span className="min-w-0">
            <h3 className="p-0 font-semibold md:text-[16px] truncate">
              {fullname || username || "Current User"}
            </h3>
            <p className="p-0 font-light text-[14px] truncate">
              {username ? `@${username}` : "@username"}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-gray-400"
                }`}
              />
              <span className="text-xs opacity-80">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </span>
        </main>
        <button
          className=" w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg bg-white transition-colors"
          aria-label="More options"
          // onClick={() => {
          //   localStorage.removeItem("chatSummaries");
          //   localStorage.removeItem("messages");
          //   localStorage.removeItem("activeChat");
          //   localStorage.removeItem("currentConversationId");
          //   localStorage.removeItem("accessToken");
          //   localStorage.removeItem("userId");
          //   window.location.href = "/login";
          // }}
        >
          <RiMore2Fill color="#611DD0" className="w-6 h-6" />
        </button>
      </header>

      {/* Messages Header */}
      <div className="w-full mt-3 px-4">
        <header className="flex items-center justify-between">
          <button
            onClick={() => onSelectChat('')}
            className="text-[16px] font-medium hover:text-purple-200 transition-colors cursor-pointer"
          >
            Messages
            {usersLoading ? "" : ` (${users.length})`}
          </button>
          <div className="flex items-center gap-2">
            {(hasError || usersError) && (
              <button
                onClick={handleRetryUsers}
                className="p-1 text-white/80 hover:text-white transition-colors"
                aria-label="Retry loading chats"
                title="Retry loading chats"
              >
                <RiRefreshLine className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="px-3 py-1 text-sm bg-white/20 rounded-lg hover:bg-white/30 transition flex items-center gap-2"
              aria-label="Search connections"
              disabled={usersLoading}
            >
              <span>Search</span>
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-gray-400"
                }`}
              />
            </button>
          </div>
        </header>
      </div>

      {/* Search Interface */}
      {showSearch && (
        <div className="mx-4 mt-2 mb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search your connections..."
              className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
              autoFocus
            />
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
            >
              <RiCloseLine className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search Results */}
          <div className="mt-3 max-h-60 overflow-y-auto">
            {loadingConnections ? (
              <div className="text-center py-4 text-white/60">
                Loading connections...
              </div>
            ) : filteredConnections.length > 0 ? (
              filteredConnections.map((connection) => (
                <div
                  key={connection._id}
                  onClick={() => handleStartChatWithConnection(connection)}
                  className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <img
                      src={connection.profilePicture || defaultAvatar}
                      alt={connection.fullname}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultAvatar;
                      }}
                    />
                    {connection.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-[#611DD0]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {connection.fullname}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      @{connection.username}
                    </p>
                  </div>
                </div>
              ))
            ) : searchQuery ? (
              <div className="text-center py-4 text-white/60">
                No connections found for "{searchQuery}"
              </div>
            ) : (
              <div className="text-center py-4 text-white/60">
                {connections.length === 0 ? "No connections found" : "Type to search your connections"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {(hasError || usersError) && (
        <div className="mx-4 mt-2 p-3 bg-red-400/20 border border-red-400/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RiErrorWarningLine className="w-4 h-4 text-red-200" />
              <span className="text-sm text-red-200">
                {apiStatus === 'failing' ? 'API connection failed' : 'Failed to load chats'}
              </span>
            </div>
            <button
              onClick={handleRetryUsers}
              className="text-red-200 hover:text-white text-sm underline transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Chats List */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto h-[calc(100vh-80px)] mt-2 scrollbar-thin scrollbar-thumb-purple-400/50 scrollbar-track-purple-600/20"
      >
        {usersLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <ChatSkeleton key={index} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            {usersError ? (
              <>
                <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center mb-4">
                  <RiErrorWarningLine className="w-8 h-8 text-red-200" />
                </div>
                <p className="text-red-200 font-medium">Failed to load chats</p>
                <p className="mt-2 text-sm text-red-200/80">
                  {apiStatus === 'failing' 
                    ? "API server is not responding. Using local data."
                    : "Check your connection and try again"
                  }
                </p>
                <button
                  onClick={handleRetryUsers}
                  className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center gap-2"
                >
                  <RiRefreshLine className="w-4 h-4" />
                  Try Again
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-purple-400/30 rounded-full flex items-center justify-center mb-4">
                  <RiMore2Fill className="w-8 h-8 text-purple-200" />
                </div>
                <p className="text-purple-200 font-medium">No chats yet</p>
                <p className="mt-2 text-sm text-purple-200/80">
                  Start a new chat using the search button
                </p>
                <button
                  onClick={() => setShowSearch(true)}
                  className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
                  disabled={!isConnected}
                >
                  Start Chatting
                </button>
                {!isConnected && (
                  <p className="text-xs text-yellow-200 mt-2">
                    Waiting for connection...
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between w-full px-5 py-3 cursor-pointer border-b border-purple-200/20 transition-all duration-200 ${
                user.id === activeChatId
                  ? "bg-purple-500/60 shadow-inner"
                  : "hover:bg-purple-500/40 hover:shadow-md"
              }`}
              onClick={() => handleSelectChat(user.id)}
              style={{ minHeight: "60px" }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative">
                  <img
                    src={user.profilePicture || defaultAvatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = defaultAvatar;
                    }}
                  />
                  {isUserOnline(user.userId) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#611DD0]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-[15px] truncate">
                      {user.name}
                    </h2>
                    {user.time && (
                      <p className="text-xs opacity-80 ml-2 whitespace-nowrap">
                        {formatLastMessageTime(user.time)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm opacity-90 truncate">
                      {typingUsers.get(user.id) ? (
                        <span className="text-purple-300 animate-pulse italic">
                          typing...
                        </span>
                      ) : (
                        user.lastMessage
                      )}
                    </p>
                    {getUnreadBadge(user.unreadCount)}
                  </div>
                </div>
              </div>

              {/* Removed active chat indicator */}
            </div>
          ))
        )}
      </main>

      {/* Connection Status Footer */}
      <footer className="p-3 border-t border-purple-200/20 bg-purple-600/50">
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-80">Connection status:</span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span className={isConnected ? "text-green-400" : "text-red-400"}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        {!isConnected && (
          <p className="text-xs opacity-60 mt-1">Trying to reconnect...</p>
        )}
        {usersLoading && (
          <p className="text-xs opacity-60 mt-1">Loading chats...</p>
        )}
        {apiStatus === 'failing' && (
          <p className="text-xs text-yellow-200 mt-1">Using fallback data</p>
        )}
        {(hasError || usersError) && (
          <p className="text-xs text-red-200 mt-1">Failed to load some chats</p>
        )}
      </footer>
    </section>
  );
};

export default ChatList;