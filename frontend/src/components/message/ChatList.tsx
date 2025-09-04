import React, { useState } from "react";
import { RiMore2Fill } from "react-icons/ri";
import defaultAvatar from "../../../public/images/default.jpg";
import SearchModal from "./SearchModal";

type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  time?: string;
  image?: string;
};

interface ChatListProps {
  chats: Chat[];
  activeChatId?: string;
  onSelectChat: (chatId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, activeChatId, onSelectChat }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const startChat = (user: { id: number; full_name: string; username: string; image?: string }) => {
    console.log("Starting chat with:", user);
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true); // Open the search modal
  };

  return (
    <section className="relative hidden lg:flex flex-col bg-[#611DD0] text-white h-screen w-full md:w-[350px] border-r border-purple-300/30 rounded-l-2xl">
      {/* Header with profile + more button */}
      <header className="flex items-center justify-between w-full p-4 sticky top-0 z-10 border-b border-purple-200/30">
        <main className="flex items-center gap-3">
          <img
            src={defaultAvatar}
            alt="User profile"
            className="w-11 h-11 rounded-full object-cover cursor-pointer"
          />
          <span>
            <h3 className="p-0 font-semibold md:text-[16px]">Current User</h3>
            <p className="p-0 font-light text-[14px]">@username</p>
          </span>
        </main>
        <button
          className="bg-white/80 w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
          aria-label="More options"
        >
          <RiMore2Fill color="#611DD0" className="w-6 h-6" />
        </button>
      </header>

      {/* Search + heading */}
      <div className="w-full mt-3 px-4">
        <header className="flex items-center justify-between">
          <h3 className="text-[16px] font-medium">Messages ({chats.length})</h3>
          <button
            onClick={handleSearchClick}
            className="px-3 py-1 text-sm bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            Search
          </button>
        </header>
      </div>

      {/* Chat list */}
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent mt-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p>No chats yet</p>
            <p className="mt-2 text-sm text-white/80">
              Start a new chat using the search button
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center justify-between w-full px-5 py-3 cursor-pointer border-b border-purple-200/20 transition ${
                chat.id === activeChatId ? "bg-purple-500/60" : "hover:bg-purple-500/40"
              }`}
              onClick={() => onSelectChat(chat.id)}
              style={{ minHeight: "60px" }} // Consistent height for alignment
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
                <p className="text-xs opacity-80 ml-2 whitespace-nowrap">{chat.time}</p>
              )}
            </div>
          ))
        )}
      </main>

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal
          startChat={startChat}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </section>
  );
};

export default ChatList;