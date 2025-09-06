import React, { useState, useEffect } from "react";
import ChatList from "./ChatList";
import ChatBox from "./ChatBox";
import SearchModal from "./SearchModal";
import { messageSample } from "../../data/messageSample";
import type { MessageType } from "../../data/messageSample";

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time?: string;
  image?: string;
}

const Message: React.FC = () => {
  const [activeChat, setActiveChat] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>(messageSample);
  const [chatSummaries, setChatSummaries] = useState<Chat[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Update chat summaries dynamically
  const updateChatSummaries = (msgs: MessageType[]) => {
    const summaries: { [key: string]: Chat } = {};
    msgs.forEach((msg) => {
      if (
        !summaries[msg.chatUser] ||
        new Date(msg.createdAt) > new Date(summaries[msg.chatUser].time || "")
      ) {
        summaries[msg.chatUser] = {
          id: msg.chatUser,
          name: msg.chatUser,
          lastMessage: msg.content,
          time: msg.createdAt,
          image: `https://i.pravatar.cc/40?u=${msg.chatUser.replace(/\s/g, "")}`,
        };
      }
    });
    setChatSummaries(
      Object.values(summaries).sort(
        (a, b) => new Date(b.time!).getTime() - new Date(a.time!).getTime()
      )
    );
  };

  useEffect(() => {
    updateChatSummaries(messages);
  }, [messages]);

  const handleStartChat = (user: { id: number | string; full_name: string; username: string; image?: string }) => {
    if (!chatSummaries.find((c) => c.id === user.full_name)) {
      const newChat: Chat = {
        id: user.full_name,
        name: user.full_name,
        lastMessage: "",
        image: user.image || `https://i.pravatar.cc/40?u=${user.username}`,
      };
      setChatSummaries((prev) => [newChat, ...prev]);
    }
    setActiveChat(user.full_name);
    setIsSearchOpen(false);
  };

  const handleSendMessage = (msg: Omit<MessageType, "_id">) => {
    const newMessage: MessageType = { ...msg, _id: "m" + (messages.length + 1) };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex flex-col h-screen relative bg-gray-100">
      <div className="flex-1 flex flex-col ml-[-110px] mt-[80px]">
        <div className="flex h-full">
          {/* ChatList */}
          <ChatList
            chats={chatSummaries}
            activeChatId={activeChat}
            onSelectChat={setActiveChat}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          {/* ChatBox */}
          <ChatBox
            activeChat={activeChat}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {isSearchOpen && <SearchModal startChat={handleStartChat} onClose={() => setIsSearchOpen(false)} />}
    </div>
  );
};

export default Message;
