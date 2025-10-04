import { useState, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import defaultAvatar from "../../../public/images/default.jpg";
import { messageSample } from "../../data/messageSample";

interface User {
  id: string;
  full_name: string;
  username: string;
  image?: string;
}

interface SearchModalProps {
  startChat: (user: User) => void;
  startGroupChat?: (users: User[], groupName: string) => void;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ startChat, startGroupChat, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");

  // Extract unique users from messageSample based on conversation participants
  useEffect(() => {
    const usersMap: { [key: string]: User } = {};
    messageSample.forEach((msg) => {
      if (!usersMap[msg.sender._id]) {
        usersMap[msg.sender._id] = {
          id: msg.sender._id,
          full_name: msg.conversation, // Use conversation as a placeholder name
          username: msg.conversation.replace(/\s/g, "").toLowerCase(),
          image: `https://i.pravatar.cc/40?u=${msg.conversation.replace(/\s/g, "")}`,
        };
      }
    });
    setAllUsers(Object.values(usersMap));
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers([]);
      return;
    }

    const results = allUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  };

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setFilteredUsers(filteredUsers.filter((u) => u.id !== user.id));
      setSearchTerm("");
    }
  };

  const handleRemoveUser = (userId: string) => {
    const removedUser = selectedUsers.find((u) => u.id === userId);
    if (removedUser) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
      setFilteredUsers([...filteredUsers, removedUser]);
    }
  };

  const handleStartGroup = () => {
    if (groupName.trim() && selectedUsers.length > 1) {
      startGroupChat(selectedUsers, groupName);
      setSelectedUsers([]);
      setGroupName("");
      onClose();
    }
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
                style={{ backgroundColor: "#fff", color: "#111" }}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg outline-none w-full p-2.5"
                placeholder="Search users"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
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
                    onClick={() => handleSelectUser(user)}
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

            {/* Selected Users and Group Name */}
            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-white text-sm font-medium mb-2">Selected Users</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center bg-white/20 p-1 rounded-lg"
                    >
                      <span className="text-white text-sm mr-2">{user.full_name}</span>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-white hover:text-red-500"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full mt-2 p-2 rounded-lg bg-white text-black"
                />
                <button
                  onClick={handleStartGroup}
                  className="mt-2 w-full bg-[#358BEC] text-white p-2 rounded-lg"
                  disabled={!groupName.trim() || selectedUsers.length < 2}
                >
                  Create Group Chat
                </button>
              </div>
            )}

            {/* Start Chat Button */}
            {selectedUsers.length === 1 && (
              <button
                onClick={() => {
                  startChat(selectedUsers[0]);
                  setSelectedUsers([]);
                  onClose();
                }}
                className="mt-4 w-full bg-[#358BEC] text-white p-2 rounded-lg"
              >
                Start Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;