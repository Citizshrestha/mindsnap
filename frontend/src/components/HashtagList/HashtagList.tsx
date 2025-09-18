// src/components/HashtagList.tsx
import { useEffect, useState } from "react";
import { FaFire, FaTimes, FaExclamationTriangle } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
import { hashtagsData as fallbackHashtagsData } from "../../data/hashtags";

// Unified interface that works with both backend and fallback data
interface Hashtag {
  _id: string;
  name: string;
  posts: string[];
  postCount: number;
}

interface Post {
  _id: string;
  content: string;
  user: {
    username: string;
    profilePicture: string;
  };
  createdAt: string;
}

const HashtagList = () => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const navigate = useNavigate();
  const [hashtagPosts, setHashtagPosts] = useState<Post[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'failing'>('unknown');

  useEffect(() => {
    fetchHashtags();
  }, []);

  // Convert fallback data to match the Hashtag interface
  const convertFallbackData = (): Hashtag[] => {
    return fallbackHashtagsData.map(item => ({
      _id: item.id.toString(),
      name: item.tag.replace('#', ''), // Remove the # prefix
      posts: Array(item.postCount).fill(''), // Create empty array of appropriate length
      postCount: item.postCount
    }));
  };

  const testApiConnection = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken"); // FIXED: Changed from "token" to "accessToken"
      if (!token) {
        return false;
      }

      const response = await fetch("/api/hashtags", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      const contentType = response.headers.get("content-type");
      return contentType?.includes("application/json") ?? false;
    } catch {
      return false;
    }
  };

  const fetchHashtags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("accessToken"); // FIXED: Changed from "token" to "accessToken"
      
      // Check if user is authenticated
      if (!token) {
        throw new Error("Please log in to view trending hashtags");
      }

      // Test if API is working
      const isApiWorking = await testApiConnection();
      setApiStatus(isApiWorking ? 'working' : 'failing');

      if (!isApiWorking) {
        throw new Error("API endpoint not responding with JSON");
      }

      const response = await fetch("/api/hashtags", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      // Check content type first
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JJSON response:", textResponse.substring(0, 200));
        throw new Error("Server returned non-JJSON response");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        // Use converted fallback data if no hashtags from backend
        const convertedData = convertFallbackData();
        setHashtags(convertedData);
        setUsingFallbackData(true);
      } else {
        // Sort hashtags by post count in descending order
        const sortedHashtags = data.sort((a: Hashtag, b: Hashtag) => 
          b.posts.length - a.posts.length
        );
        
        // Ensure each hashtag has postCount
        const hashtagsWithCount = sortedHashtags.map((hashtag: Hashtag) => ({
          ...hashtag,
          postCount: hashtag.posts?.length || 0
        }));
        
        setHashtags(hashtagsWithCount);
        setUsingFallbackData(false);
      }
    } catch (err) {
      console.error("Error fetching hashtags:", err);
      // Use converted fallback data on error
      const convertedData = convertFallbackData();
      setHashtags(convertedData);
      setUsingFallbackData(true);
      setError(err instanceof Error ? err.message : "Failed to connect to server");
      setApiStatus('failing');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsByHashtag = async (name: string) => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem("accessToken"); // FIXED: Changed from "token" to "accessToken"
      
      // If API is failing, use fallback data
      if (apiStatus === 'failing') {
        // Simulate posts for fallback data
        const simulatedPosts: Post[] = [
          {
            _id: "1",
            content: `This is a sample post with #${name}. The backend API is currently unavailable.`,
            user: {
              username: "sample_user",
              profilePicture: "/default-avatar.png"
            },
            createdAt: new Date().toISOString()
          },
          {
            _id: "2",
            content: `Another example post using #${name}. Please check your server connection.`,
            user: {
              username: "demo_user",
              profilePicture: "/default-avatar.png"
            },
            createdAt: new Date().toISOString()
          }
        ];
        
        setTimeout(() => {
          setHashtagPosts(simulatedPosts);
          setSelectedHashtag(name);
          setPostsLoading(false);
        }, 500);
        return;
      }

      const response = await fetch(`/api/hashtags/${encodeURIComponent(name)}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JJSON response for posts");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const posts = await response.json();
      setHashtagPosts(posts);
      setSelectedHashtag(name);
      
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setPostsLoading(false);
    }
  };

  const handleHashtagClick = (name: string) => {
    fetchPostsByHashtag(name);
  };

  const clearSelectedHashtag = () => {
    setSelectedHashtag(null);
    setHashtagPosts([]);
  };

  const handleRetry = () => {
    setError(null);
    fetchHashtags();
  };

  // Calculate dynamic height based on content
  const getContainerHeight = () => {
    if (hashtags.length === 0 && !selectedHashtag) {
      return "h-auto min-h-[200px]";
    }
    return "h-[calc(100vh-80px)]";
  };

  if (loading) {
    return (
      <div className="bg-[#582f9a] h-[calc(100vh-80px)] w-[300px] mt-25 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <FaFire className="text-red-500" size={20} />
          <h1 className="text-xl font-bold text-white">Trending</h1>
        </div>
        <div className="text-white">Loading hashtags...</div>
      </div>
    );
  }

  return (
    <div className={`bg-[#582f9a] scrollbar-hide overflow-y-auto w-[300px] mt-25 p-4 rounded-2xl shadow-lg ${getContainerHeight()}`}>
      <div className="flex items-center gap-2 mb-4">
        <FaFire className="text-red-500" size={20} />
        <h1 className="text-xl font-bold text-white">Trending</h1>
        {selectedHashtag && (
          <button
            onClick={clearSelectedHashtag}
            className="ml-auto text-white hover:text-red-300 transition-colors"
            title="Clear selection"
          >
            <FaTimes size={16} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <FaExclamationTriangle />
            <span className="text-sm font-medium">
              {error.includes("log in") ? "Authentication Required" : "Connection Issue"}
            </span>
          </div>
          <div className="text-red-600 text-xs mb-3">
            {error}
          </div>
          <div className="flex gap-2">
            {error.includes("log in") ? (
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            ) : (
              <button 
                onClick={handleRetry}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                Retry Connection
              </button>
            )}
            <button 
              onClick={() => setError(null)}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {usingFallbackData && (
        <div className="mb-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <FaExclamationTriangle />
            <span className="text-sm font-medium">Using Sample Data</span>
          </div>
          <div className="text-yellow-600 text-xs mt-1">
            Backend API is not responding. Showing sample hashtags.
          </div>
        </div>
      )}

      {selectedHashtag ? (
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">
            Posts with #{selectedHashtag}
          </h2>
          {postsLoading ? (
            <div className="text-white">Loading posts...</div>
          ) : hashtagPosts.length === 0 ? (
            <div className="text-white text-center py-8">
              No posts found with #{selectedHashtag}
            </div>
          ) : (
            <div className="space-y-3">
              {hashtagPosts.map((post) => (
                <div key={post._id} className="bg-white p-3 rounded-lg shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {post.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{post.user.username}</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{post.content}</p>
                  <div className="text-gray-500 text-xs">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {hashtags.length === 0 ? (
            <div className="text-white text-center py-8">
              <div className="mb-2">No trending hashtags found</div>
              <div className="text-sm text-gray-300">
                Start creating posts with hashtags to see them here!
              </div>
            </div>
          ) : (
            <>
              {hashtags.map((hashtag) => (
                <div key={hashtag._id} className="flex flex-col bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <button
                    onClick={() => handleHashtagClick(hashtag.name)}
                    className="flex items-center justify-between w-full text-gray-700 hover:bg-gray-100 rounded-md px-2 py-1 text-sm font-medium text-left transition-colors duration-200"
                  >
                    <span className="text-blue-600 font-semibold">#{hashtag.name}</span>
                  </button>
                  <span className="text-gray-500 text-xs mt-1 ml-1">
                    {hashtag.postCount} {hashtag.postCount === 1 ? 'post' : 'posts'}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HashtagList;