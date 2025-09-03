import React from "react";

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
  return (
    <aside className="w-100 bg-[#611DD0] text-white p-4  rounded-l-2xl shadow-md flex flex-col h-full">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search people..."
          className="w-full p-3 rounded-full text-white focus:outline-none focus:ring-2 -400 transition duration-200"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-800">
        {chats.map((chat, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg cursor-pointer flex justify-between items-center transition duration-200 ${
              chat.name === activeChat
                ? "bg-purple-500"
                : "hover:bg-purple-500/70"
            }`}
            onClick={() => onSelectChat(chat.name)}
          >
            <div className="flex items-center justify-baseline">
              <div className="font-bold flex items-center">
                {chat.name}
                {chat.unread && (
                  <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
              <div className="text-sm opacity-80 ml-2 truncate w-48">
                {chat.lastMessage}
              </div>
            </div>
            {chat.time && <div className="text-xs opacity-70">{chat.time}</div>}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ChatList;