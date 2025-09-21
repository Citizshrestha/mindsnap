import { useState, useEffect, useCallback } from "react";
import "./userProfile.css";
import axiosClient from "../../api/axiosClient";
import { useSelector, useDispatch } from "react-redux";
import { setProfilePicture } from "../../redux/slices/userSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import { useNavigate, useParams } from "react-router-dom";
import defaultAvatar from "../../../public/images/coverImage.png";
import MoodMaker from "../MoodMaker/MoodMaker";
import { toast } from "react-toastify";
import { IoCloseSharp } from "react-icons/io5";
import Loader from "../Loader";
import { setActiveChat, setConversationMap } from "../../redux/slices/messageSlice";
import { BiSolidLike } from "react-icons/bi";
import { FaRegCommentDots, FaShare } from "react-icons/fa";

interface UserProfileData {
  success: boolean;
  username: string;
  fullname: string;
  profilePicture: string;
  aboutMe: string;
  vibe: string;
  vibeDescription: string;
  postsCount: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
}

interface UserConnection {
  _id: string;
  username: string;
  fullname: string;
  profilePicture: string;
}

interface Like{
  _id: string;
  user: string;
  createdAt: string;
}
interface Comment{
    _id: string;
  user: {
    _id: string;
    username: string;
    profilePicture: string;
  },
  createdAt: string;
}
interface Post {
  _id: string;
  user: {
    _id: string;
    username: string;
    profilePicture: string;
    fullname: string;
  };
  content: string;
  image?: string;
  likes: Like[];
  comments: Comment[];
  shares: number;
  createdAt: string;
}

const UserProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profilePicture: currentProfilePicture, username: currentUsername } = useSelector(
    (state: RootState) => state.user
  );
  const conversations = useSelector((state: RootState) => state.message.conversations);

  const { userId } = useParams<{ userId?: string }>();
  const loggedInUserId = localStorage.getItem("userId");

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState(""); 
  const [error, setError] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [vibe, setVibe] = useState("");
  const [vibeDescription, setVibeDescription] = useState("");
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<UserConnection[]>([]);
  const [followingList, setFollowingList] = useState<UserConnection[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showModal, setShowModal] = useState<"followers" | "following" | "post" | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No token available");
        return;
      }

      const endpoint = userId ? `/api/users/${userId}` : "/api/users/profile";
      const response = await axiosClient.get<UserProfileData>(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setFullname(data.fullname || "");
      setUsername(data.username || "");
      if (data.profilePicture) dispatch(setProfilePicture(data.profilePicture));
      setAboutMe(data.aboutMe || "");
      setVibe(data.vibe || "");
      setVibeDescription(data.vibeDescription || "");
      setPostsCount(data.postsCount || 0);
      setFollowersCount(data.followers || 0);
      setFollowingCount(data.following || 0);
      setIsFollowing(data.isFollowing || false);
    } catch (err) {
      setError(`Error fetching data: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dispatch]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token available");

      const response = await axiosClient.get("/api/posts/getPosts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const fetchedPosts = response.data;
      
      if (userId) {
        const filteredPosts = fetchedPosts.filter((post: any) => 
          post.user?._id === userId
        );
        setPosts(filteredPosts);
      } else {
        setPosts(fetchedPosts);
      }
    } catch (err) {
      console.error("Fetch Posts error:", err);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchUserCreatedPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token available");

      const response = await axiosClient.get("/api/posts/getPosts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const allPosts = response.data;
      
      if (userId) {
        const filteredPosts = allPosts.filter((post: any) => 
          post.user?._id === userId
        );
        setUserPosts(filteredPosts);
      } else {
        const currentUserId = localStorage.getItem("userId");
        const myPosts = allPosts.filter((post: any) => 
          post.user?._id === currentUserId
        );
        setUserPosts(myPosts);
      }
    } catch (err) {
      console.error("Fetch User Posts error:", err);
      toast.error("Failed to load user posts");
      setUserPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchConnections = async (type: "followers" | "following") => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("No authentication token available");
        return;
      }

      const endpoint = userId
        ? `/api/users/${userId}/connections`
        : "/api/users/profile/connections";
      const response = await axiosClient.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type },
      });
      const data = response.data;
      if (data.success) {
        if (type === "followers") setFollowersList(data.followers || []);
        else setFollowingList(data.following || []);
      } else {
        toast.error(`Failed to fetch ${type}: ${data.message}`);
      }
    } catch (err: unknown) {
      console.error(`Error fetching ${type}:`, err);
      toast.error(`Failed to fetch ${type}: ${err || "Server error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: string, action: "removeFollower" | "unfollow" = "unfollow") => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosClient.post(
        `/api/users/${targetUserId}/unfollow`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setIsFollowing(false);
        await fetchUserProfile();
        if (showModal === "followers" && action === "removeFollower") {
          setFollowersList(prevList => prevList.filter(user => user._id !== targetUserId));
          await fetchConnections("followers");
        } else if (showModal === "following" && action === "unfollow") {
          await fetchConnections("following");
        }
        if (action === "removeFollower") {
          setShowRemoveConfirm(null);
        } else {
          setShowUnfollowConfirm(null);
        }
        toast.success(`${action === "removeFollower" ? "Removed" : "Unfollowed"} successfully`);
      } else {
        toast.error(response.data.message || `Failed to ${action === "removeFollower" ? "remove" : "unfollow"} user`);
      }
    } catch (err) {
      console.error("Unfollow error:", err);
      toast.error(`Failed to ${action === "removeFollower" ? "remove" : "unfollow"} user`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token available");

      const followResponse = await axiosClient.post(
        `/api/users/${targetUserId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (followResponse.data.success) {
        setIsFollowing(true);
        await fetchUserProfile();
        toast.success("Followed successfully");
      } else {
        throw new Error("Failed to follow user");
      }
    } catch (err) {
      console.error("Follow error:", err);
      toast.error(`Failed to follow user`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    if (!userId) {
      navigate("/edit-userprofile");
    }
  };

  const handleShowConnections = (type: "followers" | "following") => {
    fetchConnections(type);
    setShowModal(type);
  };

  const handleCloseModal = () => {
    setShowModal(null);
    setShowUnfollowConfirm(null);
    setShowRemoveConfirm(null);
    setSelectedPost(null);
  };

const handleMessage = async () => {
  if (!userId) return;
  setIsLoading(true);
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("No authentication token available");
      return;
    }

    // FIX: Changed participantIds to participantId (singular)
    const response = await axiosClient.post(
      "/api/conversations",
      { participantId: userId, isGroup: false }, // Changed here
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      const { data: conversation } = response.data; // Also fixed this destructuring
      dispatch(setConversationMap({
        ...conversations,
        [fullname]: conversation._id
      }));
      dispatch(setActiveChat(fullname));
      navigate(`/messages?conversationId=${conversation._id}`);
    } else {
      toast.error("Failed to start conversation");
    }
  } catch (err) {
    console.error("Error starting conversation:", err);
    
    // Better error handling
    if (err.response?.data?.message) {
      toast.error(err.response.data.message);
    } else {
      toast.error("Failed to start conversation");
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setShowModal("post");
  };

  const handleViewUserPosts = () => {
    fetchUserCreatedPosts();
    setShowModal("post");
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPosts();
  }, [fetchUserProfile, fetchPosts]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex mt-18 items-center text-left relative">
      <div className="ml-[95px] mt-10 w-[75%] p-5 bg-white rounded-2xl text-inherit font-poppins overflow-y-auto h-[calc(100vh-80px)] scrollbar-hide">
        <div className="flex items-center mb-10 relative">
          <div className="profileSection w-full">
            <div className="relative h-[250px] w-full rounded-2xl overflow-hidden shadow-lg">
              <img
                src={defaultAvatar}
                className="h-full w-full object-cover"
                alt="cover"
              />
            </div>
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
            <div className="flex flex-col md:flex-row items-center justify-between mt-25 px-8">
              <div className="flex flex-col items-start">
                <h2 className="text-3xl font-bold text-[#611DD0] drop-shadow-sm">
                  {fullname}
                </h2>
                <h3 className="text-lg text-gray-700 font-medium mb-2">
                  @{username}
                </h3>
                {!userId && (
                  <button
                    onClick={handleEditProfile}
                    className="mt-2 bg-[#611DD0] text-white rounded-full px-6 py-2 font-semibold shadow hover:bg-[#5000B9] transition"
                  >
                    Edit Profile
                  </button>
                )}
                {userId && (
                  <div className="flex justify-between gap-3">
                    <button
                      onClick={() => (isFollowing ? handleUnfollow(userId) : handleFollow(userId))}
                      className={`mt-2 px-4 py-2 rounded-full font-semibold shadow ${
                        isFollowing
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-[#611DD0] text-white hover:bg-[#5000B9]"
                      }`}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                    <button
                      onClick={handleMessage}
                      className="mt-2 ml-2 bg-[#611DD0] text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-[#5000B9]"
                    >
                      Message
                    </button>
                  </div>
                )}
              </div>
              <div className="flex bg-white/70 backdrop-blur-md rounded-2xl shadow-lg px-10 py-6 gap-12 mt-6 md:mt-0">
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-[#611DD0]">{postsCount}</h2>
                  <p className="text-gray-600 font-medium">Posts</p>
                </div>
                <div className="w-px bg-gradient-to-b from-[#A084E8] to-[#611DD0] mx-4"></div>
                <div
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => handleShowConnections("followers")}
                >
                  <h2 className="text-2xl font-bold text-[#611DD0]">{followersCount}</h2>
                  <p className="text-gray-600 font-medium">Followers</p>
                </div>
                                <div className="w-px bg-gradient-to-b from-[#A084E8] to-[#611DD0] mx-4"></div>
                <div
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => handleShowConnections("following")}
                >
                  <h2 className="text-2xl font-bold text-[#611DD0]">{followingCount}</h2>
                  <p className="text-gray-600 font-medium">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12 text-center">
          <h3 className="text-[21px] flex items-center justify-center gap-2 font-semibold mb-2 text-[#6B46C1] highlight-haven-title">
            Highlight Haven{" "}
            {<p className="text-sm pt-3 mt-1 mb-4 text-[#A0AEC0]">(Showcase Your Stories)</p>}
          </h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            <div className="stories relative w-[180px] h-[150px] overflow-hidden rounded-[20px] before:absolute before:inset-0 before:bg-white/10">
              <img
                src="https://images.unsplash.com/photo-1746950862509-959ed92c42b8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVeZHwyMHx8fGVufDB8fHx8fA%3D%3D"
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
                src="https://images.pexels.com/photos-27355586/pexels-photo-27355586/free-photo-of-daniel-1.jpeg?auto=compress&cs=tinysrgb&w=600"
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
            <button className="mt-2 font-['Nunito'] bg-[#611DD0] text-white px-4 py-2 rounded-full hover:bg-[#5000B9]">
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
            <button
              onClick={handleViewUserPosts}
              className="text-xl font-semibold text-[#611DD0] hover:text-[#5000B9]"
            >
              View All Posts
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="w-full h-80 object-cover rounded-lg cursor-pointer"
                onClick={() => handleViewPost(post)}
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.content}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-600">{post.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {!userId && (
        <div className="absolute left-250 top-10">
          <MoodMaker />
        </div>
      )}

      {isLoading && <Loader />}

     {showModal && (
  <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 w-[800px] relative rounded-xl p-6 max-h-[80vh] overflow-y-auto scrollbar-hide animate-slide-in shadow-xl border border-purple-200">
      {showModal === "post" && selectedPost && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-purple-800">Post Details</h2>
          <div className="flex flex-col items-center">
            <img
              src={selectedPost.user?.profilePicture || defaultAvatar}
              alt={selectedPost.user?.fullname}
              className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-purple-300"
            />
            <h3 className="font-semibold text-gray-800 text-center flex flex-col">

              <span className="text-purple-600">{selectedPost.user?.fullname}</span> 
              @{selectedPost.user?.username}
                
            </h3>
            <p className="text-sm text-purple-500 mt-1">{formatTime(selectedPost.createdAt)}</p>
            <p className="mt-4 text-gray-700 text-lg break-words bg-white p-4 rounded-lg w-full border border-purple-100">
              {selectedPost.content}
            </p>
            {selectedPost.image && (
              <img
                src={selectedPost.image}
                alt="post media"
                className="mt-4 rounded-xl h-[450px] w-full object-cover border border-purple-100 shadow-sm"
              />
            )}
            <div className="flex justify-between text-gray-800 mt-6 text-sm w-full px-4">
              <span className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                <BiSolidLike size={20} className="text-gray-700" /> {selectedPost.likes?.length || 0}
              </span>
              <span className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                <FaRegCommentDots size={20} className="text-gray-700" /> {selectedPost.comments?.length || 0}
              </span>
              <span className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                <FaShare size={20} className="text-gray-700" /> {selectedPost.shares || 0}
              </span>
            </div>
          </div>
        </>
      )}
      
      {showModal === "post" && !selectedPost && userPosts.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-purple-800">All Posts by {fullname}</h2>
          <div className="space-y-6">
            {userPosts.map((post) => (
              <div key={post._id} className="border border-purple-200 rounded-xl p-5 bg-white shadow-sm">
                <div className="flex items-center mb-3">
                  <img
                    src={post.user?.profilePicture || defaultAvatar}
                    alt={post.user?.fullname}
                    className="w-12 h-12 rounded-full object-cover mr-3 border-2 border-purple-300"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {post.user?.fullname} <span className="text-gray-600">@{post.user?.username}</span>
                    </h3>
                    <p className="text-sm text-purple-500">
                      {formatTime(post.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 text-lg break-words mb-3 bg-purple-50 p-3 rounded-lg">{post.content}</p>
                {post.image && (
                  <img
                    src={post.image}
                    alt="post media"
                    className="rounded-xl h-[450px] w-full object-cover mb-3 border border-purple-100"
                  />
                )}
                <div className="flex justify-between text-gray-800 text-sm">
                  <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                    <BiSolidLike size={18} className="text-gray-700" /> {post.likes?.length || 0}
                  </span>
                  <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                    <FaRegCommentDots size={18} className="text-gray-700" /> {post.comments?.length || 0}
                  </span>
                  <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                    <FaShare size={18} className="text-gray-700" /> {post.shares || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal !== "post" && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-purple-800">
            {showModal === "followers" ? "Followers" : "Following"} ({showModal === "followers" ? followersCount : followingCount})
          </h2>
          <div className="space-y-4">
            {showModal === "followers" && followersList.length === 0 && (
              <p className="text-purple-700 text-center bg-purple-100 p-4 rounded-lg">No Followers Yet.</p>
            )}
            {showModal === "following" && followingList.length === 0 && (
              <p className="text-purple-700 text-center bg-purple-100 p-4 rounded-lg">No Following Yet.</p>
            )}
            {(showModal === "followers" ? followersList : followingList).map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-purple-200 shadow-sm"
              >
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => {
                    setShowModal(null);
                    if (user._id === loggedInUserId || user.username === currentUsername) {
                      navigate("/profile");
                    } else {
                      navigate(`/profile/${user._id}`);
                    }
                  }}
                >
                  <img
                    src={user.profilePicture || defaultAvatar}
                    alt={user.username}
                    className="w-14 h-14 rounded-full mr-4 border-2 border-purple-300"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{user.fullname}</p>
                    <p className="text-purple-600">@{user.username}</p>
                  </div>
                </div>

                {!userId && (
                  <>
                    {showModal === "followers" ? (
                      <button
                        onClick={() => setShowRemoveConfirm(user._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowUnfollowConfirm(user._id)}
                        className="bg-[#611DD0] text-white px-4 py-2 rounded-full hover:bg-[#5000B9] transition shadow-sm"
                      >
                        Following
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      <button
        onClick={handleCloseModal}
        className="absolute top-4 right-4 text-[#611DD0] hover:text-[#5000B9] transition-colors bg-purple-100 p-1 rounded-full"
      >
        <IoCloseSharp size={25} />
      </button>
    </div>
  </div>
)}

      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-1/3 text-center animate-slide-in">
            <h2 className="text-xl font-bold mb-4">Remove Follower?</h2>
            <p className="mb-4">Are you sure you want to remove this follower?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleUnfollow(showRemoveConfirm, "removeFollower")}
                className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600"
              >
                Remove
              </button>
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="bg-[#611DD0] text-white px-4 py-2 rounded-full hover:bg-[#5000B9]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnfollowConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-1/3 text-center animate-slide-in">
            <h2 className="text-xl font-bold mb-4">Unfollow User?</h2>
            <p className="mb-4">Are you sure you want to unfollow this user?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleUnfollow(showUnfollowConfirm)}
                className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600"
              >
                Unfollow
              </button>
              <button
                onClick={() => setShowUnfollowConfirm(null)}
                className="bg-[#611DD0] text-white px-4 py-2 rounded-full hover:bg-[#5000B9]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;