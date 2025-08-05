import { useState, useRef, useEffect } from "react";
import "./chat.css";

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  isSent: boolean;
}

const ChatBox: React.FC<{ selectedChatId: number | null }> = ({ selectedChatId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate messages for the selected chat (replace with API call)
  useEffect(() => {
    if (selectedChatId) {
      setMessages([
        { id: 1, sender: "Alice", text: "Hi there!", timestamp: "2025-08-05 06:00", isSent: false },
        { id: 2, sender: "You", text: "Hello! How can I help?", timestamp: "2025-08-05 06:01", isSent: true },
        { id: 3, sender: "Alice", text: "Just checking in!", timestamp: "2025-08-05 06:02", isSent: false },
      ]);
    } else {
      setMessages([]);
    }
  }, [selectedChatId]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChatId) {
      const newMsg: Message = {
        id: Date.now(),
        sender: "You",
        text: newMessage,
        timestamp: new Date().toLocaleTimeString(),
        isSent: true,
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
      // Simulate sending to server (replace with API call)
    }
  };

  return (
    <div className="chat-box flex-1 bg-white rounded-2xl   shadow p-4  h-[calc(100vh-80px)] w-[880px]  flex flex-col">
      <h3 className="text-xl font-semibold text-[#611DD0] mb-4">
        {selectedChatId ? `Chat with ${["Alice", "Bob", "Charlie"][selectedChatId - 1]}` : "Select a Chat"}
      </h3>
      <div className="messages-container flex-1 overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message p-2 rounded-lg mb-2 max-w-[70%] ${msg.isSent ? "bg-[#A084E8] text-white self-end" : "bg-gray-200 text-black"}`}
          >
            <p className="text-sm">{msg.text}</p>
            <span className="text-xs text-gray-500">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 text-white rounded-l-full border border-gray-300 focus:outline-none"
          disabled={!selectedChatId}
        />
        <button
          onClick={handleSendMessage}
          className="bg-gradient-to-r from-[#611DD0] to-[#A084E8] text-white px-4 py-2 rounded-r-full hover:scale-105 transition"
          disabled={!selectedChatId}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;