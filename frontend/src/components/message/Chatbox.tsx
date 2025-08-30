// src/ChatBox.tsx
import React, { useState } from 'react';
import { useGetMessagesQuery, useSendMessageMutation } from '../../services/messageApi'; 
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store'; 
import type { Message as MessageType } from '../../services/messageApi'; 

interface ChatBoxProps {
  activeChat: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ activeChat }) => {
  const { currentConversationId } = useSelector((state: RootState) => state.message);
  const { data: messages, error, isLoading } = useGetMessagesQuery(currentConversationId || '', { 
    skip: !currentConversationId 
  });
  const [sendMessage] = useSendMessageMutation();
  const [messageText, setMessageText] = useState('');

  // Determine if the current user is the sender
  const userId = 'your_user_id_here'; // Replace with actual user ID from auth
  const isMe = (msg: MessageType) => msg.sender._id === userId;

  const handleSend = async () => {
    if (messageText && currentConversationId) {
      try {
        await sendMessage({
          conversationId: currentConversationId,
          receiverId: 'another_user_id_here',
          content: messageText,
          type: 'text',
        }).unwrap();
        setMessageText('');
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  if (isLoading) return <div>Loading messages...</div>;
  if (error) {
    // Handle error safely with proper typing
    let errorMessage = 'Failed to load messages. Please try again.';
    
    if (typeof error === 'object' && error !== null) {
      if ('data' in error && typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
        errorMessage = (error.data as { message: string }).message;
      } else if ('error' in error) {
        errorMessage = String(error.error);
      } else if ('status' in error) {
        errorMessage = `Error status: ${error.status}`;
      }
    }
    
    return <div className="p-4 text-red-500">Error loading messages: {errorMessage}</div>;
  }

  return (
    <main className="flex-1  bg-white rounded-tl-3xl flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <img
            src={activeChat ? `https://i.pravatar.cc/40?u=${activeChat}` : 'https://i.pravatar.cc/40'}
            alt="Avatar"
            className="w-10 h-10 rounded-full"
          />
          <h2 className="font-bold text-xl">{activeChat || 'No Chat Selected'}</h2>
        </div>
        <div className="flex space-x-4 text-purple-600">
          <button className="hover:text-purple-800">📞</button>
          <button className="hover:text-purple-800">🎥</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages?.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-2xl p-3 max-w-xs ${
                isMe(msg) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-black'
              }`}
            >
              {msg.messageType === 'text' && <p>{msg.content}</p>}
              {msg.messageType === 'image' && msg.mediaUrl && (
                <img src={msg.mediaUrl} alt={msg.fileName || 'Image'} className="max-w-full h-auto rounded-lg" />
              )}
              {msg.messageType === 'video' && msg.mediaUrl && (
                <video controls className="max-w-full h-auto rounded-lg">
                  <source src={msg.mediaUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              {msg.messageType === 'audio' && msg.mediaUrl && (
                <audio controls className="w-full">
                  <source src={msg.mediaUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
              {msg.messageType === 'file' && msg.mediaUrl && (
                <a href={msg.mediaUrl} download={msg.fileName} className="text-blue-500 underline">
                  {msg.fileName} ({msg.fileSize ? `${(msg.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'})
                </a>
              )}
              <div className="text-xs opacity-70 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()} - {msg.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-black p-3 border text-white rounded-full focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-purple-600 text-white px-6 py-3 ml-4 rounded-full hover:bg-purple-700"
        >
          Send
        </button>
      </div>
    </main>
  );
};

export default ChatBox;