import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private userId: string | null = null;

  connect(token: string, userId: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        if (this.userId !== userId) {
          this.joinUserRoom(userId);
          this.userId = userId;
        }
        resolve(this.socket);
        return;
      }

      this.socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000", {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to Socket.IO server");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        if (this.userId) this.joinUserRoom(this.userId);
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from Socket.IO:", reason);
        this.isConnected = false;
      });

      this.socket.on("reconnect", () => {
        console.log("🔄 Reconnected to Socket.IO");
        if (this.userId) this.joinUserRoom(this.userId);
      });

      this.socket.on("reconnect_attempt", (attempt) => {
        this.reconnectAttempts = attempt;
        console.log(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      });

      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error("Connection timeout"));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      console.log("🔌 Socket disconnected");
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  joinUserRoom(userId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("joinUser", userId);
      this.userId = userId;
      console.log(`✅ User ${userId} joined notification room`);
    }
  }

  onMessage(callback: (message: unknown) => void): void {
    this.socket?.on("newMessage", callback);
  }

  onTyping(callback: (data: unknown) => void): void {
    this.socket?.on("userTyping", callback);
  }

  onUsersOnline(callback: (users: unknown[]) => void): void {
    this.socket?.on("usersOnline", callback);
  }

  onMessageStatusUpdate(callback: (data: unknown) => void): void {
    this.socket?.on("messageStatusUpdate", callback);
  }

  onNotification(callback: (notification: Notification) => void): void {
    this.socket?.on("newNotification", callback);
  }

  offNotification(callback: (notification: Notification) => void): void {
    this.socket?.off("newNotification", callback);
  }

  onError(callback: (error: unknown) => void): void {
    this.socket?.on("messageError", callback);
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit("joinConversation", conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit("leaveConversation", conversationId);
  }

  sendMessage(messageData: {
    conversationId: string;
    content: string;
    messageType?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
  }): void {
    this.socket?.emit("sendMessage", messageData);
  }

  startTyping(conversationId: string): void {
    this.socket?.emit("typingStart", { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit("typingStop", { conversationId });
  }

  markMessageAsSeen(messageId: string, conversationId: string): void {
    this.socket?.emit("messageSeen", { messageId, conversationId });
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

interface Notification {
  _id: string;
  sender: {
    _id: string;
    username: string;
    profilePicture: string;
  };
  type: "like" | "comment" | "follow" | "tag" | "message" | "follow_back";
  targetType: "Post" | "Comment" | "Message" | "Story" | "Profile";
  targetId: { _id: string; [key: string]: string | number | boolean | undefined };
  createdAt: string;
  read: boolean;
  message: string;
  action?: string;
}

export const socketService = new SocketService();