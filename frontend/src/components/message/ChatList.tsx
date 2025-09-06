import React, { useState, useEffect, useRef } from "react";
import { RiMore2Fill } from "react-icons/ri";
import { useSelector } from "react-redux";
import defaultAvatar from "../../../public/images/default.jpg";
import SearchModal from "./SearchModal";
import type { Chat } from "./Message";
import type { RootState } from "../../redux/store";

interface ChatListProps {
  chats: Chat[];
  activeChatId?: string;
  onSelectChat: (chatId: string) => void;
  onOpenSearch: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, activeChatId, onSelectChat, onOpenSearch }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { profilePicture, username, fullname } = useSelector((state: RootState) => state.user);

  const startChat = (user: { id: number; full_name: string; username: string; image?: string }) => {
    console.log("Starting chat with:", user);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chats]);

  return (
    <section className="relative hidden lg:flex flex-col bg-[#611DD0] text-white h-screen w-full md:w-[350px] border-r border-purple-300/30 rounded-l-2xl">
      <header className="flex items-center justify-between w-full p-4 sticky top-0 z-10 border-b border-purple-200/30">
        <main className="flex items-center gap-3">
          <img
            src={profilePicture || defaultAvatar}
            alt={`${fullname || username} profile`}
            className="w-11 h-11 rounded-full object-cover cursor-pointer"
          />
          <span>
            <h3 className="p-0 font-semibold md:text-[16px]">{fullname || username || "Current User"}</h3>
            <p className="p-0 font-light text-[14px]">{username ? `@${username}` : "@username"}</p>
          </span>
        </main>
        <button
          className="bg-white/80 w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
          aria-label="More options"
        >
          <RiMore2Fill color="#611DD0" className="w-6 h-6" />
        </button>
      </header>

         <div className="w-full mt-3 px-4">
        <header className="flex items-center justify-between">
          <h3 className="text-[16px] font-medium">Messages ({chats.length})</h3>
          <button
            onClick={onOpenSearch}
            className="px-3 py-1 text-sm bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            Search
          </button>
        </header>
      </div>

      <main ref={scrollRef} className="flex-1 overflow-y-auto h-[calc(100vh-80px)] mt-2 scrollbar-hide">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p>No chats yet</p>
            <p className="mt-2 text-sm text-white/80">Start a new chat using the search button</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center justify-between w-full px-5 py-3 cursor-pointer border-b border-purple-200/20 transition ${
                chat.id === activeChatId ? "bg-purple-500/60" : "hover:bg-purple-500/40"
              }`}
              onClick={() => onSelectChat(chat.id)}
              style={{ minHeight: "60px" }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={chat.image || defaultAvatar}
                  alt={chat.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-[15px] truncate">{chat.name}</h2>
                  <p className="text-sm opacity-90 truncate">{chat.lastMessage}</p>
                </div>
              </div>
              {chat.time && (
                <p className="text-xs opacity-80 ml-2 whitespace-nowrap">
                  {new Date(chat.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          ))
        )}
      </main>

      {isSearchOpen && <SearchModal startChat={startChat} onClose={() => setIsSearchOpen(false)} />}
    </section>
  );
};

export default ChatList;
