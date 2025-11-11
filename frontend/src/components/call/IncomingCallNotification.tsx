import { useState, useEffect } from 'react';
import { socketService } from '../../services/socketServices';
import CallModal from '../message/CallModal';
import { toast } from 'react-toastify';

/**
 * Global Incoming Call Notification Component
 * Shows incoming call modal regardless of which page user is on
 */
const IncomingCallNotification = () => {
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<{
    id: string;
    name: string;
    profilePicture: string;
    conversationId?: string;
  } | null>(null);

  useEffect(() => {
    // Only set up listeners if socket is connected
    if (!socketService.isSocketConnected()) {
      console.log('⚠️ Socket not connected, skipping incoming call listener setup');
      return;
    }

    console.log('✅ Setting up global incoming call listeners');

    const handleIncomingCall = (data: {
      from: string;
      callType: 'voice' | 'video';
      callerInfo: {
        id: string;
        name: string;
        profilePicture: string;
      };
      conversationId?: string;
      signal?: any;
    }) => {
      console.log('📞 GLOBAL: Incoming call received:', data);
      
      // Set incoming call data
      setIncomingCallData({
        id: data.callerInfo.id,
        name: data.callerInfo.name,
        profilePicture: data.callerInfo.profilePicture,
        conversationId: data.conversationId,
      });
      setCallType(data.callType);
      setIsIncomingCall(true);
      setShowCallModal(true);
      
      // Show toast notification
      toast.info(`📞 Incoming ${data.callType} call from ${data.callerInfo.name}`, {
        autoClose: 5000,
        position: 'top-center',
      });
    };

    const handleCallRejected = () => {
      console.log('📞 GLOBAL: Call rejected');
      setShowCallModal(false);
      setIncomingCallData(null);
      toast.error('Call declined');
    };

    const handleCallEnded = (data?: { duration?: number; reason?: string }) => {
      console.log('📞 GLOBAL: Call ended', data);
      setShowCallModal(false);
      setIncomingCallData(null);
      if (data?.reason) {
        toast.info(`Call ended - ${data.reason}`);
      } else {
        toast.info('Call ended');
      }
    };

    const handleCallTimeout = () => {
      console.log('📞 GLOBAL: Call timed out');
      setShowCallModal(false);
      setIncomingCallData(null);
      toast.error('Call not answered');
    };

    const handleCallAccepted = () => {
      console.log('📞 GLOBAL: Call accepted');
      toast.success('Call connected');
    };

    // Register socket listeners
    socketService.onIncomingCall(handleIncomingCall);
    socketService.onCallRejected(handleCallRejected);
    socketService.onCallEnded(handleCallEnded);
    socketService.onCallTimeout(handleCallTimeout);
    socketService.onCallAccepted(handleCallAccepted);

    console.log('✅ Global incoming call listeners registered');

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up global incoming call listeners');
      socketService.offIncomingCall(handleIncomingCall);
      socketService.offCallRejected(handleCallRejected);
      socketService.offCallEnded(handleCallEnded);
      socketService.offCallTimeout(handleCallTimeout);
      socketService.offCallAccepted(handleCallAccepted);
    };
  }, []);

  const handleCloseCall = () => {
    setShowCallModal(false);
    setIncomingCallData(null);
    setIsIncomingCall(false);
  };

  const handleAcceptCall = () => {
    console.log('✅ Call accepted by user');
    // Modal will handle the socket emission
  };

  const handleRejectCall = () => {
    console.log('❌ Call rejected by user');
    // Modal will handle the socket emission
    handleCloseCall();
  };

  // Don't render anything if no incoming call
  if (!showCallModal || !incomingCallData) {
    return null;
  }

  return (
    <CallModal
      isOpen={showCallModal}
      callType={callType}
      isIncoming={isIncomingCall}
      caller={{
        id: incomingCallData.id,
        name: incomingCallData.name,
        profilePicture: incomingCallData.profilePicture,
      }}
      onClose={handleCloseCall}
      onAccept={handleAcceptCall}
      onReject={handleRejectCall}
      conversationId={incomingCallData.conversationId}
    />
  );
};

export default IncomingCallNotification;
