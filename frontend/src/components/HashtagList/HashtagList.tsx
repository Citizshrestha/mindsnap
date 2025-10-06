// src/components/HashtagList.tsx
import { useEffect, useState } from "react";
import { FaFire, FaTimes, FaExclamationTriangle, FaSync } from "react-icons/fa";
import { hashtagsData as fallbackHashtagsData } from "../../data/hashtags";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";

interface Hashtag {
  _id: string;
  name: string;
  posts: string[];
  postCount: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Post {
  _id: string;
  content: string;
  user: {
    _id: string;
    username: string;
    profilePicture: string;
    fullname?: string;
  };
  createdAt: string;
  image?: string;
}

const HashtagList = () => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hashtagPosts, setHashtagPosts] = useState<Post[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'failing'>('unknown');
  const [combinedHashtags, setCombinedHashtags] = useState<Hashtag[]>([]);

  // Get current user data from Redux store
  const currentUser = useSelector((state: RootState) => state.user);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    fetchHashtags();
  }, []);

  useEffect(() => {
    // Combine backend and fallback hashtags
    if (hashtags.length > 0 || usingFallbackData) {
      let combined: Hashtag[] = [];
      
      // Add backend hashtags first
      if (hashtags.length > 0) {
        combined = [...hashtags];
      }
      
      // Add fallback hashtags that don't exist in backend data
      if (usingFallbackData) {
        const fallbackConverted = convertFallbackData();
        fallbackConverted.forEach(fallbackHashtag => {
          if (!combined.some(hashtag => hashtag.name.toLowerCase() === fallbackHashtag.name.toLowerCase())) {
            combined.push(fallbackHashtag);
          }
        });
      }
      
      // Sort by post count (descending)
      combined.sort((a, b) => b.postCount - a.postCount);
      setCombinedHashtags(combined);
    }
  }, [hashtags, usingFallbackData]);

  const convertFallbackData = (): Hashtag[] => {
    return fallbackHashtagsData.map(item => ({
      _id: `sample-${item.id}`,
      name: item.tag.replace('#', ''),
      posts: [],
      postCount: item.postCount
    }));
  };

  const testApiConnection = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log("No token found for API test");
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/hashtags`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json") ?? false;
      
      if (!isJson) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  };

  const fetchHashtags = async () => {
    try {
      setLoading(true);
      setError(null);
      setHashtags([]);
      setUsingFallbackData(false);
      
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        throw new Error("Please log in to view trending hashtags");
      }

      console.log("Testing API connection...");
      const isApiWorking = await testApiConnection();
      setApiStatus(isApiWorking ? 'working' : 'failing');
      console.log("API status:", isApiWorking ? 'working' : 'failing');

      if (!isApiWorking) {
        throw new Error("API endpoint not responding properly");
      }

      console.log("Fetching hashtags from backend...");
      const response = await fetch(`${API_BASE_URL}/api/hashtags`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
      });

      // Check content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse.substring(0, 200));
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Backend response:", data);
      
      if (data && Array.isArray(data)) {
        // Process backend data with a client-side safety dedupe of post IDs
        const withSafeCounts = data.map((hashtag: Hashtag) => {
          const uniqueCount = Array.isArray(hashtag.posts)
            ? new Set(hashtag.posts).size
            : (hashtag.postCount || 0);
          return { ...hashtag, postCount: uniqueCount } as Hashtag;
        });

        const hashtagsWithCount = withSafeCounts.sort((a: Hashtag, b: Hashtag) => b.postCount - a.postCount);
        
        setHashtags(hashtagsWithCount);
        console.log("Backend hashtags loaded:", hashtagsWithCount.length);
        
        // Use fallback data only if backend returns empty
        if (hashtagsWithCount.length === 0) {
          console.log("Backend returned empty array, using fallback data");
          setUsingFallbackData(true);
        }
      } else {
        throw new Error("Invalid data format from server");
      }
    } catch (err) {
      console.error("Error fetching hashtags:", err);
      // On error, use fallback data
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
      const token = localStorage.getItem("accessToken");
      
      // If API is failing, use fallback data
      if (apiStatus === 'failing') {
        // Simulate posts for fallback data with current user info
        const simulatedPosts: Post[] = [
          {
            _id: "1",
            content: `This is a sample post with #${name}. The backend API is currently unavailable.`,
            user: {
              _id: currentUser._id || "sample_user_id",
              username: currentUser.username || "sample_user",
              profilePicture: currentUser.profilePicture || "/default-avatar.png",
              fullname: currentUser.fullname || "Sample User"
            },
            createdAt: new Date().toISOString()
          },
          {
            _id: "2",
            content: `Another example post using ${name}. Please check your server connection.`,
            user: {
              _id: "demo_user_id",
              username: "demo_user",
              profilePicture: "/default-avatar.png",
              fullname: "Demo User"
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

      const response = await fetch(`${API_BASE_URL}/api/hashtags/${encodeURIComponent(name)}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response for posts");
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
    setHashtags([]);
    setCombinedHashtags([]);
    setUsingFallbackData(false);
    fetchHashtags();
  };

  if (loading) {
    return (
      <div className="bg-[#582f9a] h-[600px] w-[300px]  rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <FaFire className="text-red-500" size={20} />
          <h1 className="text-xl font-bold text-white">Trending</h1>
        </div>
        <div className="flex items-center justify-center mt-5 text-white">
          <FaSync className="animate-spin mr-2 " />
          Loading hashtags...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#582f9a] h-[600px] w-[300px]   p-4 rounded-2xl shadow-lg flex flex-col">
      {/* Header Section - Fixed height */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <FaFire className="text-red-500" size={20} />
          <h1 className="text-xl font-bold text-white">Trending</h1>
          <button
            onClick={handleRetry}
            className="ml-auto text-white hover:text-blue-300 transition-colors"
            title="Refresh hashtags"
          >
            <FaSync size={14} />
          </button>
          {selectedHashtag && (
            <button
              onClick={clearSelectedHashtag}
              className="text-white hover:text-red-300 transition-colors ml-2"
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

        {usingFallbackData && apiStatus === 'failing' && (
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

        {usingFallbackData && apiStatus === 'working' && hashtags.length === 0 && (
          <div className="mb-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <FaExclamationTriangle />
              <span className="text-sm font-medium">No Trending Hashtags</span>
            </div>
            <div className="text-blue-600 text-xs mt-1">
              No trending hashtags found. Showing sample data.
            </div>
          </div>
        )}
      </div>
      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-400 scrollbar-hide scrollbar-track-purple-200">
        {selectedHashtag ? (
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">
              Posts with {selectedHashtag.startsWith('#') ? selectedHashtag : `#${selectedHashtag}`}
            </h2>
            {postsLoading ? (
              <div className="flex items-center justify-center text-white py-8">
                <FaSync className="animate-spin mr-2" />
                Loading posts...
              </div>
            ) : hashtagPosts.length === 0 ? (
              <div className="text-white text-center py-8">
                No posts found with {selectedHashtag.startsWith('#') ? selectedHashtag : `#${selectedHashtag}`}
              </div>
            ) : (
              <div className="space-y-3">
                {hashtagPosts.map((post) => (
                  <div key={post._id} className="bg-white p-3 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      {post.user.profilePicture ? (
                        <img
                          src={post.user.profilePicture}
                          alt={post.user.username}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {post.user.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {post.user.fullname || post.user.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{post.user.username}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post content"
                        className="w-full h-auto rounded-lg mb-2 max-h-40 object-cover"
                      />
                    )}
                    <div className="text-gray-500 text-xs">
                      {new Date(post.createdAt).toLocaleDateString()} at{" "}
                      {new Date(post.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {combinedHashtags.length === 0 ? (
              <div className="text-white text-center py-8">
                <div className="mb-2">No trending hashtags found</div>
                <div className="text-sm text-gray-300">
                  Start creating posts with hashtags to see them here!
                </div>
              </div>
            ) : (
              <>
                {combinedHashtags.map((hashtag) => (
                  <div key={hashtag._id} className="flex flex-col bg-white p-1 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    <div
                      onClick={() => handleHashtagClick(hashtag.name)}
                      className="flex items-center justify-between w-full text-gray-700 hover:bg-gray-100 rounded-md px-2 py-1 text-sm font-medium transition-colors duration-200"
                    >
                      <span className="text-blue-600 font-semibold">{hashtag.name.startsWith('#') ? hashtag.name : `#${hashtag.name}`}</span>
                      {hashtags.some(h => h._id === hashtag._id) && (
                        <span className="text-xs text-green-600 ml-2" title="From backend">View</span>
                      )}
                      {hashtag._id.startsWith('sample-') && (
                        <span className="text-xs text-yellow-600 ml-2" title="Sample data">📋</span>
                      )}
                    </div>
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
    </div>
  );
};

export default HashtagList;