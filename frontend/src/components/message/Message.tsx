import React from "react";
import Sidebar from "../sidebar/Sidebar";
import ChatList from "./ChatList";
import ChatBox from "./ChatBox";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../redux/store";
import { setActiveChat } from "../../redux/slices/messageSlice";
import { useGetUsersForChatListQuery } from "../../services/messageApi";

const Message: React.FC = () => {
  const dispatch = useDispatch();
  const { activeChat } = useSelector((state: RootState) => state.message);

  // Fetch real users from API
  const { data: users, isLoading } = useGetUsersForChatListQuery();

  return (
    <div className="flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Messaging Area */}
      <div className="flex flex-1 h-[calc(100vh-80px)] ml-0 md:ml-[270px] mt-20 mr-5">
        {/* Chat List Sidebar */}
        <ChatList
          chats={
            isLoading
              ? []
              : users?.map((u) => ({
                  name: u.username,
                  lastMessage: "Click to chat", // replace with last msg from API later
                })) || []
          }
          activeChat={activeChat || ""}
          onSelectChat={(name) => dispatch(setActiveChat(name))}
        />

        {/* Chat Box */}
        <div className="flex-1  bg-white shadow-md rounded-r-2xl">
          <ChatBox activeChat={activeChat || ""} />
        </div>
      </div>
    </div>
  );
};

export default Message;
