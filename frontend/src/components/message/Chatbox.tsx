import React, { useState } from "react";

interface ChatBoxProps {
  activeChat: string;
}

interface MessageType {
  _id: string;
  content: string;
  messageType: "text" | "image" | "video" | "audio" | "file";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  status: string;
  sender: { _id: string };
}

const ChatBox: React.FC<ChatBoxProps> = ({ activeChat }) => {
  const [messageText, setMessageText] = useState("");

  // Mock messages for the active chat
  const mockMessages: MessageType[] = activeChat
    ? [
        {
          _id: "1",
          content: "Hi there!",
          messageType: "text",
          createdAt: "2025-09-03T09:00:00Z",
          status: "sent",
          sender: { _id: "user1" },
        },
        {
          _id: "2",
          content: "Hello! How can I help you?",
          messageType: "text",
          createdAt: "2025-09-03T09:01:00Z",
          status: "sent",
          sender: { _id: "user2" },
        },
        {
          _id: "3",
          content: "Here’s a photo",
          messageType: "image",
          mediaUrl: "https://i.pravatar.cc/150?img=1",
          createdAt: "2025-09-03T09:02:00Z",
          status: "sent",
          sender: { _id: "user1" },
        },
        {
          _id: "4",
          content: "Check this video",
          messageType: "video",
          mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          createdAt: "2025-09-03T09:03:00Z",
          status: "sent",
          sender: { _id: "user2" },
        },
      ]
    : [];

  // Determine if the current user is the sender
  const userId = "user1"; // Mock user ID
  const isMe = (msg: MessageType) => msg.sender._id === userId;

  const handleSend = () => {
    if (messageText.trim()) {
      console.log("Sending message:", messageText);
      setMessageText("");
      // Add mock message to UI (simulated)
      const newMessage: MessageType = {
        _id: Date.now().toString(),
        content: messageText,
        messageType: "text",
        createdAt: new Date().toISOString(),
        status: "sent",
        sender: { _id: userId },
      };
      // In a real app, this would update state or call an API
      console.log("New message added:", newMessage);
    }
  };

  return (
    <main className="flex-1 bg-white rounded-tl-3xl flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <img
            src={
              activeChat
                ? `https://i.pravatar.cc/40?u=${activeChat}`
                : "https://i.pravatar.cc/40"
            }
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <h2 className="font-bold text-xl text-gray-800">
            {activeChat || "No Chat Selected"}
          </h2>
        </div>
        <div className="flex space-x-4 text-purple-600">
          <button className="hover:text-purple-800 transition duration-200">
            📞
          </button>
          <button className="hover:text-purple-800 transition duration-200">
            🎥
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-100">
        {mockMessages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${isMe(msg) ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-2xl p-3 max-w-xs ${
                isMe(msg)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-800"
              } shadow-sm`}
            >
              {msg.messageType === "text" && <p>{msg.content}</p>}
              {msg.messageType === "image" && msg.mediaUrl && (
                <img
                  src={msg.mediaUrl}
                  alt={msg.fileName || "Image"}
                  className="max-w-full h-auto rounded-lg"
                />
              )}
              {msg.messageType === "video" && msg.mediaUrl && (
                <video
                  controls
                  className="max-w-full h-auto rounded-lg"
                >
                  <source src={msg.mediaUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              <div className="text-xs opacity-70 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()} - {msg.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 flex items-center">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-100 p-3 border border-gray-300 text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
        />
        <button
          onClick={handleSend}
          className="bg-purple-600 text-white px-6 py-3 ml-4 rounded-full hover:bg-purple-700 transition duration-200 disabled:opacity-50"
          disabled={!messageText.trim()}
        >
          Send
        </button>
      </div>
    </main>
  );
};

export default ChatBox;