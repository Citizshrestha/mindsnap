import React, { useState, useEffect, useRef, useMemo } from "react";
import { FiPhoneCall, FiVideo } from "react-icons/fi";
import { RiSendPlaneFill, RiImageAddLine } from "react-icons/ri";
import {BsThreeDots}  from "react-icons/bs"
import backgroundChatImage from "../../../public/images/background.png";

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
  isPending?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ activeChat }) => {
  const [messageText, setMessageText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock user ID
  const userId = "user1";

  // Mock messages data wrapped in useMemo
  const mockMessages: MessageType[] = useMemo(() => {
    return activeChat
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
            content: "Here's a photo",
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
  }, [activeChat]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mockMessages]);

  // Determine if the current user is the sender
  const isMe = (msg: MessageType) => msg.sender._id === userId;

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSend = () => {
    if (messageText.trim()) {
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    console.log("Uploading image:", file.name);
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    if (!newText.trim()) {
      setError("Cannot edit message: text is empty");
      return;
    }

    console.log("Editing message:", messageId, "New text:", newText);
    setEditingMessageId(null);
    setEditedText("");
    setError(null);
  };

  const startEditing = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditedText(currentText);
  };

  const handleDeleteMessage = (messageId: string) => {
    console.log("Deleting message:", messageId);
  };

  if (!activeChat) {
    return (
      <main className="flex-1 w-[1070px] rounded-tl-3xl flex flex-col h-full mb-10 justify-center items-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">No Chat Selected</h2>
          <p className="text-gray-500">Select a chat from the sidebar to start messaging</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex-1 w-[1070px] rounded-tl-3xl flex flex-col h-full"
      style={{ backgroundImage: `url(${backgroundChatImage})`, backgroundSize: "cover" }}
    >
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
        <div className="flex justify-between items-center gap-3 text-white">
          <button className="h-10 w-10 bg-[#611DD0] pl-2 rounded-full duration-200">
            <FiPhoneCall size={20} />
          </button>
          <button className="h-10 w-10 bg-[#611DD0] pl-2 rounded-full duration-200">
            <FiVideo size={20} />
          </button>
          <button className="text-2xl pl-2 font-bold h-10 w-10 bg-[#611DD0] rounded-full duration-200">
            <BsThreeDots size={24}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-100"
      >
        {mockMessages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${isMe(msg) ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative rounded-2xl p-3 max-w-xs group ${
                isMe(msg)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-800"
              } shadow-sm ${msg.isPending ? "opacity-70" : ""}`}
            >
              {editingMessageId === msg._id ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="p-2 border rounded text-gray-800"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMessage(msg._id, editedText)}
                      className="px-2 py-1 text-white bg-green-500 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMessageId(null)}
                      className="px-2 py-1 text-white bg-gray-500 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                    {formatTimestamp(msg.createdAt)} - {msg.status}
                    {msg.isPending && " (Sending...)"}
                  </div>

                  {isMe(msg) && !msg.isPending && (
                    <div className="absolute top-0 right-0 flex-col hidden gap-1 p-1 group-hover:flex">
                      {msg.messageType === "text" && (
                        <button
                          onClick={() => startEditing(msg._id, msg.content)}
                          className="px-2 py-1 text-xs text-white bg-blue-500 rounded"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="px-2 py-1 text-xs text-white bg-red-500 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mx-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="mx-4 p-2 bg-blue-100 text-blue-700 rounded">
          Uploading: {Math.round(uploadProgress)}% complete
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
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
          placeholder="Type your message..."
          style={{ background: "white" }}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
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