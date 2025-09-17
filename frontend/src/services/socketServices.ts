import { io, Socket } from "socket.io-client";

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

export interface MessageType {
  _id: string;
  content: string;
  messageType: "text";
  createdAt: string;
  status: string;
  sender: { _id: string; username?: string; profilePicture?: string };
  receiver: { _id: string; username?: string };
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private userId: string | null = null;

  connect(token: string, userId: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected && this.userId === userId) {
        resolve(this.socket);
        return;
      }

      this.socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to Socket.IO server at", new Date().toLocaleString());
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.userId = userId;
        this.joinUserRoom(userId);
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error.message);
        this.isConnected = false;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
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

      // Remove aggressive timeout to allow reconnection attempts
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
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
      console.log(`✅ User ${userId} joined notification room at`, new Date().toLocaleString());
    } else {
      console.warn("⚠️ Cannot join room: Socket is not connected");
    }
  }

  onMessage(callback: (message: MessageType) => void): void {
    this.socket?.on("newMessage", callback);
  }

  onTyping(callback: (data: { userId: string; receiverId: string; isTyping: boolean }) => void): void {
    this.socket?.on("userTyping", callback);
  }

  onUsersOnline(callback: (users: string[]) => void): void {
    this.socket?.on("usersOnline", callback);
  }

  onMessageStatusUpdate(callback: (data: { messageId: string; status: string }) => void): void {
    this.socket?.on("messageStatusUpdate", callback);
  }

  onNotification(callback: (notification: Notification) => void): void {
    this.socket?.on("newNotification", callback);
  }

  offNotification(callback: (notification: Notification) => void): void {
    this.socket?.off("newNotification", callback);
  }

  onError(callback: (error: { error: string }) => void): void {
    this.socket?.on("messageError", callback);
  }

  joinConversation(receiverId: string): void {
    this.socket?.emit("joinConversation", receiverId);
  }

  leaveConversation(receiverId: string): void {
    this.socket?.emit("leaveConversation", receiverId);
  }

  sendMessage(messageData: { receiverId: string; content: string }): void {
    this.socket?.emit("sendMessage", messageData);
  }

  startTyping(receiverId: string): void {
    this.socket?.emit("typingStart", receiverId);
  }

  stopTyping(receiverId: string): void {
    this.socket?.emit("typingStop", receiverId);
  }

  markMessageAsSeen(messageId: string, receiverId: string): void {
    this.socket?.emit("messageSeen", { messageId, receiverId });
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();