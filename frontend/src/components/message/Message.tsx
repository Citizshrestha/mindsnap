import React, { useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import Header from "../header/Header";
import ChatList from "./ChatList";
import ChatBox from "./ChatBox";
import { messageSample } from "../../data/messageSample"; 
const Message: React.FC = () => {
  const [activeChat, setActiveChat] = useState<string>("");

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col ml-[65px] mt-[80px]">
          <div className="flex h-full">
            {/* Chat List */}
            <ChatList
              chats={messageSample}
              activeChat={activeChat}
              onSelectChat={setActiveChat}
            />

            {/* Chat Box */}
            <ChatBox activeChat={activeChat} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;