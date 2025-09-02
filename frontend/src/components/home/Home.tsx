import { useDispatch, useSelector } from "react-redux";
import Header from "../header/Header";
import MoodMaker from "../MoodMaker/MoodMaker";
import Sidebar from "../sidebar/Sidebar";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import MaleAvatar from "../../../public/images/Male Avatar.png";
import FemaleAvatar from "../../../public/images/Female Avatar.webp";
import DefaultAvatar from "../../../public/images/default.jpg";
import Picker from "@emoji-mart/react"; 
import data from "@emoji-mart/data"; 
import {
  setProfilePicture,
  setFullName,
  setUsername,
  setGender,
} from "../../redux/slices/userSlice";
import axiosClient from "../../api/axiosClient";
import type { RootState } from "../../redux/store";
import { postsData, type Post } from "../../data/postFeed";
import { FaRegCommentDots, FaShare } from "react-icons/fa";
import { BiSolidLike } from "react-icons/bi";

const Home = () => {
  const dispatch = useDispatch();
  const { profilePicture, fullname, username, gender } = useSelector((state: RootState) => state.user);
  const [posts, setPosts] = useState<Post[]>(postsData);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Function to get avatar based on gender
  const getAvatarByGender = (gender: string) => {
     if (gender?.toLocaleLowerCase() === 'male'){
       return MaleAvatar;
     } else if (gender?.toLocaleLowerCase() === 'female'){
      return FemaleAvatar;
     } else {
      return DefaultAvatar;
     }
  };

  // Function to format time without seconds
  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const data = res.data || {};
        
        // Get the appropriate avatar based on gender
        const genderAvatar = getAvatarByGender(data.gender);
        
        // Update user data in Redux
        dispatch(setProfilePicture(data.profilePicture || genderAvatar));
        dispatch(setFullName(data.fullname || "Current User"));
        dispatch(setUsername(data.username || "@currentUser"));
        dispatch(setGender(data.gender || ""));

        console.log("User gender from API:", data.gender);
        console.log("Selected avatar:", genderAvatar);

      } catch (err: unknown) {
        const errorObj = err as { message?: string; res?: { status?: number; data?: unknown } };
        console.error("Fetch Profile error: ", {
          message: errorObj?.message,
          status: errorObj?.res?.status,
          data: errorObj?.res?.data,
        });
        toast.error("Failed to load profile data");
      }
    };
    fetchProfile();
  }, [dispatch]);

  // Handle clicks outside the emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  interface Emoji {
    native: string;
    id: string;
  }

  const handleEmojiSelect = (emoji: Emoji) => {
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const text = textareaRef.current.value;
      const newText = text.slice(0, cursorPos) + emoji.native + text.slice(cursorPos);
      textareaRef.current.value = newText;
      textareaRef.current.selectionEnd = cursorPos + emoji.native.length;
      textareaRef.current.focus();
    }
  };

  const handlePostSubmit = () => {
    if (textareaRef.current && textareaRef.current.value.trim()) {
      const newPost: Post = {
        id: posts.length + 1,
        name: fullname || "Current User",
        username: username ? `@${username}` : "@CurrentUser",
        time: formatTime(), // Use formatted time without seconds
        caption: textareaRef.current.value,
        likes: 0,
        comments: 0,
        shares: 0,
        profilePicture: profilePicture || getAvatarByGender(gender),
        image: null,
      };
      setPosts((prevPosts) => [newPost, ...prevPosts]);
      textareaRef.current.value = "";
      setShowPostOptions(false);
      setShowEmojiPicker(false);
      toast.success("Post created successfully!");
    } else {
      toast.error("Please enter a caption!");
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      <Header />

      {/* Main Content */}
      <div className="flex-1 w-[950px] relative flex flex-col min-h-screen">
        <div className="flex h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide items-start justify-between w-full px-6 py-6 ml-[6rem] mt-[5rem]">
          {/* Feed Area */}
          <div className="flex-1 max-w-3xl">
            {/* Create Post */}
            <div className="bg-white flex flex-col shadow-md rounded-2xl p-2 mt-4 mb-2 relative">
              <div className="flex items-center justify-center gap-3 mt-2">
                <img
                  src={profilePicture || getAvatarByGender(gender)}
                  alt="Profile"
                  className="w-12 h-12 ml-2 rounded-full object-cover"
                  onError={(e) => (e.currentTarget.src = getAvatarByGender(gender))}
                />
                <textarea
                  ref={textareaRef}
                  className="w-full border font-sans text-black rounded-xl p-3 outline-none resize-none"
                  rows={2}
                  placeholder="What's on your Heart? #Hashtag... @Mention... Link..."
                  onFocus={() => setShowPostOptions(true)}
                ></textarea>
              </div>
              {showPostOptions && (
                <div className="flex items-center justify-between mt-2 p-2">
                  <div className="flex gap-4 text-purple-600">
                    <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">📷</span>
                    <span
                      className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                      onClick={toggleEmojiPicker}
                    >
                      😊
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-2 bg-[#611DD0] text-white px-4 py-1 rounded-lg hover:bg-[#a679ee] transition-colors"
                    onClick={handlePostSubmit}
                  >
                    Post
                  </button>
                </div>
              )}
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute top-10 bottom-16 left-16 z-10"
                >
                  <Picker 
                    data={data} 
                    onEmojiSelect={handleEmojiSelect} 
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </div>
              )}
            </div>

            {/* Posts Feed */}
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white shadow-md rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.profilePicture}
                        alt={post.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => (e.currentTarget.src = DefaultAvatar)}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {post.name}{" "}
                          <span className="text-gray-600 font-normal">
                            {post.username}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-500">{post.time}</p>
                      </div>
                    </div>
                    <button className="text-gray-700">•••</button>
                  </div>
                  <p className="mt-3 text-gray-800 text-xl break-words">{post.caption}</p>
                  {post.image && (
                    <img
                      src={post.image}
                      alt="post"
                      className="rounded-xl h-[400px] mt-3 w-full object-cover"
                    />
                  )}
                  <div className="flex justify-between text-gray-800 mt-6 text-sm">
                    <span className="flex ml-10 items-center gap-2">
                      <BiSolidLike size={20} /> {post.likes}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaRegCommentDots size={20} /> {post.comments}
                    </span>
                    <span className="flex mr-10 items-center gap-2">
                      <FaShare size={20} /> {post.shares}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MoodMaker Area */}
      <div className="w-1/4 moodMaker sticky top-[7rem] right-10 self-start ml-16">
        <MoodMaker />
      </div>
    </div>
  );
};

export default Home;