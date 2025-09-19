import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import MaleAvatar from "../../../public/images/Male Avatar.png";
import FemaleAvatar from "../../../public/images/Female Avatar.webp";
import DefaultAvatar from "../../../public/images/default.jpg";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  setProfilePicture,
  setFullName,
  setUsername,
  setGender,
} from "../../redux/slices/userSlice";
import axiosClient from "../../api/axiosClient";
import type { RootState } from "../../redux/store";
import {
  FaRegCommentDots,
  FaShare,
  FaEllipsisV,
  FaVideo,
} from "react-icons/fa";
import { BiSolidLike } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import HashtagList from "../HashtagList/HashtagList";
import Story from "../../components/story/Story";
import { socketService } from "../../services/socketServices";
import { useSocketNotifications } from "../../hooks/useSocketNotifications";

export interface Post {
  id: string;
  name: string;
  username: string;
  time: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  profilePicture: string;
  media: {
    type: "image" | "video" | "audio" | "file";
    url: string;
    name?: string;
  } | null;
  userId: string; 
  userReaction?: string;
}

interface Emoji {
  native: string;
  id: string;
}

const Home = () => {
  const dispatch = useDispatch();
  useSocketNotifications();

  const {
    profilePicture,
    fullname,
    gender,
    _id: currentUserId,
  } = useSelector((state: RootState) => state.user);

  const [posts, setPosts] = useState<Post[]>([]);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<
    "image" | "video" | null
  >(null);
  const [showReactionOptions, setShowReactionOptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);


  // Function to get reaction icon based on reaction type
const getReactionIcon = (reactionType: string) => {
  switch (reactionType) {
    case "love": return "❤️";
    case "haha": return "😂";
    case "wow": return "😮";
    case "sad": return "😢";
    case "angry": return "😠";
    default: return "👍"; // Default to like
  }
};
  // Add socket connection on component mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId") || currentUserId;

    if (token && userId) {
      socketService.connect(token, userId).catch((error) => {
        console.error("Socket connection failed:", error);
      });
    }

    return () => {
      if (socketService.isSocketConnected()) {
        socketService.disconnect();
      }
    };
  }, [currentUserId]);
  const getAvatarByGender = (gender: string) => {
    if (gender?.toLowerCase() === "male") return MaleAvatar;
    else if (gender?.toLowerCase() === "female") return FemaleAvatar;
    else return DefaultAvatar;
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
        const genderAvatar = getAvatarByGender(data.gender);
        dispatch(setProfilePicture(data.profilePicture || genderAvatar));
        dispatch(setFullName(data.fullname || "Current User"));
        dispatch(setUsername(data.username || "@currentUser"));
        dispatch(setGender(data.gender || ""));
      } catch (err: unknown) {
        const error = err as {
          message?: string;
          response?: { status?: number; data?: unknown };
        };
        console.error("Fetch Profile error: ", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error("Failed to load profile data");
      }
    };
    fetchProfile();
  }, [dispatch]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axiosClient.get("/api/posts/getPosts", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        // The backend returns the posts array directly, not nested in a 'posts' property
        const fetchedPosts = res.data;

        const formattedPosts: Post[] = fetchedPosts.map((post: any) => ({
          id: post._id,
          caption: post.content,
          media: post.image
            ? {
                type: post.image.includes("/video/")
                  ? ("video" as const)
                  : ("image" as const),
                url: post.image,
                name: post.image.split("/").pop(),
              }
            : null,
          likes: post.likes?.length || 0,
          comments: post.comments?.length || 0,
          shares: post.shares || 0,
          time: formatTime(post.createdAt),
          profilePicture: post.user?.profilePicture || DefaultAvatar,
          username: post.user?.username
            ? `@${post.user.username}`
            : "@UnknownUser",
          name: post.user?.fullname || "Unknown User",
          userId: post.user?._id || "", // Add userId to identify post owner
          userReaction: post.userReaction || undefined
        }));

        setPosts(formattedPosts);
      } catch (err: unknown) {
        const error = err as {
          message?: string;
          response?: { status?: number; data?: { message?: string } };
        };
        console.error("Fetch Posts error: ", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error(error.response?.data?.message || "Failed to load posts");
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node)
      ) {
        setShowOptionsMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: Emoji) => {
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const text = textareaRef.current.value;
      const newText =
        text.slice(0, cursorPos) + emoji.native + text.slice(cursorPos);
      textareaRef.current.value = newText;
      textareaRef.current.selectionEnd = cursorPos + emoji.native.length;
      textareaRef.current.focus();
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setSelectedMedia(file);
      setSelectedMediaType(type);

      if (type === "image") {
        toast.success(`Selected image: ${file.name}`);
      } else {
        toast.success(`Selected video: ${file.name}`);
      }
    }
  };

  const handlePostSubmit = async () => {
    if (textareaRef.current && textareaRef.current.value.trim()) {
      setIsPosting(true);
      const formData = new FormData();
      formData.append("content", textareaRef.current.value.trim());

      if (selectedMedia) {
        formData.append("media", selectedMedia);
        console.log(
          "Selected media:",
          selectedMedia.name,
          selectedMedia.type,
          selectedMedia.size
        );
      }

      try {
        console.log("Sending post request...");
        const response = await axiosClient.post(
          "/api/posts/createPost",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("Post created successfully:", response.data);

        if (response.data.success) {
          const newPostData = response.data.data;
          const newPost: Post = {
            id: newPostData._id,
            caption: newPostData.content,
            media: newPostData.image
              ? {
                  type: newPostData.image.includes("/video/")
                    ? ("video" as const)
                    : ("image" as const),
                  url: newPostData.image,
                  name: newPostData.image.split("/").pop(),
                }
              : null,
            likes: newPostData.likes?.length || 0,
            comments: newPostData.comments?.length || 0,
            shares: newPostData.shares || 0,
            time: formatTime(newPostData.createdAt),
            profilePicture:
              newPostData.user?.profilePicture || getAvatarByGender(gender),
            username: newPostData.user?.username
              ? `@${newPostData.user.username}`
              : "@CurrentUser",
            name: newPostData.user?.fullname || fullname || "Current User",
            userId: newPostData.user?._id || currentUserId || "",
          };

          setPosts((prevPosts) => [newPost, ...prevPosts]);
          textareaRef.current.value = "";
          setSelectedMedia(null);
          setSelectedMediaType(null);
          setShowPostOptions(false);
          setShowEmojiPicker(false);
          if (imageInputRef.current) imageInputRef.current.value = "";
          if (videoInputRef.current) videoInputRef.current.value = "";
          toast.success("Post created successfully!");
        } else {
          toast.error(response.data.message || "Failed to create post");
        }
      } catch (err: unknown) {
        const error = err as {
          message?: string;
          response?: {
            status?: number;
            data?: {
              message?: string;
              error?: string;
              stack?: string;
            };
          };
        };

        console.error("Post creation error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create post. Please check your connection and try again.";

        toast.error(errorMessage);
      } finally {
        setIsPosting(false);
      }
    } else {
      toast.error("Please enter a caption!");
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker && textareaRef.current)
      setTimeout(() => textareaRef.current?.focus(), 0);
  };

const handleReaction = async (postId: string, reactionType: string = "like") => {
  try {
    const response = await axiosClient.post(
      `/api/likes/react/Post/${postId}/${reactionType}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    // Update the post's like count and user reaction
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: response.data.liked
                ? post.likes + 1
                : Math.max(0, post.likes - 1),
              userReaction: response.data.liked ? reactionType : undefined
            }
          : post
      )
    );

    if (response.data.liked) {
      // find the post to get the owners id
      const likedPost = posts.find((post) => post.id === postId);
      if (likedPost && likedPost.userId !== currentUserId) {
        socketService.sendLikeNotification({
          recipientId: likedPost.userId,
          senderId: currentUserId,
          targetType: "Post",
          targetId: postId,
          type: "like",
          reactionType: reactionType // Include reaction type in notification
        });
      }
    }
    toast.success(response.data.message);
  } catch (err: unknown) {
    const error = err as {
      message?: string;
      response?: { data?: { message?: string } };
    };
    console.error("Reaction error:", error);
    toast.error(error.response?.data?.message || "Failed to add reaction");
  }
  setShowReactionOptions((prev) => ({ ...prev, [postId]: false }));
};

  const toggleOptionsMenu = (postId: string) => {
    setShowOptionsMenu(showOptionsMenu === postId ? null : postId);
  };

  const handleSavePost = async (postId: string) => {
    try {
      // Implement save post functionality
      console.log(`${postId} has been saved!`);
      toast.success("Post saved!");
      setShowOptionsMenu(null);
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleHidePost = (postId: string) => {
    // Hide post from current view (frontend only)
    setPosts(posts.filter((post) => post.id !== postId));
    toast.success("Post hidden");
    setShowOptionsMenu(null);
  };

  const handleReportPost = async (postId: string) => {
    try {
      // Implement report post functionality
      console.log(`${postId} has been reported`);
      toast.success("Post reported. Our team will review it shortly.");
      setShowOptionsMenu(null);
    } catch (error) {
      console.error("Error reporting post:", error);
      toast.error("Failed to report post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setIsDeleting(postId);
      await axiosClient.delete(`/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      // Remove post from frontend
      setPosts(posts.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully");
      setShowOptionsMenu(null);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(null);
    }
  };

  const clearSelectedMedia = () => {
    setSelectedMedia(null);
    setSelectedMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    toast.info("Media cleared");
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 w-[950px] relative flex flex-col min-h-screen">
        <div className="flex h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide items-start justify-between w-full px-8 py-6 ml-[6rem] mt-[5rem]">
          <div className="flex-1 max-w-3xl">
            {/* Create Post */}
            <div className="bg-white flex flex-col shadow-md rounded-2xl p-4 mt-6 mb-4 relative">
              <div className="flex items-center gap-4 mt-2">
                <img
                  src={profilePicture || getAvatarByGender(gender)}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) =>
                    (e.currentTarget.src = getAvatarByGender(gender))
                  }
                />
                <textarea
                  ref={textareaRef}
                  className="w-full border font-['Nunito Bold'] text-black rounded-xl p-3 outline-none resize-none"
                  rows={2}
                  placeholder="What's on your Heart? #Hashtag... @Mention... Link..."
                  onFocus={() => setShowPostOptions(true)}
                ></textarea>
              </div>

              {selectedMedia && (
                <div className="mt-3 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Selected: {selectedMedia.name} ({selectedMediaType})
                  </span>
                  <button
                    onClick={clearSelectedMedia}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}

              {showPostOptions && (
                <div className="flex items-center justify-between mt-4 p-2">
                  <div className="flex gap-4 text-[#611DD0]">
                    {/* Image upload */}
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={(e) => handleFileSelect(e, "image")}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      className="p-2 cursor-pointer hover:bg-purple-100 rounded-full transition-colors"
                      onClick={() => imageInputRef.current?.click()}
                      title="Upload image"
                    >
                      <span className="text-2xl">📸</span>
                    </button>

                    {/* Video upload */}
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={(e) => handleFileSelect(e, "video")}
                      accept="video/*"
                      className="hidden"
                    />
                    <button
                      className="p-2 cursor-pointer hover:bg-purple-100 rounded-full transition-colors"
                      onClick={() => videoInputRef.current?.click()}
                      title="Upload video"
                    >
                      <FaVideo className="text-xl text-[#611DD0]" />
                    </button>

                    <button
                      className="p-2 cursor-pointer hover:bg-purple-100 rounded-full transition-colors"
                      onClick={toggleEmojiPicker}
                      title="Add emoji"
                    >
                      <span className="text-2xl">😊</span>
                    </button>
                  </div>
                  <button
                    className="flex items-center gap-2 bg-[#611DD0] text-white px-4 py-2 rounded-lg hover:bg-[#a679ee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePostSubmit}
                    disabled={isPosting}
                  >
                    {isPosting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Posting...
                      </>
                    ) : (
                      "Post"
                    )}
                  </button>
                </div>
              )}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute top-16 left-16 z-10"
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

            {/* Stories Slider */}
            <Story />

            {/* Post Feeds */}
            <div className="flex flex-col gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white shadow-md rounded-2xl p-6 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
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
                    <div className="relative">
                      <button
                        className="text-gray-700 p-2 rounded-full hover:bg-gray-100"
                        onClick={() => toggleOptionsMenu(post.id)}
                      >
                        <FaEllipsisV />
                      </button>

                      {showOptionsMenu === post.id && (
                        <div
                          ref={optionsMenuRef}
                          className="absolute right-0 top-10 bg-white shadow-lg rounded-lg p-2 w-48 z-10 border border-gray-200"
                        >
                          <button
                            className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-gray-700"
                            onClick={() => handleSavePost(post.id)}
                          >
                            Save Post
                          </button>
                          <button
                            className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-gray-700"
                            onClick={() => handleHidePost(post.id)}
                          >
                            Hide this post
                          </button>
                          <button
                            className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-gray-700"
                            onClick={() => handleReportPost(post.id)}
                          >
                            Report post
                          </button>

                          {/* Show delete option only for post owner */}
                          {post.userId === currentUserId && (
                            <button
                              className="w-full text-left p-2 hover:bg-red-50 rounded-md text-red-600 border-t border-gray-200 mt-2"
                              onClick={() => setShowDeleteConfirm(post.id)}
                            >
                              Delete post
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-800 text-lg text-left break-words mb-2">
                      {post.caption.replace(/#\w+/g, "")}
                    </p>
                    {post.caption.match(/#\w+/g) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.caption.match(/#\w+/g)?.map((hashtag, index) => (
                          <span
                            key={index}
                            className="text-[#611DD0] font-medium"
                          >
                            {hashtag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {post.media && (
                    <div className="mt-4">
                      {post.media.type === "image" && (
                        <img
                          src={post.media.url}
                          alt="post media"
                          className="rounded-xl h-[450px] w-full object-cover"
                          onError={(e) => {
                            console.error(
                              "Failed to load post image:",
                              post.media?.url
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      {post.media.type === "video" && (
                        <video
                          autoPlay
                          playsInline
                          controls
                          className="rounded-xl h-[450px] w-full object-cover"
                        >
                          <source src={post.media.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-gray-800 mt-6 text-sm">
                  <span
  className="flex ml-10 items-center gap-2 cursor-pointer relative"
  onMouseEnter={() =>
    setShowReactionOptions((prev) => ({
      ...prev,
      [post.id]: true,
    }))
  }
  onMouseLeave={() =>
    setShowReactionOptions((prev) => ({
      ...prev,
      [post.id]: false,
    }))
  }
>
  {post.userReaction ? (
    <span className="text-xl">{getReactionIcon(post.userReaction)}</span>
  ) : (
    <BiSolidLike size={20} />
  )}
  {post.userId === currentUserId ? post.likes : "Like"}
  {showReactionOptions[post.id] && (
    <div className="absolute bottom-4 h-10 left-0 bg-white shadow-lg rounded-lg p-2 flex gap-2 z-10">
      <span
        onClick={() => handleReaction(post.id, "like")}
        className="cursor-pointer text-xl"
      >
        👍
      </span>
      <span
        onClick={() => handleReaction(post.id, "love")}
        className="cursor-pointer text-xl"
      >
        ❤️
      </span>
      <span
        onClick={() => handleReaction(post.id, "haha")}
        className="cursor-pointer text-xl"
      >
        😂
      </span>
      <span
        onClick={() => handleReaction(post.id, "wow")}
        className="cursor-pointer text-xl"
      >
        😮
      </span>
      <span
        onClick={() => handleReaction(post.id, "sad")}
        className="cursor-pointer text-xl"
      >
        😢
      </span>
    </div>
  )}
</span>
                    <span className="flex items-center gap-2">
                      <FaRegCommentDots size={20} />
                      {post.userId === currentUserId
                        ? post.comments
                        : "Comment"}
                    </span>
                    <span className="flex mr-10 items-center gap-2">
                      <FaShare size={20} />
                      {post.userId === currentUserId ? post.shares : "Share"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-1/4 moodMaker sticky top-[12rem] right-10 self-start ml-16">
        <HashtagList />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={() => handleDeletePost(showDeleteConfirm)}
                disabled={isDeleting === showDeleteConfirm}
              >
                {isDeleting === showDeleteConfirm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
