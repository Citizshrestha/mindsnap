import { useState } from "react";

interface SuggestedUser {
  id: number;
  username: string;
  fullname: string;
  profilePicture: string;
}

const suggestedUsers: SuggestedUser[] = [
  {
    id: 1,
    username: "john_doe",
    fullname: "John Doe",
    profilePicture: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    username: "emma_watson",
    fullname: "Emma Watson",
    profilePicture: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 3,
    username: "mike_tyson",
    fullname: "Mike Tyson",
    profilePicture: "https://randomuser.me/api/portraits/men/77.jpg",
  },
];

export default function Connections() {
  const [following, setFollowing] = useState<number[]>([]);

  const handleFollow = (id: number) => {
    if (following.includes(id)) {
      setFollowing(following.filter((f) => f !== id));
    } else {
      setFollowing([...following, id]);
    }
  };

  return (
    <div className="min-h-screen w-[1350px] bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🔗 Suggested Connections
        </h1>

        <div className="space-y-4">
          {suggestedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between bg-gray-50 p-4 rounded-xl shadow-sm hover:shadow-md transition"
            >
              {/* Profile Info */}
              <div className="flex items-center gap-4">
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-12 h-12 rounded-full border-2 border-indigo-400"
                />
                <div>
                  <h2 className="font-semibold text-gray-700">{user.fullname}</h2>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleFollow(user.id)}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  following.includes(user.id)
                    ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    : "bg-indigo-500 text-white hover:bg-indigo-600"
                }`}
              >
                {following.includes(user.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
