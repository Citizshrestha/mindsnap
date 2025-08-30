import React, { useEffect } from "react";
import { io } from "socket.io-client";

type Chat = {
  name: string;
  lastMessage: string;
  time?: string;
  unread?: boolean;
};

interface ChatListProps {
  chats: Chat[];
  activeChat: string;
  onSelectChat: (name: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, activeChat, onSelectChat }) => {
  const socket = io("http://localhost:5000", {
    withCredentials: true,
    extraHeaders: {
      "Access-Control-Allow-Origin": "http://localhost:5173",
    },
  });

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <aside className="w-80 bg-[#611DD0] text-white p-4 rounded-l-2xl shadow-md flex flex-col">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search people..."
          className="w-full p-3 rounded-full bg-purple-500 placeholder-white focus:outline-none"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {chats.map((chat, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg cursor-pointer ${
              chat.name === activeChat ? "bg-purple-500" : "hover:bg-purple-500/70"
            } flex justify-between items-center`}
            onClick={() => {
              onSelectChat(chat.name);
              socket.emit("joinConversation", "default_conversation_id"); // TODO: replace with real ID
            }}
          >
            <div>
              <div className="font-bold">{chat.name}</div>
              <div className="text-sm opacity-80">{chat.lastMessage}</div>
            </div>
            {chat.time && <div className="text-xs">{chat.time}</div>}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ChatList;
