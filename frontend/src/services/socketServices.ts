import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('cd Connected to Socket.IO server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Socket.IO:', reason);
        this.isConnected = false;
      });

      this.socket.on('reconnect_attempt', (attempt) => {
        this.reconnectAttempts = attempt;
        console.log(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      });

      // Set timeout for connection
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Event listeners
  onMessage(callback: (message: unknown) => void): void {
    this.socket?.on('newMessage', callback);
  }

  onTyping(callback: (data: unknown) => void): void {
    this.socket?.on('userTyping', callback);
  }

  onUsersOnline(callback: (users: unknown[]) => void): void {
    this.socket?.on('usersOnline', callback);
  }

  onMessageStatusUpdate(callback: (data: unknown) => void): void {
    this.socket?.on('messageStatusUpdate', callback);
  }

  onError(callback: (error: unknown) => void): void {
    this.socket?.on('messageError', callback);
  }

  // Event emitters
  joinConversation(conversationId: string): void {
    this.socket?.emit('joinConversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leaveConversation', conversationId);
  }

  sendMessage(messageData: {
    conversationId: string;
    content: string;
    messageType?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
  }): void {
    this.socket?.emit('sendMessage', messageData);
  }

  startTyping(conversationId: string): void {
    this.socket?.emit('typingStart', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit('typingStop', { conversationId });
  }

  markMessageAsSeen(messageId: string, conversationId: string): void {
    this.socket?.emit('messageSeen', { messageId, conversationId });
  }

  // Remove event listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();