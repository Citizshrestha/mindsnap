/**
 * Socket.IO handlers for voice and video calling
 * Handles WebRTC signaling between clients
 */
import { Call } from '../models/call.models.js';
import { Message } from '../models/message.models.js';
import { Conversation } from '../models/conversation.models.js';
import mongoose from 'mongoose';

// Store active calls in memory
const activeCalls = new Map();

export const setupCallHandlers = (io, socket) => {
  console.log(`📞 Call handlers initialized for user: ${socket.id}`);

  // User initiates a call
  socket.on('callUser', async (data) => {
    const { userToCall, signalData, from, callType, conversationId, callerInfo } = data;
    
    console.log(`📞 ${callType} call initiated from ${from} to ${userToCall}`);
    
    try {
      // Create call record in database
      const newCall = await Call.create({
        caller: from,
        receiver: userToCall,
        callType: callType === 'voice' ? 'audio' : 'video',
        status: 'initiated',
        conversation: conversationId || null,
      });

      // Store call info in memory
      const callId = newCall._id.toString();
      activeCalls.set(callId, {
        callId,
        caller: from,
        receiver: userToCall,
        callType,
        conversationId,
        startTime: new Date(),
      });

      // Send incoming call notification to the recipient
      // Emit to user's socket room (user_${userId})
      io.to(`user_${userToCall}`).emit('incomingCall', {
        signal: signalData,
        from: from,
        callType: callType,
        callerInfo: callerInfo,
        callId: callId,
        conversationId: conversationId,
      });
      
      console.log(`📞 Incoming call notification sent to user_${userToCall}`);
    } catch (error) {
      console.error('Error creating call record:', error);
      socket.emit('callError', { message: 'Failed to initiate call' });
    }
  });

  // User answers a call
  socket.on('answerCall', async (data) => {
    console.log(`📞 Call answered`);
    const { to, conversationId, callId } = data;
    
    try {
      // Update call status to active
      const call = await Call.findOne({
        $or: [
          { caller: to, receiver: socket.userId },
          { caller: socket.userId, receiver: to }
        ],
        status: { $in: ['initiated', 'ringing'] }
      }).sort({ createdAt: -1 });

      if (call) {
        call.status = 'active';
        call.startTime = new Date();
        await call.save();

        // Update active calls map
        activeCalls.set(call._id.toString(), {
          callId: call._id.toString(),
          caller: call.caller,
          receiver: call.receiver,
          callType: call.callType,
          conversationId: call.conversation,
          startTime: call.startTime,
        });
      }

      // Send the answer signal back to the caller
      io.to(`user_${to}`).emit('callAccepted', {
        signal: data.signal,
      });
      
      console.log(`📞 Call accepted notification sent to user_${to}`);
    } catch (error) {
      console.error('Error answering call:', error);
    }
  });

  // User ends a call
  socket.on('endCall', async (data) => {
    console.log(`📞 Call ended`);
    const { to, conversationId, duration, endedBy } = data;
    
    try {
      // Find and update the call record
      const call = await Call.findOne({
        $or: [
          { caller: endedBy, receiver: to },
          { caller: to, receiver: endedBy }
        ],
        status: 'active'
      }).sort({ createdAt: -1 });

      if (call) {
        call.status = 'ended';
        call.endTime = new Date();
        call.endedBy = endedBy;
        call.endReason = 'completed';
        call.calculateDuration();
        await call.save();

        // Remove from active calls
        activeCalls.delete(call._id.toString());

        // Create system message for call history
        if (conversationId) {
          const callDurationMinutes = Math.floor((call.duration || 0) / 60);
          const callDurationSeconds = (call.duration || 0) % 60;
          const durationText = callDurationMinutes > 0 
            ? `${callDurationMinutes}m ${callDurationSeconds}s`
            : `${callDurationSeconds}s`;

          const systemMessage = await Message.create({
            sender: endedBy,
            receiver: to,
            content: `${call.callType === 'audio' ? 'Voice' : 'Video'} call ended - ${durationText}`,
            messageType: 'system',
            conversation: conversationId,
            status: 'delivered',
          });

          // Update conversation's last message
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: systemMessage._id,
            updatedAt: new Date(),
          });

          // Emit the system message to both users
          const populatedMessage = await Message.findById(systemMessage._id)
            .populate('sender', 'username profilePicture')
            .populate('receiver', 'username profilePicture');

          io.to(conversationId).emit('newMessage', populatedMessage);
        }
      }

      // Notify the other user that the call has ended
      io.to(`user_${to}`).emit('callEnded', { duration: call?.duration || 0 });
      
      console.log(`📞 Call ended notification sent to user_${to}`);
    } catch (error) {
      console.error('Error ending call:', error);
      // Still notify the other user even if database update fails
      io.to(`user_${to}`).emit('callEnded');
    }
  });

  // User rejects a call
  socket.on('rejectCall', async (data) => {
    console.log(`📞 Call rejected`);
    const { to, conversationId } = data;
    
    try {
      // Find and update the call record
      const call = await Call.findOne({
        caller: to,
        receiver: socket.userId,
        status: { $in: ['initiated', 'ringing'] }
      }).sort({ createdAt: -1 });

      if (call) {
        call.status = 'rejected';
        call.endTime = new Date();
        call.endedBy = socket.userId;
        call.endReason = 'rejected';
        await call.save();

        // Remove from active calls if exists
        activeCalls.delete(call._id.toString());

        // Create system message for missed call
        if (conversationId) {
          const systemMessage = await Message.create({
            sender: to,
            receiver: socket.userId,
            content: `${call.callType === 'audio' ? 'Voice' : 'Video'} call declined`,
            messageType: 'system',
            conversation: conversationId,
            status: 'delivered',
          });

          // Update conversation's last message
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: systemMessage._id,
            updatedAt: new Date(),
          });

          // Emit the system message to both users
          const populatedMessage = await Message.findById(systemMessage._id)
            .populate('sender', 'username profilePicture')
            .populate('receiver', 'username profilePicture');

          io.to(conversationId).emit('newMessage', populatedMessage);
        }
      }

      // Notify the caller that the call was rejected
      io.to(`user_${to}`).emit('callRejected');
      
      console.log(`📞 Call rejected notification sent to user_${to}`);
    } catch (error) {
      console.error('Error rejecting call:', error);
      io.to(`user_${to}`).emit('callRejected');
    }
  });

  // Handle ICE candidates for WebRTC connection
  socket.on('iceCandidate', (data) => {
    // Forward ICE candidate to the other peer
    io.to(`user_${data.to}`).emit('iceCandidate', {
      candidate: data.candidate,
    });
  });

  // Handle call timeout (no answer)
  socket.on('callTimeout', async (data) => {
    console.log(`📞 Call timeout - no answer`);
    const { to, conversationId } = data;
    
    try {
      // Find and update the call record
      const call = await Call.findOne({
        caller: socket.userId,
        receiver: to,
        status: { $in: ['initiated', 'ringing'] }
      }).sort({ createdAt: -1 });

      if (call) {
        call.status = 'missed';
        call.endTime = new Date();
        call.endReason = 'missed';
        await call.save();

        // Remove from active calls if exists
        activeCalls.delete(call._id.toString());

        // Create system message for missed call
        if (conversationId) {
          const systemMessage = await Message.create({
            sender: socket.userId,
            receiver: to,
            content: `Missed ${call.callType === 'audio' ? 'voice' : 'video'} call`,
            messageType: 'system',
            conversation: conversationId,
            status: 'delivered',
          });

          // Update conversation's last message
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: systemMessage._id,
            updatedAt: new Date(),
          });

          // Emit the system message to both users
          const populatedMessage = await Message.findById(systemMessage._id)
            .populate('sender', 'username profilePicture')
            .populate('receiver', 'username profilePicture');

          io.to(conversationId).emit('newMessage', populatedMessage);
        }
      }

      // Notify the receiver about the timeout
      io.to(`user_${to}`).emit('callTimeout');
      
      console.log(`📞 Call timeout notification sent to user_${to}`);
    } catch (error) {
      console.error('Error handling call timeout:', error);
    }
  });

  // Handle call disconnection
  socket.on('disconnect', async () => {
    console.log(`📞 User disconnected: ${socket.id}`);
    
    // End any active calls for this user
    for (const [callId, callData] of activeCalls.entries()) {
      if (callData.caller === socket.userId || callData.receiver === socket.userId) {
        try {
          const call = await Call.findById(callId);
          if (call && call.status === 'active') {
            call.status = 'ended';
            call.endTime = new Date();
            call.endReason = 'failed';
            call.calculateDuration();
            await call.save();

            // Notify the other user
            const otherUserId = callData.caller === socket.userId ? callData.receiver : callData.caller;
            io.to(`user_${otherUserId}`).emit('callEnded', { reason: 'User disconnected' });
            
            console.log(`📞 Call ended (disconnect) notification sent to user_${otherUserId}`);
          }
          activeCalls.delete(callId);
        } catch (error) {
          console.error('Error ending call on disconnect:', error);
        }
      }
    }
    
    // Notify any active calls that the user disconnected
    socket.broadcast.emit('userDisconnected', {
      userId: socket.id,
    });
  });
};

export { activeCalls };
