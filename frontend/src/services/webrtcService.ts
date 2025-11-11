// WebRTC Service for handling video/voice calls
import SimplePeer from 'simple-peer';
import { socketService } from './socketServices';

class WebRTCService {
  private peer: SimplePeer.Instance | null = null;
  private localStream: MediaStream | null = null;
  
  // STUN servers for NAT traversal
  private readonly iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

  /**
   * Initialize local media stream
   */
  async initializeLocalStream(video: boolean = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }

  /**
   * Create peer connection as call initiator
   */
  async createCall(
    recipientId: string,
    callType: 'voice' | 'video',
    onRemoteStream: (stream: MediaStream) => void
  ): Promise<void> {
    try {
      const stream = await this.initializeLocalStream(callType === 'video');

      this.peer = new SimplePeer({
        initiator: true,
        trickle: true,
        stream: stream,
        config: this.iceServers,
      } as any);

      // Send signal to recipient
      this.peer.on('signal', (signal) => {
        socketService.getSocket()?.emit('callUser', {
          userToCall: recipientId,
          signalData: signal,
          from: localStorage.getItem('userId'),
          callType,
        });
      });

      // Receive remote stream
      this.peer.on('stream', (remoteStream) => {
        onRemoteStream(remoteStream);
      });

      // Handle connection events
      this.peer.on('connect', () => {
        console.log('✅ Peer connection established');
      });

      this.peer.on('error', (err) => {
        console.error('❌ Peer connection error:', err);
        this.cleanup();
      });

      this.peer.on('close', () => {
        console.log('📞 Peer connection closed');
        this.cleanup();
      });
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  /**
   * Answer incoming call
   */
  async answerCall(
    callSignal: any,
    callType: 'voice' | 'video',
    onRemoteStream: (stream: MediaStream) => void
  ): Promise<void> {
    try {
      const stream = await this.initializeLocalStream(callType === 'video');

      this.peer = new SimplePeer({
        initiator: false,
        trickle: true,
        stream: stream,
        config: this.iceServers,
      } as any);

      // Send answer signal back
      this.peer.on('signal', (signal) => {
        socketService.getSocket()?.emit('answerCall', { signal });
      });

      // Receive remote stream
      this.peer.on('stream', (remoteStream) => {
        onRemoteStream(remoteStream);
      });

      // Handle connection events
      this.peer.on('connect', () => {
        console.log('✅ Peer connection established');
      });

      this.peer.on('error', (err) => {
        console.error('❌ Peer connection error:', err);
        this.cleanup();
      });

      this.peer.on('close', () => {
        console.log('📞 Peer connection closed');
        this.cleanup();
      });

      // Signal the peer
      this.peer.signal(callSignal);
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  /**
   * Handle incoming call signal
   */
  handleCallSignal(signal: any): void {
    if (this.peer) {
      this.peer.signal(signal);
    }
  }

  /**
   * Toggle microphone mute
   */
  toggleAudio(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * End call and cleanup resources
   */
  endCall(): void {
    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop all media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    // Destroy peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Check if browser supports WebRTC
   */
  static isWebRTCSupported(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.RTCPeerConnection !== 'undefined'
    );
  }
}

export const webrtcService = new WebRTCService();
