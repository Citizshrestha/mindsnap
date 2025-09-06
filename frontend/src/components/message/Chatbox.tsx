import React, { useState, useEffect, useRef } from "react";
import { FiPhoneCall, FiVideo } from "react-icons/fi";
import { RiSendPlaneFill, RiImageAddLine } from "react-icons/ri";
import { BsThreeDots, BsPlayFill } from "react-icons/bs";
import backgroundChatImage from "../../../public/images/background.png";
import type { MessageType } from "../../data/messageSample";

interface ChatBoxProps {
  activeChat: string;
  messages: MessageType[];
  onSendMessage: (msg: Omit<MessageType, "_id">) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ activeChat, messages, onSendMessage }) => {
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = "user1";

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeChat, messages]);

  const isMe = (msg: MessageType) => msg.sender._id === userId;

  const formatTimestamp = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage({
      chatUser: activeChat,
      content: messageText,
      messageType: "text",
      createdAt: new Date().toISOString(),
      status: "sent",
      sender: { _id: userId },
    });
    setMessageText("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type: MessageType["messageType"] = file.type.startsWith("image")
      ? "image"
      : file.type.startsWith("video")
      ? "video"
      : "file";

    const mediaUrl = URL.createObjectURL(file);

    onSendMessage({
      chatUser: activeChat,
      content: file.name,
      messageType: type,
      mediaUrl,
      createdAt: new Date().toISOString(),
      status: "sent",
      sender: { _id: userId },
    });
  };

  if (!activeChat)
    return (
      <main className="flex-1 flex flex-col h-full ml-55 justify-center items-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">No Chat Selected</h2>
          <p className="text-gray-500">Select a chat from the ChatList to start messaging</p>
        </div>
      </main>
    );

  return (
    <main className="flex-1 bg-[#F5F6FA] flex flex-col h-full w-[1070px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <img
            src={`https://i.pravatar.cc/40?u=${activeChat}`}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <h2 className="font-bold text-xl text-gray-800">{activeChat}</h2>
        </div>
        <div className="flex items-center gap-3 text-white">
          <button className="h-10 w-10 bg-[#611DD0] rounded-full flex justify-center items-center">
            <FiPhoneCall size={20} />
          </button>
          <button className="h-10 w-10 bg-[#611DD0] rounded-full flex justify-center items-center">
            <FiVideo size={20} />
          </button>
          <button className="h-10 w-10 bg-[#611DD0] rounded-full flex justify-center items-center">
            <BsThreeDots size={24} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          backgroundImage: `url(${backgroundChatImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-100"
      >
        {messages
          .filter((msg) => msg.chatUser === activeChat)
          .map((msg) => (
            <div key={msg._id} className={`flex ${isMe(msg) ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-2xl p-3 max-w-xs ${
                  isMe(msg) ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.messageType === "text" && <p>{msg.content}</p>}
                {msg.messageType === "image" && msg.mediaUrl && (
                  <img src={msg.mediaUrl} alt="image" className="w-110 h-70 rounded-lg" />
                )}
                {msg.messageType === "video" && msg.mediaUrl && (
                  <video controls className="w-100 h-80 rounded-lg">
                    <source src={msg.mediaUrl} type="video/mp4" />
                  </video>
                )}
                {msg.messageType === "file" && msg.mediaUrl && (
                  <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {msg.content || "File"}
                  </a>
                )}
                {msg.messageType === "voice" && msg.mediaUrl && (
                  <div className="flex items-center gap-2 bg-gray-300 p-2 rounded-lg">
                    <button className="text-white bg-blue-500 rounded-full p-1">
                      <BsPlayFill size={16} />
                    </button>
                    <audio controls className="hidden">
                      <source src={msg.mediaUrl} type="audio/mpeg" />
                    </audio>
                    <span className="text-sm">0:15</span>
                  </div>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {formatTimestamp(msg.createdAt)} - {msg.status}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Input bar */}
      <div className="p-4 flex absolute w-[1110px] rounded-2xl bottom-0 items-center gap-3 border-t border-gray-200 bg-white">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center bg-gray-200 text-gray-700 rounded-full h-10 w-10 hover:bg-gray-300 transition"
        >
          <RiImageAddLine size={20} />
        </button>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            backgroundColor: "#fff"
          }}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 text-black border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleSend}
          className="flex items-center justify-center bg-purple-600 text-white rounded-full h-10 w-10 hover:bg-purple-700 transition disabled:opacity-50"
          disabled={!messageText.trim()}
        >
          <RiSendPlaneFill size={20} />
        </button>
      </div>
    </main>
  );
};

export default ChatBox;
