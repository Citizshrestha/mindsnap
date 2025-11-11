// src/services/socketServices.ts
import axios from "axios";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import type { MessageType } from "../data/messageSample";

export interface TargetId {
  _id: string;
  [key: string]: string | number | boolean | undefined;
}

export interface NotificationType {
  _id: string;
  type: string;
  // message: string;
  createdAt: string;
  // read: boolean;
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  relatedUser?: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  post?: {
    _id: string;
    content: string;
  };
  read: boolean;
  message: string;
  action?: string;
  isFollowing?: boolean;
  reactionType?: string;
}

interface SocketServiceOptions {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  reconnectDelayMax?: number;
  timeout?: number;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectDelayMax: number = 5000;
  private timeout: number = 20000;
  private userId: string | null = null;
  private messageQueue: Array<{ receiverId: string; content: string }> = [];
  private isProcessingQueue: boolean = false;

  constructor(options?: SocketServiceOptions) {
    if (options) {
      this.maxReconnectAttempts = options.maxReconnectAttempts || this.maxReconnectAttempts;
      this.reconnectDelay = options.reconnectDelay || this.reconnectDelay;
      this.reconnectDelayMax = options.reconnectDelayMax || this.reconnectDelayMax;
      this.timeout = options.timeout || this.timeout;
    }
  }

  async connect(token: string, userId: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected && this.userId === userId) {
        console.log('Socket already connected for user:', userId);
        resolve(this.socket);
        return;
      }

      console.log("Attempting to connect with token:", token.substring(0, 20) + "...", "userId:", userId);

      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: this.reconnectDelayMax,
        timeout: this.timeout,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to Socket.IO server at", new Date().toLocaleString());
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.userId = userId;
        this.joinUserRoom(userId);

        // Process any queued messages
        this.processMessageQueue();

        resolve(this.socket!);
      });

      this.socket.on("connect_error", async (error) => {
        console.error("❌ Socket connection error:", error.message);
        this.isConnected = false;

        if (error.message.includes("Invalid authentication token")) {
          try {
            // console.log("Attempting to refresh token...");
            const response = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/refresh`,
              {},
              { withCredentials: true }
            );
            const newToken = response.data.accessToken;
            localStorage.setItem("accessToken", newToken);
            // console.log("Token refreshed successfully:", newToken.substring(0, 20) + "...");

            // Update auth token and reconnect
            this.socket!.auth = { token: newToken };
            this.socket!.connect();
          } catch (refreshError) {
            console.error("Failed to refresh token:", refreshError);
            toast.error("Session expired. Please log in again.");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userId");
            reject(new Error("Authentication failed: Unable to refresh token"));
          }
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          toast.error("Failed to connect to server after multiple attempts.");
          reject(new Error("Max reconnection attempts reached"));
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from Socket.IO:", reason);
        this.isConnected = false;
      });

      this.socket.on("reconnect", () => {
        console.log("🔄 Reconnected to Socket.IO at", new Date().toLocaleString());
        if (this.userId) this.joinUserRoom(this.userId);
      });

      this.socket.on("reconnect_attempt", (attempt) => {
        this.reconnectAttempts = attempt;
        console.log(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      });

      this.socket.on("reconnect_failed", () => {
        console.error("❌ Reconnection failed after maximum attempts");
        toast.error("Unable to reconnect to server. Please refresh the page.");
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log("🔌 Manually disconnecting socket for user:", this.userId);
      
      // Emit a custom logout event before disconnecting
      this.socket.emit("userLogout", { userId: this.userId });
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      this.messageQueue = [];
      console.log("🔌 Socket disconnected at", new Date().toLocaleString());
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  joinUserRoom(userId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit("joinUser", userId);
      this.userId = userId;
      // console.log(`✅ User ${userId} joined notification room at`, new Date().toLocaleString());
    } else {
      console.warn("⚠️ Cannot join room: Socket is not connected");
    }
  }

  onMessage(callback: (message: MessageType) => void): void {
    this.socket?.on("newMessage", (payload: MessageType) => {
      // Normalize payload shape: backend may emit either the raw message or { success, message, data }
      const message = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
      console.log('Received new message (normalized):', message);
      callback(message as MessageType);
    });
  }

onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
  this.socket?.on("userTyping", callback);
}

  onUsersOnline(callback: (users: string[]) => void): void {
    this.socket?.on("usersOnline", callback);
  }

  onMessageStatusUpdate(callback: (data: { messageId: string; status: string }) => void): void {
    this.socket?.on("messageStatusUpdate", callback);
  }

  onNotification(callback: (notification: NotificationType) => void): void {
    this.socket?.on("newNotification", callback);
  }

  offNotification(callback?: (notification: NotificationType) => void): void {
    if (callback) {
      this.socket?.off("newNotification", callback);
    } else {
      this.socket?.off("newNotification");
    }
  }

  onError(callback: (error: { error: string }) => void): void {
    this.socket?.on("messageError", callback);
  }

  // Listen for message deletion events
  onMessageDeleted(callback: (data: { messageId: string; deletedFor: string[]; hardDelete: boolean; conversationId: string }) => void): void {
    this.socket?.on("messageDeleted", callback);
  }

  // Listen for message edit events
  onMessageEdited(callback: (data: { messageId: string; content: string; isEdited: boolean; editedAt: string }) => void): void {
    this.socket?.on("messageEdited", callback);
  }

  // Remove message deletion listener
  offMessageDeleted(callback?: (data: { messageId: string; deletedFor: string[]; hardDelete: boolean; conversationId: string }) => void): void {
    if (callback) {
      this.socket?.off("messageDeleted", callback);
    } else {
      this.socket?.off("messageDeleted");
    }
  }

  // Remove message edit listener
  offMessageEdited(callback?: (data: { messageId: string; content: string; isEdited: boolean; editedAt: string }) => void): void {
    if (callback) {
      this.socket?.off("messageEdited", callback);
    } else {
      this.socket?.off("messageEdited");
    }
  }

  // Listen for conversation refresh events (when deleted messages need UI refresh)
  onConversationRefresh(callback: (data: { conversationId: string; reason: string }) => void): void {
    this.socket?.on("conversationRefresh", callback);
  }

  // Remove conversation refresh listener
  offConversationRefresh(callback?: (data: { conversationId: string; reason: string }) => void): void {
    if (callback) {
      this.socket?.off("conversationRefresh", callback);
    } else {
      this.socket?.off("conversationRefresh");
    }
  }

  // Listen for chat list refresh events
  onChatListRefresh(callback: (data: { reason: string; conversationId: string; deletedBy: string }) => void): void {
    this.socket?.on("chatListRefresh", callback);
  }

  // Remove chat list refresh listener
  offChatListRefresh(callback?: (data: { reason: string; conversationId: string; deletedBy: string }) => void): void {
    if (callback) {
      this.socket?.off("chatListRefresh", callback);
    } else {
      this.socket?.off("chatListRefresh");
    }
  }

  // Listen for bulk message deletion events
  onBulkMessageDeleted(callback: (data: { messageIds: string[]; conversationId: string; deletedBy: string; count: number }) => void): void {
    this.socket?.on("bulkMessageDeleted", callback);
  }

  // Remove bulk message deletion listener
  offBulkMessageDeleted(callback?: (data: { messageIds: string[]; conversationId: string; deletedBy: string; count: number }) => void): void {
    if (callback) {
      this.socket?.off("bulkMessageDeleted", callback);
    } else {
      this.socket?.off("bulkMessageDeleted");
    }
  }

  // Listen for user account deletion events
  onUserAccountDeleted(callback: (data: { deletedUserId: string; deletedUsername: string; message: string }) => void): void {
    this.socket?.on("userAccountDeleted", callback);
  }

  // Remove user account deletion listener
  offUserAccountDeleted(callback?: (data: { deletedUserId: string; deletedUsername: string; message: string }) => void): void {
    if (callback) {
      this.socket?.off("userAccountDeleted", callback);
    } else {
      this.socket?.off("userAccountDeleted");
    }
  }

  // Listen for individual user deletion events (for followers/following)
  onUserDeleted(callback: (data: { deletedUserId: string; deletedUsername: string; message: string }) => void): void {
    this.socket?.on("userDeleted", callback);
  }

  // Remove individual user deletion listener
  offUserDeleted(callback?: (data: { deletedUserId: string; deletedUsername: string; message: string }) => void): void {
    if (callback) {
      this.socket?.off("userDeleted", callback);
    } else {
      this.socket?.off("userDeleted");
    }
  }

  joinConversation(receiverId: string): void {
    this.socket?.emit("joinConversation", receiverId);
  }

  leaveConversation(receiverId: string): void {
    this.socket?.emit("leaveConversation", receiverId);
  }

  sendMessage(messageData: { conversationId: string; content: string; receiverId?: string }): void {
    if (!messageData.conversationId || !messageData.content) {
      console.error('Invalid message data:', messageData);
      toast.error('Cannot send message: Missing conversation ID or content');
      return;
    }

    if (this.isSocketConnected()) {
      console.log('Sending message via socket:', messageData);
      this.socket?.emit('sendMessage', {
        ...messageData,
        receiverId: messageData.receiverId || null,
      });
    } else {
      // Queue the message
      const queuedMessage = {
        receiverId: messageData.receiverId || messageData.conversationId,
        content: messageData.content,
      };
      this.messageQueue.push(queuedMessage);
      console.log('Message queued, socket not connected:', queuedMessage);

      // Attempt to reconnect if not already trying
      if (this.reconnectAttempts === 0) {
        this.tryReconnect();
      }
    }
  }

  async sendMessageWithRetry(
    messageData: { receiverId: string; content: string },
    maxRetries = 3
  ): Promise<void> {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        if (this.isSocketConnected()) {
          this.socket?.emit("sendMessage", messageData);
          return;
        } else {
          await this.reconnect();
        }
      } catch (error) {
        attempts++;
        console.warn(`Send message attempt ${attempts} failed:`, error);

        if (attempts >= maxRetries) {
          throw new Error("Failed to send message after multiple attempts");
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
      }
    }
  }

  private async reconnect(): Promise<void> {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      try {
        await this.connect(token, userId);
      } catch (error) {
        throw new Error(`Reconnection failed: ${error}`);
      }
    } else {
      throw new Error("Cannot reconnect: Missing authentication data");
    }
  }

  private async tryReconnect(): Promise<void> {
    try {
      await this.reconnect();
    } catch (error) {
      console.error("Background reconnection attempt failed:", error);
    }
  }

  private processMessageQueue(): void {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;

    const processNext = async () => {
      if (this.messageQueue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      const message = this.messageQueue[0];

      try {
        await this.sendMessageWithRetry(message, 2);
        this.messageQueue.shift(); // Remove successfully sent message
        processNext(); // Process next message
      } catch (error) {
        console.error("Failed to send queued message:", error);
        this.isProcessingQueue = false;
      }
    };

    processNext();
  }

startTyping(receiverId: string): void {
  this.socket?.emit("typingStart", { receiverId, userId: this.userId });
}

stopTyping(receiverId: string): void {
  this.socket?.emit("typingStop", { receiverId, userId: this.userId });
}

  markMessageAsSeen(messageId: string, receiverId: string): void {
    if (this.isSocketConnected()) {
      this.socket?.emit("messageSeen", { messageId, receiverId });
    }
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

 

sendLikeNotification(notificationData: {
  recipientId: string;
  senderId: string;
  targetType: string;
  targetId: string;
  type: string;
  reactionType?: string;
  message?: string;
}): void {
  this.sendNotification(notificationData);
}

  sendCommentNotification(notificationData: {
  recipientId: string;
  senderId: string;
  targetType: string;
  targetId: string;
  type: string;
  message?: string;
}): void {
  this.sendNotification(notificationData);
}


sendCommentLikeNotification(notificationData: {
  recipientId: string;
  senderId: string;
  targetType: string;
  targetId: string;
  type: string;
  message?: string;
}): void {
  this.sendNotification(notificationData);
}

 // The main sendNotification method that handles everything
sendNotification(notificationData: {
  recipientId: string;
  senderId: string;
  targetType: string;
  targetId: string;
  type: string;
  reactionType?: string;
  message?: string;
}): void {
  if (this.socket && this.isConnected) {
    const userState = JSON.parse(localStorage.getItem('userState') || '{}');
    const currentUser = userState.user || {};
    
    this.socket.emit("sendNotification", {
      ...notificationData,
      senderUsername: currentUser.username || 'Someone',
      senderProfilePicture: currentUser.profilePicture || '',
    });
  }
}
  // Health check method with optional chaining
  async checkConnection(): Promise<boolean> {
    if (!this.socket) return false;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);
      
      if (this.socket?.connected) {
        clearTimeout(timeout);
        resolve(true);
      } else {
        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });
        
        this.socket?.once('connect_error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      }
    });
  }

  // ============ CALL EVENT LISTENERS ============
  
  // Listen for incoming calls
  onIncomingCall(callback: (data: {
    from: string;
    callType: 'voice' | 'video';
    callerInfo: {
      id: string;
      name: string;
      profilePicture: string;
    };
    signal?: any;
  }) => void): void {
    this.socket?.on('incomingCall', callback);
  }

  // Remove incoming call listener
  offIncomingCall(callback?: any): void {
    if (callback) {
      this.socket?.off('incomingCall', callback);
    } else {
      this.socket?.off('incomingCall');
    }
  }

  // Listen for call accepted
  onCallAccepted(callback: (data: { signal?: any }) => void): void {
    this.socket?.on('callAccepted', callback);
  }

  // Remove call accepted listener
  offCallAccepted(callback?: any): void {
    if (callback) {
      this.socket?.off('callAccepted', callback);
    } else {
      this.socket?.off('callAccepted');
    }
  }

  // Listen for call rejected
  onCallRejected(callback: () => void): void {
    this.socket?.on('callRejected', callback);
  }

  // Remove call rejected listener
  offCallRejected(callback?: any): void {
    if (callback) {
      this.socket?.off('callRejected', callback);
    } else {
      this.socket?.off('callRejected');
    }
  }

  // Listen for call ended
  onCallEnded(callback: (data?: { duration?: number; endedBy?: string }) => void): void {
    this.socket?.on('callEnded', callback);
  }

  // Remove call ended listener
  offCallEnded(callback?: any): void {
    if (callback) {
      this.socket?.off('callEnded', callback);
    } else {
      this.socket?.off('callEnded');
    }
  }

  // Listen for call timeout/no answer
  onCallTimeout(callback: () => void): void {
    this.socket?.on('callTimeout', callback);
  }

  // Remove call timeout listener
  offCallTimeout(callback?: any): void {
    if (callback) {
      this.socket?.off('callTimeout', callback);
    } else {
      this.socket?.off('callTimeout');
    }
  }

  // Listen for ICE candidates
  onIceCandidate(callback: (data: { candidate: any }) => void): void {
    this.socket?.on('iceCandidate', callback);
  }

  // Remove ICE candidate listener
  offIceCandidate(callback?: any): void {
    if (callback) {
      this.socket?.off('iceCandidate', callback);
    } else {
      this.socket?.off('iceCandidate');
    }
  }
}

export const socketService = new SocketService({
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  reconnectDelayMax: 10000,
  timeout: 30000,
});