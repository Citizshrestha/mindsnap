import { useState, useEffect } from "react";
import storiesData, { type StorySample } from "../../data/storySample";
import CreateStory from "./CreateStory"; 
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store"; 
import { setProfilePicture } from "../../redux/slices/userSlice"; 

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
  const dispatch = useDispatch();

  const { profilePicture: currentPic } = useSelector((state: RootState) => state.user);
  const userId = localStorage.getItem("userId"); // Or from Redux if stored

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const data = res.data || {};
        
        if (data.profilePicture) {
          dispatch(setProfilePicture(data.profilePicture));
        }
        
      } catch (err: unknown) {
        const errorObj = err as {
          message?: string;
          response?: { status?: number; data?: unknown };
        };
        console.error("Fetch Profile error: ", {
          message: errorObj?.message,
          status: errorObj?.response?.status,
          data: errorObj?.response?.data,
        });
        toast.error("Failed to load profile data");
      }
    };
    
    if (!currentPic) {
      fetchProfile();
    }
  }, [dispatch, currentPic]);

  const handleSaveStory = (story: { caption: string; mediaUrl?: string; userId: string }) => {
    console.log("New story saved:", story);

    // Immediately add the new story to the state
    const newStory: StorySample = {
      user: "You", // Placeholder, replace with actual username if available from API
      profilePic: currentPic || "",
      content: story.mediaUrl || "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      views: [],
      likes: [],
    };
    setStories((prevStories) => [newStory, ...prevStories.filter(s => s.user !== "You" || s.content !== newStory.content)]);

    // Refresh stories from API to sync with backend
    fetchStories();
    setShowCreateStory(false);
  };

  const fetchStories = async () => {
    try {
      const res = await axiosClient.get("/api/stories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const storiesData = res.data.stories;
      if (Array.isArray(storiesData)) {
        const fetchedStories = storiesData.map((story) => ({
          user: story.user?.username || "Unknown User",
          profilePic: story.user?.profilePicture || "",
          content: story.content || "",
          expiresAt: story.expiresAt,
          views: story.views || [],
          likes: story.likes || [],
        }));
        setStories(fetchedStories);
      } else {
        console.error("Unexpected response format:", res.data);
        setStories([]);
        toast.error("Failed to load stories due to invalid response format");
      }
    } catch (err) {
      console.error("Fetch Stories error:", err);
      toast.error("Failed to load stories");
    }
  };

  const handleOpenCreateStory = () => {
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      toast.error("Please log in to create a story.");
      return;
    }
    setShowCreateStory(true);
  };

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
          {stories.filter(story => story.user === "You").length === 0 && (
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
                <div className={`w-full h-full flex items-center justify-center `}>
                  <span className={`text-4xl ${currentPic ? "text-white" : "text-[#611DD0]"}`}>+</span>
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold">
                  Add Story
                </div>
              </div>
            </SwiperSlide>
          )}

          {stories.map((story, idx) => (
            <SwiperSlide key={`${story.user}-${idx}`}>
              <div className="stories relative w-[170px] h-[190px] overflow-hidden rounded-[20px] border-2 border-[#611DD0] hover:border-[#a679ee] transition-colors">
                <img
                  src={story.profilePic || story.content}
                  alt={`Story ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">
                  {story.user}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

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