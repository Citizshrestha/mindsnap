import { useState, useEffect, useCallback } from "react";
import ReactPlayer from "react-player";
import { dailyMotivations } from "./dailyMotivations";
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

  const userId = "user1"; // Replace with auth user ID if needed
  const storageKey = `moodMakerData_${userId}`;

  /** Select new items randomly */
  const selectNewItems = useCallback(() => {
    let newMotivation, newJoy, newSong;
    const lastData = localStorage.getItem(storageKey);
    const existing = lastData ? JSON.parse(lastData) : {};

    do {
      newMotivation =
        dailyMotivations[Math.floor(Math.random() * dailyMotivations.length)];
    } while (existing.lastMotivation === newMotivation);

    do {
      newJoy = joyTasks[Math.floor(Math.random() * joyTasks.length)];
    } while (existing.lastJoy === newJoy);

    do {
      const moods: Array<keyof typeof moodSongs> = ["happy", "sad", "angry"];
      const mood = moods[Math.floor(Math.random() * moods.length)];
      newSong =
        moodSongs[mood][Math.floor(Math.random() * moodSongs[mood].length)];
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
  }, [storageKey]);

  /** Load saved or select new on mount */
  useEffect(() => {
    const lastData = localStorage.getItem(storageKey);
    const now = new Date().getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (lastData) {
      const { lastMotivation, lastJoy, lastSong, lastUpdate } =
        JSON.parse(lastData);
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

  /** Mood select → show recommendation */
  const handleMoodSelect = (mood: "happy" | "sad" | "angry") => {
    const recommended =
      moodSongs[mood][Math.floor(Math.random() * moodSongs[mood].length)];
    setRecommendedSong(recommended);
    setShowRecommendation(true);
  };

  /** Accept/Cancel recommendation */
  const handleRecommendationAction = (action: "play" | "cancel") => {
    if (action === "play" && recommendedSong) {
      handlePlayPause(recommendedSong);
    }
    setShowRecommendation(false);
    setRecommendedSong(null);
  };

  /** Play/Pause song */
  const handlePlayPause = (song: Song) => {
    if (currentSong?.title === song.title) {
      setIsPlaying(!isPlaying); // toggle
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  /** Animation styles for emojis */
  const animationStyle =
    "transition-all duration-300 ease-in-out transform hover:scale-105";

  return (
    <div className="mood-maker w-[320px] mr-5">
      {/* Daily Motivation - Hidden when music is playing */}
      {!isPlaying && (
        <div className="p-4 bg-white rounded-2xl shadow">
          <h3 className="text-xl font-semibold text-black mb-2">
            💡 Daily Motivation
          </h3>
          <p className="text-gray-600 italic">{dailyMotivation}</p>
        </div>
      )}

      {/* Mood Booster */}
      <div className="mt-5 p-4 bg-white rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-pink-600 mb-2">
          Mood Booster
        </h3>
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
              Your today's chill music is "{recommendedSong.title}". Want to
              listen?
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

        <p className="text-gray-600 mt-2 italic">
          "It's okay to pause. Breathe. Reset."
        </p>
      </div>

      {/* Little Joy */}
      {!isPlaying && <div className="mt-5 p-4 bg-white rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-green-600 mb-2">
          Little Joy of the Day
        </h3>
        <ul className="text-gray-600 list-disc pl-5">
          <li>{littleJoy}</li>
        </ul>
      </div>}

      {/* Chill Music - Fixed scrollable container */}
      <div className="mt-4 bg-white rounded-2xl shadow text-center overflow-hidden flex flex-col max-h-[500px]">
        <div className="p-4 overflow-y-auto flex-grow">
          <h3 className="text-xl font-semibold text-purple-600 mb-2 sticky top-0 bg-white py-2 z-10">
            🎧 Chill Corner
          </h3>

          {currentSong && (
            <>
              <p className="text-gray-600 mb-2">
                {currentSong.title}
              </p>
              {isPlaying && <span className="ml-2 text-purple-600">▶ Playing</span>}

              {/* ReactPlayer for YouTube or MP3 */}
              <div className="mt-2">
                <ReactPlayer
                  src={currentSong.url}
                  playing={isPlaying}
                  controls={true}
                  volume={volume}
                  width="100%"
                  height="50px"
                />
              </div>

              <button
                onClick={() => handlePlayPause(currentSong)}
                className="mt-1 bg-purple-600 text-white px-4 py-2 rounded-full"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </>
          )}

          {/* Volume Control - Now properly visible */}
          <div className="mt-2 pb-2">
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
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodMaker;