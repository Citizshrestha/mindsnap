import React, { useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import ChatList from "./ChatList";
import ChatBox from "./Chatbox";

const Message: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  return (
    <div className="message-container   bg-gray-100 flex">
      {/* Sidebar for Navigation */}
      <Sidebar   />

      {/* Main Messaging Area */}
      <div className="message-content absolute top-20 mr-20 left-20  flex-1 flex flex-col md:flex-row ml-0 md:ml-[270px]">
        {/* Chat List Sidebar */}
        <div className="w-full md:w-[300px]">
          <ChatList selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
        </div>

        {/* Chat Box */}
        <div className="flex-1 ">
          <ChatBox selectedChatId={selectedChatId} />
        </div>
      </div>
    </div>
  );
};
export default Message;