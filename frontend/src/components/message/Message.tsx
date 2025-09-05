import React, { useState } from "react";
import ChatList from "./ChatList";
import ChatBox from "./ChatBox";
import { messageSample } from "../../data/messageSample";

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time?: string;
  image?: string;
}

const Message: React.FC = () => {
  const [activeChat, setActiveChat] = useState<string>("");

  // Generate chat summaries for ChatList
  const chatSummaries: Chat[] = Object.values(
    messageSample.reduce<{ [key: string]: Chat }>((acc, msg) => {
      if (!acc[msg.chatUser] || new Date(msg.createdAt) > new Date(acc[msg.chatUser].time || "")) {
        acc[msg.chatUser] = {
          id: msg.chatUser,
          name: msg.chatUser,
          lastMessage: msg.content,
          time: msg.createdAt,
          image: `https://i.pravatar.cc/40?u=${msg.chatUser.replace(/\s/g, "")}`,
        };
      }
      return acc;
    }, {})
  );

  return (
    <div className="flex flex-col h-screen relative bg-gray-100">
      <div className="flex-1 flex flex-col ml-[-110px] mt-[80px]">
        <div className="flex h-full">
          {/* ChatList */}
          <ChatList
            chats={chatSummaries}
            activeChatId={activeChat}   
            onSelectChat={setActiveChat}
          />

          {/* ChatBox */}
          <ChatBox
            activeChat={activeChat}
            messages={messageSample}
          />
        </div>
      </div>
    </div>
  );
};

export default Message;
