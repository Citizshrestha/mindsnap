import { useEffect, useState, useRef } from "react";
import Header from "../header/Header";
import MoodMaker from "../MoodMaker/MoodMaker";
import Sidebar from "../sidebar/Sidebar";
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
import { useDispatch, useSelector} from "react-redux";

const Home = () => {
  const dispatch = useDispatch();
  const { profilePicture, fullname, username, gender } = useSelector((state: RootState) => state.user);
  const [posts, setPosts] = useState<Post[]>(postsData);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null); // To store selected file
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAvatarByGender = (gender: string) => {
    if (gender?.toLowerCase() === "male") return MaleAvatar;
    else if (gender?.toLowerCase() === "female") return FemaleAvatar;
    else return DefaultAvatar;
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        const data = res.data || {};
        const genderAvatar = getAvatarByGender(data.gender);
        dispatch(setProfilePicture(data.profilePicture || genderAvatar));
        dispatch(setFullName(data.fullname || "Current User"));
        dispatch(setUsername(data.username || "@currentUser"));
        dispatch(setGender(data.gender || ""));
      } catch (err: unknown) {
        const errorObj = err as { message?: string; res?: { status?: number; data?: unknown } };
        console.error("Fetch Profile error: ", { message: errorObj?.message, status: errorObj?.res?.status, data: errorObj?.res?.data });
        toast.error("Failed to load profile data");
      }
    };
    fetchProfile();
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      toast.success(`Selected ${file.name}`);
    }
  };

  const handlePostSubmit = () => {
    if (textareaRef.current && textareaRef.current.value.trim()) {
      let media = null;
      if (selectedMedia) {
        const mediaType = selectedMedia.type.split("/")[0]; // e.g., "image", "video", "audio"
        media = {
          type: mediaType as "image" | "video" | "audio" | "file",
          url: URL.createObjectURL(selectedMedia), 
          name: selectedMedia.name,
        };
      }

      const newPost: Post = {
        id: posts.length + 1,
        name: fullname || "Current User",
        username: username ? `@${username}` : "@CurrentUser",
        time: formatTime(),
        caption: textareaRef.current.value,
        likes: 0,
        comments: 0,
        shares: 0,
        profilePicture: profilePicture || getAvatarByGender(gender),
        media,
      };
      setPosts((prevPosts) => [newPost, ...prevPosts]);
      textareaRef.current.value = "";
      setSelectedMedia(null);
      setShowPostOptions(false);
      setShowEmojiPicker(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
      toast.success("Post created successfully!");
    } else {
      toast.error("Please enter a caption!");
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker && textareaRef.current) setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <Header />
      <div className="flex-1 w-[950px] relative flex flex-col min-h-screen">
        <div className="flex h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide items-start justify-between w-full px-6 py-6 ml-[6rem] mt-[5rem]">
          <div className="flex-1 max-w-3xl">
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
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                    />
                    <span
                      className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📤
                    </span>
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
                <div ref={emojiPickerRef} className="absolute top-10 bottom-16 left-16 z-10">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" skinTonePosition="none" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white shadow-md rounded-2xl p-4">
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
                          {post.name} <span className="text-gray-600 font-normal">{post.username}</span>
                        </h3>
                        <p className="text-sm text-gray-500">{post.time}</p>
                      </div>
                    </div>
                    <button className="text-gray-700">•••</button>
                  </div>
                  <p className="mt-3 text-gray-800 text-xl break-words">{post.caption}</p>
                  {post.media && (
                    <div className="mt-3">
                      {post.media.type === "image" && (
                        <img
                          src={post.media.url}
                          alt="post media"
                          className="rounded-xl h-[400px] w-full object-cover"
                        />
                      )}
                      {post.media.type === "video" && (
                        <video controls className="rounded-xl h-[400px] w-full object-cover">
                          <source src={post.media.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {post.media.type === "audio" && (
                        <audio controls className="w-full">
                          <source src={post.media.url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      {post.media.type === "file" && (
                        <a
                          href={post.media.url}
                          download={post.media.name}
                          className="text-blue-500 underline"
                        >
                          Download {post.media.name}
                        </a>
                      )}
                    </div>
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
      <div className="w-1/4 moodMaker sticky top-[7rem] right-10 self-start ml-16">
        <MoodMaker />
      </div>
    </div>
  );
};

export default Home;