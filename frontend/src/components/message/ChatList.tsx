import { useState, useEffect } from "react";
import "./chat.css";

interface Chat {
  id: number;
  username: string;
  lastMessage: string;
  timestamp: string;
}
interface ChatListProps {
  selectedChatId: number | null;
  onSelectChat: (id: number) => void;
}


const ChatList: React.FC<ChatListProps> = () => {
  const [chats, setChats] = useState<Chat[]>([
    { id: 1, username: "Alice", lastMessage: "Hey, how’s it going?", timestamp: "2025-08-05 06:00" },
    { id: 2, username: "Bob", lastMessage: "See you tomorrow!", timestamp: "2025-08-05 05:30" },
    { id: 3, username: "Charlie", lastMessage: "Cool project!", timestamp: "2025-08-05 04:45" },
  ]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  // Simulate fetching chats (replace with API call in real app)
  useEffect(() => {
    // Mock API call
    const fetchChats = () => {
      // Replace with actual API logic
      setChats(chats); // Placeholder
    };
    fetchChats();
  }, []);

  return (
    <div className="chat-list  w-[350px] absolute right-224 bg-white rounded-2xl shadow p-4 h-[calc(100vh-80px)]  overflow-y-auto">
      <h3 className="text-xl font-semibold text-[#611DD0] mb-4">Chats</h3>
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`chat-item p-3 rounded-lg mb-2 cursor-pointer ${selectedChatId === chat.id ? "bg-purple-100" : "hover:bg-gray-100"} transition-all duration-200`}
          onClick={() => setSelectedChatId(chat.id)}
        >
          <h4 className="text-lg font-medium text-[#611DD0]">{chat.username}</h4>
          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
          <span className="text-xs text-gray-400">{chat.timestamp}</span>
        </div>
      ))}
    </div>
  );
};

export default ChatList;