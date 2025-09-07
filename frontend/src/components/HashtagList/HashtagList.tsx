// src/components/HashtagList.tsx
import { useEffect, useState } from "react";
import { FaFire } from "react-icons/fa";
import { hashtagsData } from "../../data/hashtags";

const HashtagList = () => {
  const [hashtags, setHashtags] = useState<{ id: number; tag: string; postCount: number }[]>([]);

  useEffect(() => {
    // Simulate fetching hashtags (replace with API call if needed)
    setHashtags(hashtagsData);
  }, []);

  const handleHashtagClick = (tag: string) => {
    console.log(`Hashtag clicked: ${tag}`);
    // Add navigation or filtering logic here if needed
  };

  return (
    <div className="bg-[#582f9a] scrollbar-hide h-[calc(100vh-80px)] overflow-y-auto w-[300px] mt-25 p-4 rounded-2xl shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <FaFire className="text-red-500" size={20} />
        <h1 className="text-xl font-bold text-white">Trending</h1>
      </div>
      <div className="space-y-3">
        {hashtags.map((hashtag) => (
          <div key={hashtag.id} className="flex flex-col bg-white p-3 rounded-lg shadow-md">
            <button
              onClick={() => handleHashtagClick(hashtag.tag)}
              className="flex items-center justify-between w-full text-gray-700 hover:bg-gray-100 rounded-md px-2 py-1 text-sm font-medium text-left transition-colors duration-200"
            >
              <span className="text-blue-600 font-semibold">{hashtag.tag}</span>
            </button>
            <span className="text-gray-500 text-xs mt-1 ml-1">{hashtag.postCount} posts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HashtagList;