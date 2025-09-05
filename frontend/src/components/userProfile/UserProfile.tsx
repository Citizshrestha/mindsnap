// src/components/UserProfile.tsx
import { useState, useEffect } from "react";
import "./userProfile.css";
import axiosClient from "../../api/axiosClient";
import { useSelector, useDispatch } from "react-redux";
import { setUsername, setProfilePicture } from "../../redux/slices/userSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import { useNavigate, useParams } from "react-router-dom";
import defaultAvatar from "../../../public/images/coverImage.png";
import MoodMaker from "../MoodMaker/MoodMaker";

const UserProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profilePicture: currentProfilePicture, username: currentUsername } = useSelector(
    (state: RootState) => state.user
  );
  const { userId } = useParams<{ userId?: string }>();
  const [fullname, setFullname] = useState("");
  const [error, setError] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [vibe, setVibe] = useState("");
  const [vibeDescription, setVibeDescription] = useState("");
  const [postsCount, setPostsCount] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No token Available");
          return;
        }

        const endpoint = userId ? `/api/users/${userId}` : "/api/users/profile";
        const response = await axiosClient.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        setFullname(data.fullname || "");
        if (data.username) dispatch(setUsername(data.username));
        if (data.profilePicture) dispatch(setProfilePicture(data.profilePicture));
        setAboutMe(data.aboutMe || "");
        setVibe(data.vibe || "");
        setVibeDescription(data.vibeDescription || "");
        setPostsCount(data.postsCount || 0);
        setFollowers(data.followers || 0);
        setFollowing(data.following || 0);
        setIsFollowing(data.isFollowing || false);
      } catch (err) {
        setError(`Some error fetching the data ${err}`);
      }
    };
    fetchUserProfile();
  }, [userId, currentUsername, dispatch]);

  const handleEditProfile = () => {
    if (!userId) {
      navigate("/edit-userprofile");
    }
  };

  const handleFollow = async () => {
    if (userId) {
      try {
        const token = localStorage.getItem("accessToken");
        await axiosClient.post(
          `/api/users/${userId}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFollowing(true);
        setFollowers(followers + 1);
      } catch (err) {
        console.error("Follow error:", err);
      }
    }
  };

  const handleUnfollow = async () => {
    if (userId) {
      try {
        const token = localStorage.getItem("accessToken");
        await axiosClient.post(
          `/api/users/${userId}/unfollow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFollowing(false);
        setFollowers(followers - 1);
      } catch (err) {
        console.error("Unfollow error:", err);
      }
    }
  };

  const handleMessage = () => {
    if (userId) {
      navigate(`/messages/${userId}`);
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex mt-18 items-center text-left relative">
      <div className="ml-[95px] mt-10 w-[75%] p-5 bg-white rounded-2xl text-inherit font-poppins overflow-y-auto h-[calc(100vh-80px)] scrollbar-hide">
        <div className="flex items-center mb-10 relative">
          <div className="profileSection w-full">
            {/* Cover Image with gradient overlay */}
            <div className="relative h-[250px] w-full rounded-2xl overflow-hidden shadow-lg">
              <img
                src={defaultAvatar}
                className="h-full w-full object-cover"
                alt="cover"
              />
            </div>

            {/* Profile Image - overlaps cover */}
            <div className="absolute left-56 bottom-28 z-10">
              <div className="rounded-full ml-25 border-4 border-white shadow-xl bg-gradient-to-tr from-[#A084E8] to-[#611DD0] p-1">
                <img
                  src={currentProfilePicture || defaultAvatar}
                  alt="profilePic"
                  className="w-42 h-42 rounded-full object-cover bg-white"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) =>
                    (e.currentTarget.src = "../../../public/images/default.jpg")
                  }
                />
              </div>
            </div>

            {/* Profile Info and Edit/Follow/Message Buttons */}
            <div className="flex flex-col md:flex-row items-center justify-between mt-25 px-8">
              <div className="flex flex-col items-start">
                <h2 className="text-3xl font-bold text-[#611DD0] drop-shadow-sm">
                  {fullname}
                </h2>
                <h3 className="text-lg text-gray-500 font-medium mb-2">
                  @{currentUsername}
                </h3>
                {!userId && (
                  <button
                    onClick={handleEditProfile}
                    className="mt-2 bg-gradient-to-r from-[#611DD0] to-[#A084E8] text-white rounded-full px-6 py-2 font-semibold shadow hover:scale-105 transition"
                  >
                    Edit Profile
                  </button>
                )}
                {userId && currentUsername !== currentUsername && ( // Show follow/unfollow/message for other users
                  <>
                    <button
                      onClick={isFollowing ? handleUnfollow : handleFollow}
                      className={`mt-2 px-4 py-2 rounded-full font-semibold shadow ${
                        isFollowing
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                    <button
                      onClick={handleMessage}
                      className="mt-2 ml-2 bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-blue-600"
                    >
                      Message
                    </button>
                  </>
                )}
              </div>
              {/* Stats Card */}
              <div className="flex bg-white/70 backdrop-blur-md rounded-2xl shadow-lg px-10 py-6 gap-12 mt-6 md:mt-0">
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-[#611DD0]">{postsCount}</h2>
                  <p className="text-gray-600 font-medium">Posts</p>
                </div>
                <div className="w-px bg-gradient-to-b from-[#A084E8] to-[#611DD0] mx-4"></div>
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-[#611DD0]">{followers}</h2>
                  <p className="text-gray-600 font-medium">Followers</p>
                </div>
                <div className="w-px bg-gradient-to-b from-[#A084E8] to-[#611DD0] mx-4"></div>
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-[#611DD0]">{following}</h2>
                  <p className="text-gray-600 font-medium">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12 text-center">
          <h3 className="text-[21px] flex items-center justify-center gap-2 font-semibold mb-2 text-[#6B46C1] highlight-haven-title">
            Highlight Haven{" "}
            {
              <p className="text-sm pt-3 mt-1 mb-4 text-[#A0AEC0]">
                (Showcase Your Stories)
              </p>
            }
          </h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            <div className="stories relative w-[180px] h-[150px] overflow-hidden rounded-[20px] before:absolute before:inset-0 before:bg-white/10">
              <img
                src="https://images.unsplash.com/photo-1746950862509-959ed92c42b8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMHx8fGVufDB8fHx8fA%3D%3D"
                alt="Travel Scene"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-3xl font-cursive italic">
                Travel
              </div>
            </div>
            <div className="stories relative w-[180px] h-[150px] overflow-hidden rounded-[20px] before:absolute before:inset-0 before:bg-white/10">
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D"
                alt="Food"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-3xl font-cursive italic">
                Food
              </div>
            </div>
            <div className="stories relative w-[180px] h-[150px] overflow-hidden rounded-[20px] before:absolute before:inset-0 before:bg-white/10">
              <img
                src="https://images.unsplash.com/photo-1595675024853-0f3ec9098ac7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGNvZGluZ3xlbnwwfHwwfHx8MA%3D%3D"
                alt="Code"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-3xl font-cursive italic">
                Coding
              </div>
            </div>
            <div className="stories relative w-[180px] h-[150px] overflow-hidden rounded-[20px] before:absolute before:inset-0 before:bg-white/10">
              <img
                src="https://images.pexels.com/photos/27355586/pexels-photo-27355586/free-photo-of-daniel-1.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Myself"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-3xl font-cursive italic">
                Myself
              </div>
            </div>
            <div
              className="stories relative w-[180px] h-[150px] overflow-hidden rounded-[20px] before:absolute before:inset-0 before:bg-white/10 cursor-pointer"
              onClick={() => alert("Add new highlight!")}
            >
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-6xl text-[#611DD0]">+</span>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-[#611DD0] text-3xl font-cursive italic">
                Add
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 mb-6">
          <div className="flex-1">
            <h3 className="text-[1.1rem] font-semibold text-[#611DD0]">
              What Your Vibe Says About You
            </h3>
            <p className="text-gray-900">{vibeDescription}</p>
            <button className="mt-2 font-['Nunito'] bg-[#582BBB] text-white px-4 py-2 rounded-full">
              <i>
                <b>{vibe}</b>
              </i>
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-[1.1rem] text-[#1438A6] font-semibold">
              About Me (Bio)
            </h3>
            <p className="text-gray-900">{aboutMe}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <h3 className="text-xl text-black font-bold">{postsCount} Vibes ✨</h3>
            <h3 className="text-xl font-semibold">Highlighted</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1741732311586-6ea6d620f214?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMnx8fGVufDB8fHx8fA%3D%3D"
              alt="Vibe 3"
              className="w-full h-80 object-cover rounded-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1722971380810-a4f29b2efc36?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMnx8fGVufDB8fHx8fA%3D%3D"
              alt="Vibe 2"
              className="w-full h-80 object-cover rounded-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1746950862509-959ed92c42b8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMHx8fGVufDB8fHx8fA%3D%3D"
              alt="Vibe 1"
              className="w-full h-80 object-cover rounded-lg"
            />
            <img
              src="https://plus.unsplash.com/premium_photo-1746194532300-3417b645aeda?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNjR8fHxlbnwwfHx8fHw%3D"
              alt="Vibe 4"
              className="w-full h-80 object-cover rounded-lg"
            />
            <img
              src="https://plus.unsplash.com/premium_photo-1672363353911-debc1fc593cb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxODR8fHxlbnwwfHx8fHw%3D"
              alt="Vibe 5"
              className="w-full h-80 object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
      {!userId && (
        <div className="absolute left-250 top-10">
          <MoodMaker />
        </div>
      )}
    </div>
  );
};

export default UserProfile;