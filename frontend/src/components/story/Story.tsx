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
        
        // Dispatch profile picture to Redux store
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
    
    // Only fetch profile if we don't have it already
    if (!currentPic) {
      fetchProfile();
    }
  }, [dispatch, currentPic]);

  const handleSaveStory = (story: { caption: string; mediaUrl?: string }) => {
    console.log("New story saved:", story);

    // Refresh stories from API to include the new one
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
      // Map API response to StorySample format
      const fetchedStories = res.data.map((story: any) => ({
        user: story.user.name, // Assuming user is populated
        profilePic: story.user.profilePicture,
        content: story.content, // If mediaUrl is stored here
        expiresAt: story.expiresAt,
        views: story.views,
        likes: story.likes,
      }));
      setStories(fetchedStories);
    } catch (err) {
      console.error("Fetch Stories error:", err);
      toast.error("Failed to load stories");
    }
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
          {/* Add Story */}
          <SwiperSlide>
            <div
              className="stories relative w-[170px] h-[190px] overflow-hidden rounded-[20px] border-2 border-[#611DD0] cursor-pointer hover:border-[#a679ee] transition-colors"
              onClick={() => setShowCreateStory(true)}
              style={{
                backgroundImage: currentPic ? `url("${currentPic}")` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Overlay with plus sign */}
              <div className={`w-full h-full flex items-center justify-center `}>
                <span className={`text-4xl ${currentPic ? "text-white" : "text-[#611DD0]"}`}>+</span>
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold">
                Add Story
              </div>
            </div>
          </SwiperSlide>

          {/* Stories */}
          {stories.map((story, idx) => (
            <SwiperSlide key={`${story.user}-${idx}`}>
              <div className="stories relative w-[170px] h-[190px] overflow-hidden rounded-[20px] border-2 border-[#611DD0] hover:border-[#a679ee] transition-colors">
                <img
                  src={story.content} // Assuming content is the media URL
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

      {showCreateStory && (
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