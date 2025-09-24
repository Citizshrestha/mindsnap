import { useState, useEffect, useCallback } from "react";
import storiesData, { type StorySample } from "../../data/storySample";
import CreateStory from "./CreateStory";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { setProfilePicture } from "../../redux/slices/userSlice";
import {
  FaWindowClose,
  FaTrash,
  FaArrowLeft,
  FaArrowRight,
  FaThumbsUp,
  FaEye,
  FaClock,
} from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

const Story = () => {
  const [stories, setStories] = useState<StorySample[]>([]);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showMyStories, setShowMyStories] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState<StorySample[]>(
    []
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const dispatch = useDispatch();

  const { profilePicture: currentPic } = useSelector(
    (state: RootState) => state.user
  );
  const userId = localStorage.getItem("userId");
  const accessToken = localStorage.getItem("accessToken");

  // Improved time formatting function with validation
  const formatTimeRemaining = (expiresAt: string) => {
    try {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();

      if (isNaN(expires)) return "Expired";

      const timeLeft = expires - now;

      if (timeLeft <= 0) {
        return "Expired";
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));

      if (hours > 0) {
        return `${hours}h`;
      } else {
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes}m`;
      }
    } catch (error) {
      console.error(error);
      return "Expired";
    }
  };

  // Improved formatTimeAgo with validation
  const formatTimeAgo = (createdAt: string | undefined) => {
    if (!createdAt) return "Unknown";

    try {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();

      if (isNaN(created)) return "Unknown";

      const diff = now - created;

      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));

      if (minutes < 1) return "just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      if (weeks < 4) return `${weeks}w ago`;

      // For older content, show the actual date
      return new Date(createdAt).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Unknown";
    }
  };

  // Get all unique users from stories
  const allUsers = Array.from(new Set(stories.map((story) => story.user)));
  const usersWithStories = allUsers.map((user) => ({
    user,
    stories: stories
      .filter((story) => story.user === user)
      .sort(
        (a, b) =>
          new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
      ),
  }));

  const fetchStories = useCallback(async () => {
    if (!accessToken) {
      toast.error("Please log in to load stories.");
      setStories([]);
      return;
    }
    try {
      const res = await axiosClient.get("/api/stories", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const apiStories = res.data.stories || [];

      // Convert API stories to StorySample format with proper typing
      const fetchedStories = apiStories.map((story: any) => ({
        _id: story._id || Math.random().toString(),
        user: story.user?.isCurrentUser
          ? "You"
          : story.user?.username || "Unknown User",
        caption: story.caption || "",
        profilePic: story.user?.profilePicture || "",
        content: {
          url: story.content?.url || "",
          mediaType: story.content?.mediaType || "image",
        },
        expiresAt:
          story.expiresAt ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: story.createdAt || new Date().toISOString(), // Make sure this line exists and uses the actual createdAt from DB
        views: story.views || [],
        likes: story.likes || [],
      }));

      // Remove sample stories that might have equivalent API stories (by user)
      const apiUsernames = new Set(
        fetchedStories.map((s: StorySample) => s.user)
      );
      const uniqueSampleStories = storiesData.filter(
        (s) => !apiUsernames.has(s.user)
      );

      // Combine API stories with unique sample stories
      const combinedStories = [...fetchedStories, ...uniqueSampleStories];

      // Sort by expiration date (newest first)
      const sortedStories = combinedStories.sort(
        (a, b) =>
          new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
      );

      setStories(sortedStories);
    } catch (err) {
      const errorObj = err as {
        message?: string;
        response?: { status?: number; data?: { message?: string } };
      };

      if (errorObj.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        setStories([]);
      } else {
        console.error("Fetch Stories error: ", errorObj);
        // On error, show sample stories only
        setStories(
          [...storiesData].sort(
            (a, b) =>
              new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
          )
        );
      }
    }
  }, [accessToken]);

  useEffect(() => {
    // Start with sample stories initially
    setStories(storiesData);

    const fetchProfile = async () => {
      if (!accessToken) {
        toast.error("Please log in to load your profile.");
        return;
      }

      try {
        const res = await axiosClient.get("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = res.data || {};

        if (data.profilePicture) {
          dispatch(setProfilePicture(data.profilePicture));
        }
      } catch (err) {
        const errorObj = err as {
          message?: string;
          response?: { status?: number; data?: { message?: string } };
        };
        if (errorObj.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else {
          console.error("Fetch Profile error: ", errorObj);
          toast.error(
            `Failed to load profile data: ${
              errorObj.response?.data?.message ||
              errorObj.message ||
              "Unknown error"
            }`
          );
        }
      }
    };

    if (!currentPic) {
      fetchProfile();
    }

    fetchStories();
  }, [dispatch, currentPic, accessToken, fetchStories]);

  const handleSaveStory = async (story: {
    caption: string;
    mediaUrl?: string;
    userId: string;
  }) => {
    if (!accessToken) {
      toast.error("Please log in to save a story.");
      return;
    }

    try {
      const res = await axiosClient.post(
        "/api/stories",
        {
          caption: story.caption,
          content: {
            url: story.mediaUrl || "",
            mediaType: story.mediaUrl
              ? story.mediaUrl.includes("video")
                ? "video"
                : "image"
              : "text",
          },
          user: story.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.data?.story || typeof res.data.story !== "object") {
        throw new Error("Invalid response from server");
      }

      const newStory: StorySample = {
        _id: res.data.story._id,
        user: "You",
        caption: res.data.story.caption,
        profilePic: currentPic || "",
        content: {
          url: res.data.story.content.url,
          mediaType: res.data.story.content.mediaType,
        },
        expiresAt:
          res.data.story.expiresAt ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: res.data.story.createdAt || new Date().toISOString(),
        views: res.data.story.views || [],
        likes: res.data.story.likes || [],
      };

      setStories((prev) => {
        const filteredStories = prev.filter((s) => s._id !== newStory._id);
        return [newStory, ...filteredStories];
      });

      setShowCreateStory(false);
      toast.success("Story uploaded successfully!");

      setTimeout(() => {
        fetchStories();
      }, 500);
    } catch (err) {
      const errorObj = err as {
        message?: string;
        response?: { status?: number; data?: { message?: string } };
      };
      const errorMessage =
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Failed to upload story";
      toast.error(`Error: ${errorMessage}`);
      console.error("Save Story error: ", errorObj);
    }
  };

  const handleDeleteStory = async (storyToDelete: StorySample) => {
    if (!accessToken || !storyToDelete._id) {
      toast.error("Cannot delete story or invalid story ID.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this story?")) {
      try {
        const res = await axiosClient.delete(
          `/api/stories/${storyToDelete._id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!res.data?.success) {
          throw new Error("Delete request failed on server");
        }

        setStories((prev) => prev.filter((s) => s._id !== storyToDelete._id));

        if (selectedUserStories.some((s) => s._id === storyToDelete._id)) {
          const remainingStories = selectedUserStories.filter(
            (s) => s._id !== storyToDelete._id
          );
          if (remainingStories.length === 0) {
            closeSelectedStory();
          } else {
            setSelectedUserStories(remainingStories);
            setCurrentStoryIndex(0);
            setProgress(0);
          }
        }

        toast.success("Story deleted successfully!");
        setTimeout(() => fetchStories(), 500);
      } catch (err) {
        const errorObj = err as {
          message?: string;
          response?: { status?: number; data?: { message?: string } };
        };
        const errorMessage =
          errorObj.response?.data?.message ||
          errorObj.message ||
          "Failed to delete story";
        toast.error(`Error: ${errorMessage}`);
        console.error("Delete Story error: ", errorMessage);
      }
    }
  };

  const handleOpenCreateStory = () => {
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      toast.error("Please log in to create a story.");
      return;
    }
    setShowCreateStory(true);
  };

  const handleStoryClick = (story: StorySample) => {
    const userIndex = usersWithStories.findIndex(
      (user) => user.user === story.user
    );
    if (userIndex === -1) return;

    const storyIndex = usersWithStories[userIndex].stories.findIndex(
      (s) => s._id === story._id
    );

    setSelectedUserStories(usersWithStories[userIndex].stories);
    setCurrentStoryIndex(Math.max(0, storyIndex));
    setCurrentUserIndex(userIndex);
    setProgress(0);
  };

  const closeMyStories = () => setShowMyStories(false);

  const closeSelectedStory = useCallback(() => {
    setSelectedUserStories([]);
    setCurrentStoryIndex(0);
    setCurrentUserIndex(0);
    setProgress(0);
  }, []);

  const nextStory = useCallback(() => {
    if (currentStoryIndex < selectedUserStories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < usersWithStories.length - 1) {
      const nextUserIndex = currentUserIndex + 1;
      const nextUserStories = usersWithStories[nextUserIndex].stories;
      setSelectedUserStories(nextUserStories);
      setCurrentStoryIndex(0);
      setCurrentUserIndex(nextUserIndex);
      setProgress(0);
    } else {
      closeSelectedStory();
    }
  }, [
    currentStoryIndex,
    selectedUserStories,
    currentUserIndex,
    usersWithStories,
    closeSelectedStory,
  ]);

  const prevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      const prevUserIndex = currentUserIndex - 1;
      const prevUserStories = usersWithStories[prevUserIndex].stories;
      setSelectedUserStories(prevUserStories);
      setCurrentStoryIndex(prevUserStories.length - 1);
      setCurrentUserIndex(prevUserIndex);
      setProgress(0);
    }
  }, [currentStoryIndex, currentUserIndex, usersWithStories]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (selectedUserStories.length > 0 && progress < 100) {
      timer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100 / (5 * 100);
          if (newProgress >= 100) {
            clearInterval(timer);
            nextStory();
            return 0;
          }
          return newProgress;
        });
      }, 10);
    }

    return () => clearInterval(timer);
  }, [selectedUserStories, currentStoryIndex, progress, nextStory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedUserStories.length === 0) return;

      if (e.key === "ArrowRight") nextStory();
      else if (e.key === "ArrowLeft") prevStory();
      else if (e.key === "Escape") closeSelectedStory();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUserStories, nextStory, prevStory, closeSelectedStory]);

  const yourStories = stories
    .filter((s) => s.user === "You")
    .sort(
      (a, b) =>
        new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
    );

  const otherDbStories = stories
    .filter(
      (s) =>
        s.user !== "You" &&
        !storiesData.some((sample) => sample.user === s.user)
    )
    .sort(
      (a, b) =>
        new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
    );

  const sampleStories = stories
    .filter((s) => storiesData.some((sample) => sample.user === s.user))
    .sort(
      (a, b) =>
        new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
    );

  return (
    <div>
      <div className="mb-8">
        <Swiper
          spaceBetween={12}
          slidesPerView={"auto"}
          navigation
          pagination={{ clickable: true }}
          modules={[Navigation, Pagination]}
          className="story-swiper"
        >
          <SwiperSlide className="!w-[140px]">
            <div
              className="relative w-full h-[200px] overflow-hidden rounded-2xl border-2 border-[#611DD0] cursor-pointer hover:border-[#a679ee] transition-all duration-300 bg-gradient-to-br from-purple-100 to-white"
              onClick={handleOpenCreateStory}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-[#611DD0] flex items-center justify-center mb-3">
                  <span className="text-white text-2xl font-bold">+</span>
                </div>
                <span className="text-[#611DD0] font-semibold text-sm text-center">
                  Create Story
                </span>
              </div>
            </div>
          </SwiperSlide>

          {yourStories.length > 0 && (
            <SwiperSlide className="!w-[140px]">
              <div
                className="relative w-full h-[200px] overflow-hidden rounded-2xl border-2 border-[#611DD0] cursor-pointer hover:border-[#a679ee] transition-all duration-300"
                onClick={() => {
                  setSelectedUserStories(yourStories);
                  setCurrentStoryIndex(0);
                  setCurrentUserIndex(
                    usersWithStories.findIndex((u) => u.user === "You")
                  );
                  setProgress(0);
                }}
              >
                <img
                  src={yourStories[0].content.url || "default-story.jpg"}
                  alt="Your story"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentPic || "default-profile.png"}
                      alt="Your profile"
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                    <span className="text-white font-semibold text-sm">
                      You
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-white text-xs">
                    <FaClock size={10} />
                    <span>{formatTimeRemaining(yourStories[0].expiresAt)}</span>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          )}

          {[...otherDbStories, ...sampleStories].map((story, idx) => (
            <SwiperSlide
              key={`story-${story.user}-${idx}`}
              className="!w-[140px]"
            >
              <div
                className="relative w-full h-[200px] overflow-hidden rounded-2xl border-2 border-[#611DD0] cursor-pointer hover:border-[#a679ee] transition-all duration-300"
                onClick={() => handleStoryClick(story)}
              >
                <img
                  src={story.content.url || "default-story.jpg"}
                  alt={`${story.user}'s story`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={story.profilePic || "default-profile.png"}
                      alt={`${story.user}'s profile`}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                    <span className="text-white font-semibold text-sm">
                      {story.user}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-white text-xs">
                    <FaClock size={10} />
                    <span>{formatTimeRemaining(story.expiresAt)}</span>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {showMyStories && (
        <div className="fixed inset-0 bg-[#ffffff9b] bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative w-[500px] h-[400px] bg-white rounded-[20px] p-4 overflow-y-auto">
            <button
              onClick={closeMyStories}
              className="absolute top-4 right-4 text-[#611DD0] text-xl"
            >
              <FaWindowClose size={25} />
            </button>
            <h2 className="text-center text-[#611DD0] text-xl font-semibold mb-4">
              My Stories
            </h2>
            {yourStories.length > 0 ? (
              yourStories.map((story, idx) => (
                <div
                  key={idx}
                  className="mb-4 p-2 border border-gray-300 rounded relative"
                >
                  {story.content.mediaType === "image" ? (
                    <img
                      src={story.content.url}
                      alt={`My Story ${idx + 1}`}
                      className="w-full h-40 object-cover rounded"
                    />
                  ) : (
                    <video
                      src={story.content.url}
                      controls
                      className="w-full h-40 object-cover rounded"
                    />
                  )}
                  <p className="text-center mt-2">
                    {story.caption || "No caption"}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                    <span>Expires: {formatTimeRemaining(story.expiresAt)}</span>
                    <span>Posted: {formatTimeAgo(story.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteStory(story)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <FaTrash size={20} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center text-[#611DD0]">
                No stories created yet
              </div>
            )}
            <button
              onClick={() => {
                setShowMyStories(false);
                setShowCreateStory(true);
              }}
              className="mt-4 w-full py-2 bg-[#611DD0] text-white rounded"
            >
              Create New Story
            </button>
          </div>
        </div>
      )}

      {selectedUserStories.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-40">
            {selectedUserStories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    index === currentStoryIndex
                      ? "bg-white"
                      : index < currentStoryIndex
                      ? "bg-white"
                      : "bg-gray-400"
                  }`}
                  style={{
                    width:
                      index === currentStoryIndex
                        ? `${progress}%`
                        : index < currentStoryIndex
                        ? "100%"
                        : "0%",
                  }}
                ></div>
              </div>
            ))}
          </div>

          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex gap-1 z-40">
            {usersWithStories.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentUserIndex
                    ? "bg-white scale-125"
                    : index < currentUserIndex
                    ? "bg-white opacity-50"
                    : "bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={closeSelectedStory}
            className="absolute top-6 right-6 text-white text-xl z-50 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
          >
            <FaWindowClose size={25} />
          </button>

          {selectedUserStories[currentStoryIndex]?.user === "You" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteStory(selectedUserStories[currentStoryIndex]);
              }}
              className="absolute top-6 right-16 text-white text-xl z-50 bg-red-600 bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all"
            >
              <FaTrash size={20} />
            </button>
          )}

          <div
            className="absolute left-0 top-0 h-full w-1/3 z-30 cursor-pointer"
            onClick={prevStory}
          ></div>
          <div
            className="absolute right-0 top-0 h-full w-1/3 z-30 cursor-pointer"
            onClick={nextStory}
          ></div>

          <div className="relative w-full max-w-2xl h-full max-h-[90vh] flex items-center justify-center">
            <div className="w-full h-full bg-black flex items-center justify-center relative rounded-xl overflow-hidden">
              {selectedUserStories[currentStoryIndex].content.mediaType ===
              "image" ? (
                <img
                  src={selectedUserStories[currentStoryIndex].content.url}
                  alt="Story Content"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={selectedUserStories[currentStoryIndex].content.url}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-contain"
                />
              )}

              <div className="absolute top-20 left-4 text-white z-40">
                <div className="flex items-center gap-3 bg-black bg-opacity-50 rounded-full px-4 py-2 backdrop-blur-sm">
                  <img
                    src={
                      selectedUserStories[currentStoryIndex].profilePic ||
                      "default-profile.png"
                    }
                    alt={`${selectedUserStories[currentStoryIndex].user}'s profile`}
                    className="w-12 h-12 rounded-full border-2 border-white"
                  />
                  <div>
                    <div className="font-semibold text-lg">
                      {selectedUserStories[currentStoryIndex].user}
                    </div>
                    <div className="text-sm text-gray-300 flex items-center gap-2">
                      <span>
                        {currentStoryIndex + 1}/{selectedUserStories.length}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaClock size={12} />
                        {formatTimeRemaining(
                          selectedUserStories[currentStoryIndex].expiresAt
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        {formatTimeAgo(
                          selectedUserStories[currentStoryIndex].createdAt
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedUserStories[currentStoryIndex].caption && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-center z-40 max-w-4/5">
                  <div className="bg-black bg-opacity-50 rounded-2xl px-6 py-3 backdrop-blur-sm">
                    {selectedUserStories[currentStoryIndex].caption}
                  </div>
                </div>
              )}

              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-40">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentStory = selectedUserStories[currentStoryIndex];
                    const isLiked = currentStory.likes.includes(userId || "");
                    const updatedStory = {
                      ...currentStory,
                      likes: isLiked
                        ? currentStory.likes.filter((id) => id !== userId)
                        : [...currentStory.likes, userId || ""],
                    };
                    setSelectedUserStories((prev) =>
                      prev.map((s) =>
                        s._id === updatedStory._id ? updatedStory : s
                      )
                    );
                    setStories((prev) =>
                      prev.map((s) =>
                        s._id === updatedStory._id ? updatedStory : s
                      )
                    );
                  }}
                  className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                    selectedUserStories[currentStoryIndex].likes.includes(
                      userId || ""
                    )
                      ? "bg-blue-600 text-white"
                      : "bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                  }`}
                >
                  <FaThumbsUp size={24} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentStory = selectedUserStories[currentStoryIndex];
                    const hasViewed = currentStory.views.includes(userId || "");
                    if (!hasViewed) {
                      const updatedStory = {
                        ...currentStory,
                        views: [...currentStory.views, userId || ""],
                      };
                      setSelectedUserStories((prev) =>
                        prev.map((s) =>
                          s._id === updatedStory._id ? updatedStory : s
                        )
                      );
                      setStories((prev) =>
                        prev.map((s) =>
                          s._id === updatedStory._id ? updatedStory : s
                        )
                      );
                    }
                  }}
                  className="p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 backdrop-blur-sm transition-all"
                >
                  <FaEye size={24} />
                </button>
              </div>
            </div>

            {(currentUserIndex > 0 || currentStoryIndex > 0) && (
              <button
                onClick={prevStory}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-4 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all z-40"
              >
                <FaArrowLeft size={28} />
              </button>
            )}

            {(currentUserIndex < usersWithStories.length - 1 ||
              currentStoryIndex < selectedUserStories.length - 1) && (
              <button
                onClick={nextStory}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-4 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all z-40"
              >
                <FaArrowRight size={28} />
              </button>
            )}
          </div>
        </div>
      )}

      {showCreateStory && userId && /^[0-9a-fA-F]{24}$/.test(userId) && (
        <CreateStory
          onClose={() => setShowCreateStory(false)}
          onSave={handleSaveStory}
          userId={userId}
        />
      )}
    </div>
  );
};

export default Story;
