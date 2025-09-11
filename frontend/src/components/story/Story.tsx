import { useState, useEffect, useCallback } from "react";
import storiesData, { type StorySample } from "../../data/storySample";
import CreateStory from "./CreateStory"; 
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store"; 
import { setProfilePicture } from "../../redux/slices/userSlice"; 
import { FaWindowClose, FaTrash, FaArrowLeft, FaArrowRight, FaThumbsUp, FaEye } from "react-icons/fa";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

const Story = () => {
  const [stories, setStories] = useState<StorySample[]>(storiesData);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showMyStories, setShowMyStories] = useState(false); 
  const [selectedUserStories, setSelectedUserStories] = useState<StorySample[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const dispatch = useDispatch();

  const { profilePicture: currentPic } = useSelector((state: RootState) => state.user);
  const userId = localStorage.getItem("userId");
  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    const storedYouStories = localStorage.getItem("youStories");
    if (storedYouStories) {
      interface StoryType {
        user: string;
        caption: string;
        profilePic: string;
        content: string;
        expiresAt: string;
        views: string[];
        likes: string[];
      }
      const parsedStoriesTyped: StoryType[] = JSON.parse(storedYouStories);
      setStories(prev => [...parsedStoriesTyped.filter(s => s.user === "You").sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()), ...prev.filter(s => s.user !== "You")]);
    }

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
          response?: { status?: number; data?: unknown };
        };
        if (errorObj.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else {
          console.error("Fetch Profile error: ", errorObj);
          toast.error("Failed to load profile data");
        }
      }
    };
    
    if (!currentPic) {
      fetchProfile();
    }
  }, [dispatch, currentPic, accessToken]);

  const handleSaveStory = (story: { caption: string; mediaUrl?: string; userId: string }) => {
    const newStory: StorySample = {
      user: "You",
      caption: story.caption,
      profilePic: currentPic || "",
      content: story.mediaUrl || "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      views: [],
      likes: [],
    };
    setStories(prev => {
      const updatedStories = [newStory, ...prev.filter(s => s.user !== "You" || s.content !== newStory.content)].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
      localStorage.setItem("youStories", JSON.stringify(updatedStories.filter(s => s.user === "You")));
      return updatedStories;
    });
    setSelectedUserStories([newStory]);
    setCurrentStoryIndex(0);
    setProgress(0);
    fetchStories();
    setShowCreateStory(false);
  };

  const fetchStories = async () => {
    if (!accessToken) {
      toast.error("Please log in to load stories.");
      return;
    }

    try {
      const res = await axiosClient.get("/api/stories", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const storiesData = res.data.stories;
      if (Array.isArray(storiesData)) {
        const fetchedStories = storiesData.map((story) => ({
          user: story.user?.username || "Unknown User",
          caption: story.caption || "",
          profilePic: story.user?.profilePicture || "",
          content: story.content || "",
          expiresAt: story.expiresAt,
          views: story.views || [],
          likes: story.likes || [],
        }));
        setStories(prev => {
          const currentYouStory = prev.find(s => s.user === "You");
          const otherStories = [...new Map([...fetchedStories, ...prev.filter(s => s.user !== "You")].map(s => [s.content, s])).values()];
          const updatedStories = currentYouStory ? [currentYouStory, ...otherStories].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()) : otherStories;
          localStorage.setItem("youStories", JSON.stringify(updatedStories.filter(s => s.user === "You")));
          return updatedStories;
        });
      } else {
        console.error("Unexpected response format:", res.data);
        setStories([]);
        toast.error("Failed to load stories due to invalid response format");
      }
    } catch (err) {
      const errorObj = err as {
        message?: string;
        response?: { status?: number; data?: unknown };
      };
      if (errorObj.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        console.error("Fetch Stories error: ", errorObj);
        toast.error("Failed to load stories");
      }
    }
  };

  const handleDeleteStory = async (storyToDelete: StorySample) => {
    if (!accessToken) {
      toast.error("Please log in to delete a story.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this story?")) {
      try {
        await axiosClient.delete(`/api/stories/${storyToDelete.content}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setStories(prev => {
          const updatedStories = prev.filter(s => s.content !== storyToDelete.content).sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
          localStorage.setItem("youStories", JSON.stringify(updatedStories.filter(s => s.user === "You")));
          return updatedStories;
        });
        if (selectedUserStories.some(s => s.content === storyToDelete.content)) {
          const newIndex = Math.max(0, currentStoryIndex - 1);
          setSelectedUserStories(prev => prev.filter(s => s.content !== storyToDelete.content));
          setCurrentStoryIndex(newIndex);
          setProgress(0);
          if (newIndex >= selectedUserStories.length - 1) setSelectedUserStories([]);
        }
        toast.success("Story deleted successfully!");
      } catch (err) {
        const errorObj = err as {
          message?: string;
          response?: { status?: number; data?: unknown };
        };
        console.error("Delete Story error: ", errorObj);
        toast.error("Failed to delete story");
      }
    }
  };

  const handleOpenCreateStory = () => {
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      toast.error("Please log in to create a story.");
      return;
    }
    setShowMyStories(true);
  };

  const handleStoryClick = (story: StorySample) => {
    const userStories = stories.filter(s => s.user === story.user).sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    setSelectedUserStories(userStories);
    setCurrentStoryIndex(userStories.findIndex(s => s.content === story.content));
    setProgress(0);
  };

  const closeMyStories = () => setShowMyStories(false);
  const closeSelectedStory = useCallback(() => {
    setSelectedUserStories([]);
    setCurrentStoryIndex(0);
    setProgress(0);
  }, []);

  const nextStory = useCallback(() => {
    if (currentStoryIndex < selectedUserStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      closeSelectedStory();
    }
  }, [currentStoryIndex, selectedUserStories, closeSelectedStory]);

  const prevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentStoryIndex]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedUserStories.length > 0 && progress < 100) {
      timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (5 * 100));
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

  return (
    <div>
      <div className="mb-8">
        <Swiper
          spaceBetween={20}
          slidesPerView={4.5}
          navigation
          pagination={{ clickable: true }}
          modules={[Navigation, Pagination]}
          className="my-4"
          breakpoints={{
            640: { slidesPerView: 3.5 },
            768: { slidesPerView: 4.5 },
          }}
        >
          <SwiperSlide>
            <div
              className="stories relative w-[170px] h-[190px] overflow-hidden rounded-[20px] border-2 border-[#611DD0] cursor-pointer hover:border-[#a679ee] transition-colors"
              onClick={handleOpenCreateStory}
              style={{
                backgroundImage: currentPic ? `url("${currentPic}")` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className={`w-full h-full flex items-center justify-center`}>
                <span className={`text-4xl ${currentPic ? "text-white" : "text-[#611DD0]"}`}>+</span>
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold">
                Add Story
              </div>
            </div>
          </SwiperSlide>
          {stories.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()).map((story, idx) => (
            <SwiperSlide key={`${story.user}-${idx}`}>
              {story.user === "You" ? (
                <div
                  className="stories relative w-[170px] h-[190px] overflow-hidden rounded-[20px] border-2 border-[#611DD0] cursor-pointer hover:border-[#a679ee] transition-colors"
                  onClick={() => handleStoryClick(story)}
                >
                  <img
                    src={story.content}
                    alt={`My Story ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">
                    {story.user}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStory(story); }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <FaTrash size={20} />
                  </button>
                </div>
              ) : (
                <div
                  className="stories relative w-[170px] h-[190px] overflow-hidden rounded-[20px] border-2 border-[#611DD0] hover:border-[#a679ee] transition-colors cursor-pointer"
                  onClick={() => handleStoryClick(story)}
                >
                  <img
                    src={story.profilePic || story.content}
                    alt={`Story ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">
                    {story.user}
                  </div>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {showMyStories && (
        <div className="fixed inset-0 bg-[#ffffff9b] bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative w-[500px] h-[400px] bg-white rounded-[20px] p-4 overflow-y-auto">
            <button onClick={closeMyStories} className="absolute top-4 right-4 text-[#611DD0] text-xl">
              <FaWindowClose size={25} />
            </button>
            <h2 className="text-center text-[#611DD0] text-xl font-semibold mb-4">My Stories</h2>
            {stories.filter(story => story.user === "You").sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()).map((story, idx) => (
              <div key={idx} className="mb-4 p-2 border border-gray-300 rounded relative">
                <img src={story.content} alt={`My Story ${idx + 1}`} className="w-full h-40 object-cover rounded" />
                <p className="text-center mt-2">{story.caption || "No caption"}</p>
                <button
                  onClick={() => handleDeleteStory(story)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <FaTrash size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={() => { setShowMyStories(false); setShowCreateStory(true); }}
              className="mt-4 w-full py-2 bg-[#611DD0] text-white rounded"
            >
              Create New Story
            </button>
          </div>
        </div>
      )}

      {selectedUserStories.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            <button onClick={closeSelectedStory} className="absolute top-4 right-4 text-white text-xl">
              <FaWindowClose size={25} />
            </button>
            <div className="w-full h-2 bg-gray-200 absolute top-0 left-0">
              <div
                className="h-full bg-[#611DD0] transition-all duration-100"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className=" w-[500px] h-[600px] bg-black flex items-center justify-center">
              <img
                src={selectedUserStories[currentStoryIndex].content}
                alt="Story Content"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute top-15 left-35 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                <div className="flex items-center gap-2 ">
                   <img
                  src={selectedUserStories[currentStoryIndex].profilePic || "default-profile.png"}
                  alt={`${selectedUserStories[currentStoryIndex].user}'s profile`}
                  className="w-16 h-16 rounded-full mx-auto mb-2"
                />
              
                  <div className="font-semibold text-xl">{selectedUserStories[currentStoryIndex].user}</div>
                <div className="text-sm text-gray-400">22 hours</div>
                </div>
              </div>
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold">
                {selectedUserStories[currentStoryIndex].caption || "No caption"}
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={() => {
                    const updatedStory = { ...selectedUserStories[currentStoryIndex], likes: [...selectedUserStories[currentStoryIndex].likes, userId || ""] };
                    setSelectedUserStories(prev => prev.map(s => s.content === updatedStory.content ? updatedStory : s));
                    setStories(prev => prev.map(s => s.content === updatedStory.content ? updatedStory : s));
                  }}
                  className="text-white hover:text-gray-300"
                >
                  <FaThumbsUp size={24} />
                </button>
                <button
                  onClick={() => {
                    const updatedStory = { ...selectedUserStories[currentStoryIndex], views: [...selectedUserStories[currentStoryIndex].views, userId || ""] };
                    setSelectedUserStories(prev => prev.map(s => s.content === updatedStory.content ? updatedStory : s));
                    setStories(prev => prev.map(s => s.content === updatedStory.content ? updatedStory : s));
                  }}
                  className="text-white hover:text-gray-300"
                >
                  <FaEye size={24} />
                </button>
              </div>
            </div>
            <button
              onClick={prevStory}
              className={`absolute left-4 text-white ${currentStoryIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:text-gray-300"}`}
              disabled={currentStoryIndex === 0}
            >
              <FaArrowLeft size={20} />
            </button>
            <button
              onClick={nextStory}
              className={`absolute right-4 text-white ${currentStoryIndex === selectedUserStories.length - 1 ? "opacity-50 cursor-not-allowed" : "hover:text-gray-300"}`}
              disabled={currentStoryIndex === selectedUserStories.length - 1}
            >
              <FaArrowRight size={20} />
            </button>
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