import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatList from "./ChatList";
import ChatBox from "./ChatBox";
import SearchModal from "./SearchModal";
import type { MessageType, Receiver } from "../../data/messageSample";
import { useGetMessagesQuery, useSendMessageMutation, useGetUsersForChatListQuery, useMarkConversationAsSeenMutation, useCreateOrGetConversationMutation } from "../../services/messageApi";
import { useSelector, useDispatch } from "react-redux";
import { setActiveChat, setCurrentConversationId, decrementUnreadMessageCount } from "../../redux/slices/messageSlice";
import type { RootState } from "../../redux/store";
import { socketService } from "../../services/socketServices";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "react-toastify";

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time?: string;
  image?: string;
  unreadCount?: number;
  userData?: Receiver;
  userId: string;
  profilePicture: string;
}

const Message: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [chatSummaries, setChatSummaries] = useState<Chat[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const dispatch = useDispatch();
  
  const { activeChat, currentConversationId } = useSelector((state: RootState) => state.message);
  const userId = useSelector((state: RootState) => state.user._id);
  const token = localStorage.getItem("accessToken");
  
  const messageQueueRef = useRef<Map<string, MessageType>>(new Map());
  const isInitialMount = useRef(true);
  const isSendingRef = useRef(false);

  // Use RTK Query for chat list users
  const { data: chatListUsers = [], refetch: refetchChatList } = useGetUsersForChatListQuery();

  // Use RTK Query for messages
  const { 
    data: messagesResponse, 
    isLoading: messagesLoading,
    refetch: refetchMessages 
  } = useGetMessagesQuery(
    currentConversationId ? { receiverId: currentConversationId } : skipToken,
    { 
      skip: !currentConversationId,
      refetchOnMountOrArgChange: true 
    }
  );

  const [sendMessageApi] = useSendMessageMutation();
  const [markConversationAsSeen] = useMarkConversationAsSeenMutation();
  const [createOrGetConversation] = useCreateOrGetConversationMutation();

  // Load initial data from localStorage and sync with API data
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const savedChats = localStorage.getItem('chatSummaries');
        const savedMessages = localStorage.getItem('messages');
        const savedActiveChat = localStorage.getItem('activeChat');
        const savedConversationId = localStorage.getItem('currentConversationId');
        
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          const validatedChats = parsedChats.map((chat: Chat) => ({
            ...chat,
            userId: chat.userId || chat.id,
            profilePicture: chat.profilePicture || chat.image
          }));
          setChatSummaries(validatedChats);
        }
        if (savedMessages) setMessages(JSON.parse(savedMessages));
        
        // Only restore saved chat/conversation if they exist in localStorage
        // Don't auto-select any chat on fresh load
        if (savedActiveChat && savedConversationId) {
          dispatch(setActiveChat(savedActiveChat));
          dispatch(setCurrentConversationId(savedConversationId));
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        localStorage.removeItem('chatSummaries');
        localStorage.removeItem('messages');
        localStorage.removeItem('activeChat');
        localStorage.removeItem('currentConversationId');
      }
    };

    loadFromStorage();
    isInitialMount.current = false;
  }, [dispatch]);

  // Sync chatSummaries with API data when chatListUsers changes
  useEffect(() => {
    if (chatListUsers.length > 0) {
      console.log("Syncing chat summaries with API data:", chatListUsers);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiChats: Chat[] = chatListUsers.map((user: any) => ({
        id: user.userId || user.id,
        userId: user.userId || user.id,
        name: user.name || user.username || "Unknown User",
        lastMessage: user.lastMessage || "Start a conversation",
        time: user.time || new Date().toISOString(),
        image: user.profilePicture,
        profilePicture: user.profilePicture || '',
        unreadCount: user.unreadCount || 0,
        userData: {
          _id: user.userId || user.id,
          username: user.username,
          profilePicture: user.profilePicture
        }
      }));

      // Merge API chats with local chats, prioritizing API data
      setChatSummaries(prev => {
        const mergedChats = [...apiChats];
        
        // Add local chats that aren't in API data
        prev.forEach(localChat => {
          if (!apiChats.find(apiChat => apiChat.id === localChat.id)) {
            mergedChats.push(localChat);
          }
        });
        
        return mergedChats;
      });
    }
  }, [chatListUsers]);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem('chatSummaries', JSON.stringify(chatSummaries));
    }
  }, [chatSummaries]);

  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem('messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (activeChat && !isInitialMount.current) {
      localStorage.setItem('activeChat', activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    if (currentConversationId && !isInitialMount.current) {
      localStorage.setItem('currentConversationId', currentConversationId);
    }
  }, [currentConversationId]);

  // Socket connection
  useEffect(() => {
    if (!token || !userId) return;

    let isMounted = true;

    const initializeSocket = async () => {
      try {
        await socketService.connect(token, userId);
        if (isMounted) {
          setIsSocketConnected(true);
          console.log("Socket connected successfully");
        }

        // Message handlers
        const handleNewMessage = (message: MessageType) => {
          if (!isMounted) return;
          
          console.log("📨 Received new message via socket:", {
            id: message._id,
            type: message.messageType,
            sender: message.sender._id,
            currentUser: userId,
            content: message.messageType === 'text' ? message.content : `[${message.messageType}]`
          });
          
          setMessages((prev) => {
            // Check if this is a real message replacing a temporary one
            const tempMessage = prev.find(m => 
              m._id?.startsWith('temp-') && 
              m.conversationId === message.conversationId && 
              m.sender._id === message.sender._id && 
              m.content === message.content && 
              m.sender._id === message.sender._id &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000 // Within 5 seconds
            );
            
            if (tempMessage) {
              // Replace temporary message with real one
              console.log("Replacing temporary message:", tempMessage._id, "with real message:", message._id);
              messageQueueRef.current.delete(tempMessage._id);
              return prev.map(m => m._id === tempMessage._id ? message : m);
            }
            
            // Check if message already exists (prevent duplicates)
            const existingMessage = prev.find(m => m._id === message._id);
            if (existingMessage) {
              console.log("Message already exists, skipping:", message._id);
              return prev;
            }
            
            // For messages from other users, add them
            if (message.sender._id !== userId) {
              console.log("Adding new message from other user:", message._id);
              return [...prev, message];
            }
            
            // For own messages, handle differently based on message type
            if (message.messageType === 'image' || message.messageType === 'video') {
              // Media messages don't have temporary messages, so always add them
              console.log("Adding own media message:", message._id, message.messageType);
              return [...prev, message];
            }
            
            // For text messages, only add if no temporary message exists (prevents duplicates)
            console.log("Received own text message via socket, checking for duplicates:", message._id);
            return prev;
          });

          // Update chat list immediately with new message info
          const conversationId = message.conversationId || currentConversationId;
          if (conversationId) {
            setChatSummaries(prev => prev.map(chat => {
              if (chat.id === conversationId) {
                return {
                  ...chat,
                  lastMessage: message.content,
                  time: message.createdAt,
                  // Don't increment unread count for own messages
                  unreadCount: message.sender._id === userId ? chat.unreadCount : (chat.unreadCount || 0) + 1
                };
              }
              return chat;
            }));
          }

          // Refresh chat list to reflect latest message preview/time from server
          try { refetchChatList(); } catch(error: unknown) {
            console.error("Failed to refresh chat list after new message", error);
          }
        };

        const handleMessageStatusUpdate = (data: { messageId: string; status: string }) => {
          if (!isMounted) return;
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === data.messageId ? { ...msg, status: data.status } : msg
            )
          );
        };

        const handleError = (error: { error: string }) => {
          if (!isMounted) return;
          console.error("Socket error:", error);
          toast.error("Message sending failed: " + error.error);
        };

        socketService.onMessage(handleNewMessage);
        socketService.onMessageStatusUpdate(handleMessageStatusUpdate);
        socketService.onError(handleError);

        // Update UI on delete/edit events immediately
        socketService.getSocket()?.on('messageDeleted', (data: { messageId: string; conversationId: string; lastMessage?: string; time?: string }) => {
          if (!isMounted) return;
          console.log('Message deleted event received in Message.tsx:', data);
          
          // Remove deleted message from local state immediately
          setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
          
          // Update chat list with new last message if provided
          if (data.lastMessage !== undefined && data.conversationId) {
            setChatSummaries(prev => prev.map(chat => {
              if (chat.id === data.conversationId) {
                return {
                  ...chat,
                  lastMessage: data.lastMessage || "Message deleted",
                  time: data.time || new Date().toISOString()
                };
              }
              return chat;
            }));
          }
          
          // Refetch for server sync
          try { refetchMessages(); } catch (e) { console.error('Failed to refetch messages:', e); }
          try { refetchChatList(); } catch (e) { console.error('Failed to refetch chat list:', e); }
        });
        
        socketService.getSocket()?.on('messageEdited', (data: { messageId: string; content: string; conversationId: string; isEdited: boolean; editedAt: string }) => {
          if (!isMounted) return;
          console.log('Message edited event received in Message.tsx:', data);
          
          // Update edited message in local state immediately
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, content: data.content, isEdited: data.isEdited, editedAt: data.editedAt }
              : msg
          ));
          
          // Update chat list with edited message content if it's the latest message
          setChatSummaries(prev => prev.map(chat => {
            if (chat.id === data.conversationId) {
              // Only update if this was likely the last message (simplified check)
              return {
                ...chat,
                lastMessage: data.content,
                time: data.editedAt
              };
            }
            return chat;
          }));
          
          // Refetch for server sync
          try { refetchMessages(); } catch (e) { console.error('Failed to refetch messages:', e); }
          try { refetchChatList(); } catch (e) { console.error('Failed to refetch chat list:', e); }
        });

        socketService.getSocket()?.on('disconnect', () => {
          if (isMounted) {
            setIsSocketConnected(false);
            toast.warning("Connection lost. Attempting to reconnect...");
          }
        });

        socketService.getSocket()?.on('reconnect', () => {
          if (isMounted) {
            setIsSocketConnected(true);
            toast.success("Connection restored");
          }
        });

        // Listen for chat list updates (new messages from other users)
        socketService.getSocket()?.on('chatListUpdate', (data: { conversationId: string; lastMessage: string; time: string; senderId: string; senderName: string }) => {
          if (!isMounted) return;
          console.log('Received chat list update:', data);
          
          // Skip updates for current user's own messages
          if (data.senderId === userId) {
            console.log("Skipping chat list update for own message");
            return;
          }
          
          // Update chat summaries with new message info and increment unread count
          setChatSummaries(prev => prev.map(chat => {
            if (chat.id === data.conversationId) {
              return {
                ...chat,
                lastMessage: data.lastMessage,
                time: data.time,
                unreadCount: (chat.unreadCount || 0) + 1 // Increment unread count
              };
            }
            return chat;
          }));
          
          // Show toast notification for new message from other users only
          toast.info(`💬 New message from ${data.senderName}`);
          
          // Refetch chat list to get updated data
          refetchChatList().catch(error => console.error('Failed to refresh chat list:', error));
        });

      } catch (error) {
        console.error("Failed to connect socket:", error);
        if (isMounted) {
          toast.error("Failed to establish real-time connection");
        }
      };
    };

    initializeSocket();

    return () => {
      isMounted = false;
      socketService.offNotification();
      socketService.removeAllListeners();
      if (currentConversationId) {
        socketService.leaveConversation(currentConversationId);
      }
    };
  }, [token, userId, currentConversationId, refetchChatList, refetchMessages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (messagesResponse && messagesResponse.success) {
      console.log("Loaded messages from API:", messagesResponse.messages.length);
      setMessages(messagesResponse.messages);
      
      // Mark conversation as seen using API call (with delay to allow user to actually see messages)
      if (currentConversationId) {
        const unseenMessages = messagesResponse.messages.filter(msg => 
          msg.sender._id !== userId && msg.status !== 'seen'
        );
        
        if (unseenMessages.length > 0) {
          // Delay marking as seen to allow user to actually read the messages
          setTimeout(() => {
            markConversationAsSeen(currentConversationId)
              .unwrap()
              .then((result) => {
                console.log(`Marked ${result.updatedCount} messages as seen`);
                
                // Decrement unread message count by the number of messages marked as seen
                for (let i = 0; i < result.updatedCount; i++) {
                  dispatch(decrementUnreadMessageCount());
                }
                
                // Update local chat list to reflect seen messages
                setChatSummaries(prev =>
                  prev.map(chat =>
                    chat.id === currentConversationId ? { ...chat, unreadCount: 0 } : chat
                  )
                );
                
                // Refetch chat list to get updated counts from server
                setTimeout(() => {
                  refetchChatList();
                }, 500);
              })
              .catch((error) => {
                console.error("Failed to mark conversation as seen:", error);
                // Fallback to socket method
                unseenMessages.forEach(msg => {
                  socketService.markMessageAsSeen(msg._id, currentConversationId);
                });
              });
          }, 2000); // 2 second delay to allow user to see the messages
        }
      }
    }
  }, [messagesResponse, currentConversationId, userId, markConversationAsSeen, refetchChatList, dispatch]);

  const handleStartChat = useCallback(async (user: { 
    id: string; 
    username?: string; 
    firstName?: string; 
    profilePicture?: string; 
    _id?: string;
    fullname?: string;
  }) => {
    const userChatId = user.id || user._id;
    if (!userChatId) {
      toast.error("Invalid user data");
      return;
    }

    const chatName = user.fullname || user.username || user.firstName || "Unknown User";
    const profilePicture = user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=611DD0&color=fff`;
    
    try {
      // First, create or get the conversation using RTK Query
      const result = await createOrGetConversation({
        participantId: userChatId
      }).unwrap();

      const conversationId = result.conversation._id;

      // Check if chat already exists in our local state
      const existingChat = chatSummaries.find((c) => c.id === conversationId);
      
      if (!existingChat) {
        const userData: Receiver = {
          _id: userChatId,
          username: user.username,
          profilePicture: user.profilePicture
        };
        
        const newChat: Chat = {
          id: conversationId, // Use conversation ID, not user ID
          userId: userChatId,
          name: chatName,
          lastMessage: "Start a conversation",
          time: new Date().toISOString(),
          image: profilePicture,
          profilePicture: profilePicture,
          unreadCount: 0,
          userData: userData
        };
        
        setChatSummaries((prev) => [newChat, ...prev]);
      }
      
      dispatch(setActiveChat(chatName));
      dispatch(setCurrentConversationId(conversationId)); // Use conversation ID
      setIsSearchOpen(false);
      
      setTimeout(() => {
        refetchMessages();
        refetchChatList();
      }, 100);
      
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start conversation. Please try again.');
    }
  }, [chatSummaries, dispatch, refetchMessages, refetchChatList, createOrGetConversation]);

  // FIXED: Prevent duplicate message sending and ensure instant UI
  const handleSendMessage = useCallback(async (msg: Omit<MessageType, "_id">) => {
    if (!currentConversationId || isSendingRef.current) return;

    isSendingRef.current = true;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimistic: MessageType = {
      ...msg,
      _id: tempId,
      createdAt: new Date().toISOString(),
      status: "sending",
      sender: { _id: userId, username: "You" },
      receiver: { _id: currentConversationId }
    };

    // Optimistic local update and queue
    setMessages(prev => [...prev, optimistic]);
    messageQueueRef.current.set(tempId, optimistic);

    try {
      if (isSocketConnected) {
        socketService.sendMessage({ 
          conversationId: currentConversationId, 
          content: msg.content,
          receiverId: currentConversationId
        });
        // Socket server emits "newMessage" with persisted message; UI already shows optimistic
      } else {
        const result = await sendMessageApi({ 
          conversationId: currentConversationId, 
          content: msg.content
        }).unwrap();
        setMessages(prev => prev.map(m => m._id === tempId ? { ...result, status: "sent" } as MessageType : m));
        messageQueueRef.current.delete(tempId);
      }
    } catch  {
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: "failed" } : m));
      toast.error("Failed to send message");
    } finally {
      isSendingRef.current = false;
    }
  }, [currentConversationId, isSocketConnected, userId, sendMessageApi]);

  const handleRetryFailedMessage = async (messageId: string) => {
    const failedMessage = messageQueueRef.current.get(messageId);
    if (!failedMessage || !currentConversationId) return;

    try {
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId ? { ...m, status: "sending" } : m
        )
      );

      if (isSocketConnected) {
        socketService.sendMessage({
          conversationId: currentConversationId, 
          receiverId: currentConversationId,
          content: failedMessage.content,
        });
      } else {
        const result = await sendMessageApi({
          conversationId: currentConversationId,
          content: failedMessage.content
        }).unwrap();
        
        setMessages(prev => prev.map(m => 
          m._id === messageId ? { ...result, status: "sent" } : m
        ));
        messageQueueRef.current.delete(messageId);
      }
    } catch (error) {
      console.error("Failed to retry message:", error);
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId ? { ...m, status: "failed" } : m
        )
      );
    }
  };

  // FIXED: Handle chat selection properly
  const handleSelectChat = useCallback((chatId: string) => {
    console.log("Message.tsx: Selecting chat:", chatId);
    
    // If empty chatId, clear the selection
    if (!chatId) {
      console.log("Clearing chat selection");
      dispatch(setActiveChat(""));
      dispatch(setCurrentConversationId(null));
      return;
    }
    
    // Don't decrement here - wait for messages to be actually marked as seen
    
    // First check in chatSummaries (local + API data)
    const localChat = chatSummaries.find(c => c.id === chatId);
    
    if (localChat) {
      console.log("Found chat in local summaries:", localChat.name);
      dispatch(setActiveChat(localChat.name));
      dispatch(setCurrentConversationId(chatId));
      
      // Reset unread count for this chat
      setChatSummaries(prev =>
        prev.map(c =>
          c.id === chatId ? { ...c, unreadCount: 0 } : c
        )
      );
    } else {
      // If not found locally, check in API chat list
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiChat = chatListUsers.find((user: any) => (user.userId || user.id) === chatId);
      if (apiChat) {
        console.log("Found chat in API data:", apiChat.name);
        dispatch(setActiveChat(apiChat.name || apiChat.username));
        dispatch(setCurrentConversationId(chatId));
      } else {
        // If still not found, create a basic chat entry
        console.log("Chat not found, creating basic entry");
        dispatch(setActiveChat("User"));
        dispatch(setCurrentConversationId(chatId));
        
        // Add to chat summaries for future reference
        const newChat: Chat = {
          id: chatId,
          userId: chatId,
          name: "User",
          lastMessage: "Start a conversation",
          time: new Date().toISOString(),
          profilePicture: `https://ui-avatars.com/api/?name=User&background=611DD0&color=fff`,
          unreadCount: 0
        };
        setChatSummaries(prev => [newChat, ...prev]);
      }
    }
    
    // Refetch messages for the selected chat
    setTimeout(() => {
      refetchMessages();
    }, 100);
  }, [chatSummaries, chatListUsers, dispatch, refetchMessages]);

  // Debug logging
  useEffect(() => {
    console.log("Message Component State:", {
      activeChat,
      currentConversationId,
      chatSummariesCount: chatSummaries.length,
      chatListUsersCount: chatListUsers.length,
      messagesCount: messages.length,
      isSocketConnected,
      messagesLoading
    });
  }, [activeChat, currentConversationId, chatSummaries.length, chatListUsers.length, messages.length, isSocketConnected, messagesLoading]);

  return (
    <div className="flex flex-col h-screen relative bg-gray-100">
      <div className="flex-1 flex flex-col ml-[-110px] mt-[80px]">
        <div className="flex h-full">
          <ChatList
            chats={chatSummaries}
            activeChatId={currentConversationId ?? undefined}
            onSelectChat={handleSelectChat}
            onStartChat={handleStartChat}
            isConnected={isSocketConnected}
          />
          <ChatBox
            activeChat={activeChat || ""}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRetryMessage={handleRetryFailedMessage}
            isConnected={isSocketConnected}
            currentConversationId={currentConversationId}
          />
        </div>
      </div>
      
      {isSearchOpen && (
        <SearchModal
          startChat={handleStartChat}
          startGroupChat={() => { console.log('Group chat feature not implemented yet'); }}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
      
      {!isSocketConnected && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          ⚡ Connecting to server...
        </div>
      )}
    </div>
  );
};

export default Message;