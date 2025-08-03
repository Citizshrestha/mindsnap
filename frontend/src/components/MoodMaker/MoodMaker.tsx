import { useRef, useState, useEffect, useCallback } from "react"; // Added useCallback import
import { dailyMotivations } from "./dailyMotivations"; // Fixed typo in import
import { joyTasks } from "./joyTasks";
import { moodSongs } from "./moodBasedSongs";

interface Song {
  title: string;
  url: string;
}

const MoodMaker: React.FC = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [recommendedSong, setRecommendedSong] = useState<Song | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [dailyMotivation, setDailyMotivation] = useState<string>("");
  const [littleJoy, setLittleJoy] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const userId = "user1"; // Replace with dynamic user ID from auth context if available
  const storageKey = `moodMakerData_${userId}`;

  // Select new items with random selection
  const selectNewItems = useCallback(() => {
    let newMotivation, newJoy, newSong;
    const lastData = localStorage.getItem(storageKey);
    const existing = lastData ? JSON.parse(lastData) : {};

    do {
      newMotivation = dailyMotivations[Math.floor(Math.random() * dailyMotivations.length)];
    } while (existing.lastMotivation === newMotivation);

    do {
      newJoy = joyTasks[Math.floor(Math.random() * joyTasks.length)];
    } while (existing.lastJoy === newJoy);

    do {
      const moods: Array<keyof typeof moodSongs> = ["happy", "sad", "angry"];
      const mood = moods[Math.floor(Math.random() * moods.length)];
      newSong = moodSongs[mood][Math.floor(Math.random() * 100)];
    } while (existing.lastSong?.title === newSong.title);

    setDailyMotivation(newMotivation);
    setLittleJoy(newJoy);
    setRecommendedSong(newSong);

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        lastMotivation: newMotivation,
        lastJoy: newJoy,
        lastSong: newSong,
        lastUpdate: new Date().getTime(),
      })
    );
  }, [storageKey]); // Dependency on storageKey ensures re-run if userId changes

  // Load or initialize last selected items from localStorage
  useEffect(() => {
    const lastData = localStorage.getItem(storageKey);
    const now = new Date().getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

    if (lastData) {
      const { lastMotivation, lastJoy, lastSong, lastUpdate } = JSON.parse(lastData);
      if (now - lastUpdate < oneWeek) {
        setDailyMotivation(lastMotivation);
        setLittleJoy(lastJoy);
        setRecommendedSong(lastSong);
      } else {
        selectNewItems();
      }
    } else {
      selectNewItems();
    }
  }, [storageKey, selectNewItems]);

  // Handle mood selection with animation
  const handleMoodSelect = (mood: "happy" | "sad" | "angry") => {
    const recommended = moodSongs[mood][Math.floor(Math.random() * 100)];
    setRecommendedSong(recommended);
    setShowRecommendation(true);
  };

  // Handle play/cancel recommendation
  const handleRecommendationAction = (action: "play" | "cancel") => {
    if (action === "play" && recommendedSong) {
      handlePlayPause(recommendedSong);
    }
    setShowRecommendation(false);
    setRecommendedSong(null);
  };

  const handlePlayPause = (song: Song) => {
    if (currentSong?.title === song.title && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
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
        .catch(() => {
          setIsPlaying(false);
        });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume;
  };

  // Animation styles
  const animationStyle = "transition-all duration-300 ease-in-out transform hover:scale-105";

  return (
    <div className="mood-maker w-[320px] mr-5">
      {/* Daily Motivation */}
      <div className="p-4 bg-white rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-black mb-2">💡 Daily Motivation</h3>
        <p className="text-gray-600 italic">{dailyMotivation}</p>
      </div>

      {/* Mood Booster */}
      <div className="mt-5 p-4 bg-white rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-pink-600 mb-2">Mood Booster</h3>
        <p className="text-gray-600">How are you feeling today?</p>
        <div className="flex justify-around mt-2 text-2xl">
          <span
            className={`${animationStyle} cursor-pointer`}
            onClick={() => handleMoodSelect("happy")}
          >
            😊
          </span>
          <span
            className={`${animationStyle} cursor-pointer`}
            onClick={() => handleMoodSelect("sad")}
          >
            😢
          </span>
          <span
            className={`${animationStyle} cursor-pointer`}
            onClick={() => handleMoodSelect("angry")}
          >
            😡
          </span>
        </div>
        {showRecommendation && recommendedSong && (
          <div className="mt-2 p-2 bg-purple-100 rounded-lg text-center animate-fadeIn">
            <p className="text-purple-600">
              Your today's chill music is "{recommendedSong.title}". Want to listen?
            </p>
            <div className="mt-2">
              <button
                onClick={() => handleRecommendationAction("play")}
                className="bg-purple-600 text-white px-3 py-1 rounded-full mr-2"
              >
                Yes
              </button>
              <button
                onClick={() => handleRecommendationAction("cancel")}
                className="bg-gray-300 text-black px-3 py-1 rounded-full"
              >
                No
              </button>
            </div>
          </div>
        )}
        <p className="text-gray-600 mt-2 italic">"It’s okay to pause. Breathe. Reset."</p>
      </div>

      {/* Little Joy */}
      <div className="mt-5 p-4 bg-white rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-green-600 mb-2">Little Joy of the Day</h3>
        <ul className="text-gray-600 list-disc pl-5">
          <li>{littleJoy}</li>
        </ul>
      </div>

      {/* Chill Music */}
      <div className="mt-5 p-4 bg-white rounded-2xl shadow text-center">
        <h3 className="text-xl font-semibold text-purple-600 mb-2">🎧 Chill Corner</h3>
        {currentSong && (
          <div className="mb-2">
            <p className="text-gray-600">
              {currentSong.title}
              {isPlaying && <span className="ml-2 text-purple-600">▶ Playing</span>}
            </p>
            <button
              onClick={() => handlePlayPause(currentSong)}
              className="mt-1 bg-purple-600 text-white px-4 py-2 rounded-full"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
          </div>
        )}

        {/* Volume Control */}
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
  );
};

export default MoodMaker;