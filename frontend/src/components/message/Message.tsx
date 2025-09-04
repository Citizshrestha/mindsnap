import React, { useState } from "react";
import ChatList from "./ChatList";
import ChatBox from "./ChatBox";
import { messageSample } from "../../data/messageSample"; 

const Message: React.FC = () => {
  const [activeChat, setActiveChat] = useState<string>("");

  return (
    <div className="flex flex-col h-screen relative bg-gray-100">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col ml-[-110px] mt-[80px]">
        <div className="flex h-full">
          {/* ChatList */}
          <ChatList
            chats={messageSample}
            activeChatId={activeChat}   
            onSelectChat={setActiveChat}
          />

          {/* Chat Box */}
          <ChatBox activeChat={activeChat} />
        </div>
      </div>
    </div>
  );
};

export default Message;
