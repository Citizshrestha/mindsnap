import { useState, useEffect, useRef } from 'react';
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone } from 'react-icons/fa';
import SimplePeer from 'simple-peer';
import { socketService } from '../../services/socketServices';
import { toast } from 'react-toastify';

interface CallModalProps {
  isOpen: boolean;
  callType: 'voice' | 'video';
  isIncoming: boolean;
  caller: {
    id: string;
    name: string;
    profilePicture: string;
  };
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  conversationId?: string; // Add conversationId for sending call messages
}

const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callType,
  isIncoming,
  caller,
  onClose,
  onAccept,
  onReject,
  conversationId,
}) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timeoutMessage, setTimeoutMessage] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Initialize call when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Play ringtone
    playRingtone();

    // Send call notification to receiver
    if (!isIncoming) {
      initializeMedia();
      sendCallNotification();
      
      // Set 2-minute timeout
      callTimeoutRef.current = setTimeout(() => {
        handleCallTimeout();
      }, 120000); // 2 minutes
    }

    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Start duration counter when call connects
  useEffect(() => {
    if (callStatus === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  const initializeMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      });

      setStream(mediaStream);

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      handleEndCall();
    }
  };

  const handleAcceptCall = async () => {
    stopRingtone();
    if (onAccept) {
      onAccept();
    }
    
    // Clear timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }
    
    await initializeMedia();
    setCallStatus('connecting');
    
    // Emit accept event
    socketService.getSocket()?.emit('answerCall', {
      to: caller.id,
      conversationId: conversationId,
    });
    
    // Update status to connected
    setTimeout(() => {
      setCallStatus('connected');
    }, 1000);
    
    toast.success('Call connected');
  };

  const handleRejectCall = () => {
    stopRingtone();
    if (onReject) {
      onReject();
    }
    
    // Emit reject event
    socketService.getSocket()?.emit('rejectCall', {
      to: caller.id,
      conversationId: conversationId,
    });
    
    toast.info('Call declined');
    cleanup();
    onClose();
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    stopRingtone();
    
    // Emit end call event with duration
    const currentUserId = localStorage.getItem('userId');
    socketService.getSocket()?.emit('endCall', {
      to: caller.id,
      conversationId: conversationId,
      duration: callDuration,
      endedBy: currentUserId,
    });

    toast.info(`Call ended - ${formatDuration(callDuration)}`);
    
    cleanup();

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleCallTimeout = () => {
    setCallStatus('ended');
    setTimeoutMessage('No answer');
    stopRingtone();
    
    // Emit timeout event
    socketService.getSocket()?.emit('callTimeout', {
      to: caller.id,
      conversationId: conversationId,
    });

    toast.error('Call not answered');
    
    cleanup();

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const sendCallNotification = () => {
    const socket = socketService.getSocket();
    const currentUserId = localStorage.getItem('userId');
    const currentUserName = localStorage.getItem('username') || 'Someone';
    const currentUserPic = localStorage.getItem('profilePicture') || '';

    socket?.emit('callUser', {
      userToCall: caller.id,
      callType: callType,
      from: currentUserId,
      conversationId: conversationId,
      callerInfo: {
        id: currentUserId,
        name: currentUserName,
        profilePicture: currentUserPic,
      },
    });
  };

  const playRingtone = () => {
    try {
      // Create audio context for ringtone
      ringtoneRef.current = new Audio();
      
      if (isIncoming) {
        // Incoming call sound (ringtone for receiver)
        ringtoneRef.current.src = '/sounds/incoming-call.mp3';
      } else {
        // Outgoing call sound (ringing tone for caller)
        ringtoneRef.current.src = '/sounds/outgoing-call.mp3';
      }
      
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch((e) => {
        console.log('Could not play ringtone:', e);
        // Fallback to browser beep
        playBeep();
      });
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
  };

  const playBeep = () => {
    // Fallback beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Repeat beep
      setTimeout(() => {
        if (callStatus === 'ringing') {
          playBeep();
        }
      }, 1000);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream && callType === 'video') {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const cleanup = () => {
    // Stop ringtone
    stopRingtone();
    
    // Stop all media tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Clear intervals and timeouts
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }

    setCallDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300000] bg-black/90 flex items-center justify-center">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Call Status Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img
              src={caller.profilePicture || '/default-avatar.png'}
              alt={caller.name}
              className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 shadow-lg"
              onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{caller.name}</h2>
          <p className="text-white/70 text-lg">
            {callStatus === 'ringing' && isIncoming && `Incoming ${callType} call...`}
            {callStatus === 'ringing' && !isIncoming && 'Calling...'}
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'ended' && (timeoutMessage || 'Call ended')}
          </p>
        </div>

        {/* Video Container */}
        {callType === 'video' && callStatus === 'connected' && (
          <div className="relative mb-6 bg-black rounded-2xl overflow-hidden" style={{ height: '400px' }}>
            {/* Remote Video (Main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/30">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center items-center gap-4">
          {callStatus === 'ringing' && isIncoming ? (
            <>
              {/* Accept Call Button */}
              <button
                onClick={handleAcceptCall}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-6 shadow-lg transition-all transform hover:scale-110"
              >
                <FaVideo size={32} />
              </button>

              {/* Reject Call Button */}
              <button
                onClick={handleRejectCall}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transition-all transform hover:scale-110"
              >
                <FaPhoneSlash size={32} />
              </button>
            </>
          ) : (
            <>
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                } text-white rounded-full p-5 shadow-lg transition-all transform hover:scale-110`}
                disabled={callStatus === 'ended'}
              >
                {isMuted ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
              </button>

              {/* Video Toggle (only for video calls) */}
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`${
                    isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                  } text-white rounded-full p-5 shadow-lg transition-all transform hover:scale-110`}
                  disabled={callStatus === 'ended'}
                >
                  {isVideoOff ? <FaVideoSlash size={24} /> : <FaVideo size={24} />}
                </button>
              )}

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transition-all transform hover:scale-110"
                disabled={callStatus === 'ended'}
              >
                <FaPhoneSlash size={28} />
              </button>
            </>
          )}
        </div>

        {/* Ringing Animation */}
        {callStatus === 'ringing' && (
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for mirroring local video */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default CallModal;
