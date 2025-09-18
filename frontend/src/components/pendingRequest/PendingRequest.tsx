import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiUserPlus } from "react-icons/fi"; // Added icon for visual appeal

interface Follower {
  _id: string;
  username: string;
  fullname: string;
  profilePicture: string;
  vibe?: string;
  isFollowing: boolean;
}

const PendingRequest: React.FC = () => {
  const { _id: loggedInUserId, username: currentUsername } = useSelector(
    (state: RootState) => state.user
  );
  const [followers, setFollowers] = useState<Follower[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingFollowers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await axiosClient.get(
          `/api/users/${loggedInUserId}/pending-follow-requests?type=followers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setFollowers(response.data.followers || []);
        }
      } catch (err) {
        console.error("Error fetching pending followers:", err);
      }
    };

    fetchPendingFollowers();
  }, [loggedInUserId]);

  const handleFollowBack = async (followerId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosClient.post(
        `/api/users/${followerId}/follow-back`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setFollowers((prev) => prev.filter((f) => f._id !== followerId));
        toast.success("Followed back successfully!");
      }
    } catch (err) {
      console.error("Error following back:", err);
      toast.error("Failed to follow back. Please try again.");
    }
  };

  const handleProfileClick = (follower: Follower) => {
    if (follower._id === loggedInUserId || follower.username === currentUsername) {
      navigate("/profile");
    } else {
      navigate(`/profile/${follower._id}`);
    }
  };

  return (
    <div className="p-5 ml-35">
      <div className="relative mb-10">
        <h2 className="text-2xl pt-10 font-semibold text-[#611DD0] text-center mt-6">
          Pending Follow Requests
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {followers.length > 0 ? (
          followers.map((follower) => (
            <div
              key={follower._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="relative h-28 bg-gray-200">
                <img
                  src="/images/coverImage.png"
                  alt="cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                  <img
                    src={follower.profilePicture || "/default-avatar.png"}
                    alt={follower.username}
                    className="w-20 h-20 rounded-full border-4 border-white object-cover shadow"
                  />
                </div>
              </div>

              <div className="pt-12 pb-6 px-4 text-center">
                <h3 className="font-bold text-lg text-gray-800">{follower.fullname}</h3>
                <p className="text-sm text-blue-600">@{follower.username}</p>
                <p className="mt-2 text-gray-600 text-sm italic">
                  {follower.vibe || "✨ Living the vibe! 💫"}
                </p>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleProfileClick(follower)}
                    className="w-full bg-gray-100 cursor-pointer hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    👁 View Profile
                  </button>

                  {!follower.isFollowing && (
                    <button
                      onClick={() => handleFollowBack(follower._id)}
                      className="w-full bg-[#611DD0] cursor-pointer hover:bg-[#5000B9] text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      🤝 Follow Back
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col ml-60 mt-10 items-center justify-center h-64 w-full bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl shadow-lg p-6 text-center">
            <FiUserPlus className="text-[#611DD0] w-16 h-16 mb-4 animate-bounce" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Pending Follow Requests Yet!
            </h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Looks like no one has sent you a follow request. Start connecting by exploring new profiles or sharing your own vibe!
            </p>
            <button
              onClick={() => navigate("/connections")}
              className="mt-4 px-6 py-2 bg-[#611DD0] text-white cursor-pointer rounded-full hover:bg-[#5000B9] transition-colors duration-300"
            >
              Find Friends
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingRequest;
