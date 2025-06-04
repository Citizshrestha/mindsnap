import {useState, useEffect, useRef } from "react";
import "./userProfile.css";
import axiosClient from "../../api/axiosClient";
import { useSelector, useDispatch } from "react-redux";
import { setUsername, setProfilePicture } from "../../redux/slices/userSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import { useNavigate } from "react-router-dom";

const UserProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profilePicture, username } = useSelector((state: RootState) => state.user);
  const [fullname, setFullname] = useState("");
  const [error, setError] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [vibe, setVibe] = useState("");
  const [vibeDescription, setVibeDescription] = useState("");
  const [postsCount, setPostsCount] = useState(0);
  const [currentSong, setCurrentSong] = useState<{ title: string; url: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); 
  const audioRef = useRef<HTMLAudioElement>(null);
  const navigate = useNavigate();

  const loFiSongs = [
    { title: "Evening Flow - LoFi Chill Mix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { title: "Rainy Day Vibes", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { title: "Cozy Cafe Ambience", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No token Available");
          return;
        }

        const response = await axiosClient.get("/api/users/profile");
        setFullname(response.data.fullname || "");
        if (response.data.username) dispatch(setUsername(response.data.username));
        if (response.data.profilePicture) dispatch(setProfilePicture(response.data.profilePicture));
        setAboutMe(response.data.aboutMe || "");
        setVibe(response.data.vibe || "");
        setVibeDescription(response.data.vibeDescription || "");
        setPostsCount(response.data.postsCount || 0);
      } catch (err) {
        setError(`Some error fetching the data ${err}`);
      }
    };
    fetchUserProfile();
  }, [dispatch]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

const handlePlayPause = (song: { title: string; url: string }) => {
    if (currentSong?.title === song.title && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

  if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      setCurrentSong(song);
      setIsPlaying(true);
      audioRef.current.src = song.url;
      audioRef.current.load();

      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.volume = volume;
        })
        .catch((err) => {
          console.error("Error playing audio:", err);
          setError("Failed to play audio. Check browser permissions or URL.");
          setIsPlaying(false);
        });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  const handleEditProfile = () => {
     navigate('/edit-userprofile');
  }

  if (error) {
    return <div>{error}</div>;
  }


  return (
    <div className="flex mt-18 items-center text-left relative">
      <div className="ml-[95px] mt-10 w-[75%] p-5 bg-white rounded-2xl text-inherit font-poppins overflow-y-auto h-[calc(100vh-80px)] scrollbar-hide">
        <div className="flex items-center mb-6">
          <img
            src={profilePicture}
            alt="profilePic"
            className="w-40 h-40 rounded-full mr-6 object-cover"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.src = "/images/default.jpg")}
          />
          <div className="flex flex-col">
            <h1 className="text-3xl font-semibold">{fullname}</h1>
            <p className="text-gray-700 text-[14px] tracking-wider">@{username}</p>
            <button 
            onClick={handleEditProfile}
            className="mt-2 rounded-xl text-[15px] mr-10 bg-[#611DD0] text-white px-4 w-[10rem] py-2 font-medium">
              Edit Profile
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 p-3 rounded-lg text-center  bg-gradient-to-r from-pink-500 to-[#9D55FF] text-white">
            <h2 className="text-xl font-semibold">{postsCount}</h2>
            <p className="text-sm">Posts</p>
          </div>
          <div className="flex-1 p-3 rounded-lg text-center bg-gradient-to-r from-blue-400 to-[#008596] text-white">
            <h2 className="text-xl font-semibold">5,372</h2>
            <p className="text-sm">Followers</p>
          </div>
          <div className="flex-1 p-3 rounded-lg text-center bg-gradient-to-r from-teal-400 to-[#06c56c] text-white">
            <h2 className="text-xl font-semibold">842</h2>
            <p className="text-sm">Following</p>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h3 className="text-[21px] font-semibold mb-2 text-[#6B46C1] highlight-haven-title">
            Highlight Haven
          </h3>
          <p className="text-sm mb-4 text-[#A0AEC0]">Showcase Your Stories</p>
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
            <button className="mt-2 font-['montserrat'] bg-[#582BBB] text-white px-4 py-2 rounded-full">
              <i>
                <b>{vibe}</b>
              </i>
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-[1.1rem] text-[#1438A6] font-semibold">About Me</h3>
            <p className="text-gray-900">{aboutMe}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <h3 className="text-xl font-semibold">333 Vibes ✨</h3>
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
      <div className="mood-maker w-[10%] mr-5 absolute right-10 top-12">
        <div className="daily-motivation ml-2 w-[320px] p-4 bg-white rounded-2xl shadow">
          <h3 className="text-xl font-semibold text-black mb-2">💡Daily Motivation</h3>
          <p className="text-gray-600 italic">"You don’t have to be extreme, just consistent."</p>
          <p className="text-gray-500 ml-10 pl-40 mt-1">-Unknown</p>
        </div>
        <div className="mood-booster ml-2 w-[320px] mt-5 p-4 bg-white rounded-2xl shadow">
          <h3 className="text-xl font-semibold text-pink-600 mb-2">Mood Booster</h3>
          <p className="text-gray-600">How are you feeling today?</p>
          <div className="flex justify-around mt-2">
            <span>😊</span>
            <span>😐</span>
            <span>😢</span>
          </div>
          <p className="text-gray-600 mt-2 italic">"It’s okay to pause. Breathe. Reset."</p>
        </div>
        <div className="taskRecommendation w-[320px] ml-2 mt-5 p-4 bg-white rounded-2xl shadow">
          <h3 className="text-xl font-semibold text-green-600 mb-2">Little Joy of the Day</h3>
          <ul className="text-gray-600 list-disc pl-5">
            <li>Compliment someone today.</li>
            <li>Go outside and feel the sun.</li>
          </ul>
        </div>
        <div className="chill-corner text-center ml-2 p-4 w-[320px] bg-white mt-5 rounded-2xl shadow">
          <h3 className="text-xl font-semibold text-purple-600 mb-2">🎧Chill Corner</h3>
          {loFiSongs.map((song, index) => (
            <div key={index} className="mb-2">
              <p className="text-gray-600">
                {song.title}
                {currentSong?.title === song.title && isPlaying && (
                  <span className="ml-2 text-purple-600">▶ Playing</span>
                )}
              </p>
              <button
                onClick={() => handlePlayPause(song)}
                className="mt-1 bg-purple-600 text-white px-4 py-2 rounded-full"
              >
                {currentSong?.title === song.title && isPlaying ? "Pause" : "Play"}
              </button>
            </div>
          ))}
          <div className="mt-4">
            <label htmlFor="volume" className="text-gray-600 mr-2">
              Volume:
            </label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full"
            />
          </div>
          <audio ref={audioRef} />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;