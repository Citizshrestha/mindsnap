// src/components/message/SearchModal.tsx (unchanged)
import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import defaultAvatar from "../../../public/images/default.jpg";

interface User {
  id: number;
  full_name: string;
  username: string;
  image?: string;
}

interface SearchModalProps {
  startChat: (user: User) => void;
  onClose: () => void;
}

const mockUsers: User[] = [
  { id: 1, full_name: "Alice Johnson", username: "alice", image: "" },
  { id: 2, full_name: "Bob Smith", username: "bob", image: "" },
  { id: 3, full_name: "Charlie Lee", username: "charlie", image: "" },
];

const SearchModal: React.FC<SearchModalProps> = ({ startChat, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers([]);
      return;
    }

    const results = mockUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center items-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-[#611DD0] w-full rounded-md shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300">
            <h3 className="text-xl font-semibold text-white">Search Chat</h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4">
            <div className="flex gap-2">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
                style={{backgroundColor: "#fff", color: "#111"}}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg outline-none w-full p-2.5"
                placeholder="Search users"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 text-white bg-[#358BEC] rounded-lg"
              >
                <FaSearch />
              </button>
            </div>

            {/* Results */}
            <div className="mt-6">
              {filteredUsers.length === 0 ? (
                <p className="text-white/70 text-sm">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 bg-[#15eabc34] p-3 mb-3 rounded-lg cursor-pointer hover:bg-[#15eabc55]"
                    onClick={() => {
                      startChat(user);
                      onClose();
                    }}
                  >
                    <img
                      src={user.image || defaultAvatar}
                      className="h-[40px] w-[40px] rounded-full"
                      alt={user.full_name}
                    />
                    <span>
                      <h2 className="font-semibold text-white text-[16px]">
                        {user.full_name}
                      </h2>
                      <p className="text-[13px] text-white/80">@{user.username}</p>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;