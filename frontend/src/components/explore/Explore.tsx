import { useEffect, useState } from "react";
import type { Post } from "../../data/postFeed";
import { postsData } from "../../data/postFeed";
import { FaRegCommentDots, FaShare, FaEllipsisV } from "react-icons/fa";
import { BiSolidLike } from "react-icons/bi";
import DefaultAvatar from "../../../public/images/default.jpg";

const Explore = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [mediaHeights, setMediaHeights] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    // Filter posts to show only those with image or video media
    const filteredPosts = postsData.filter(
      (post) =>
        post.media &&
        (post.media.type === "image" || post.media.type === "video")
    );
    setPosts(filteredPosts);

    // Assign random heights to each post's media
    const heights: { [key: number]: number } = {};
    filteredPosts.forEach((post) => {
      heights[post.id] = Math.floor(Math.random() * (400 - 200 + 1)) + 200;
    });
    setMediaHeights(heights);
  }, []);

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide ml-20 mt-10 bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Explore</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: "auto", minHeight: "400px" }}>
            <div className="relative">
              {post.media && (
                <div className="w-full" style={{ height: `${mediaHeights[post.id]}px` }}>
                  {post.media.type === "image" && (
                    <img
                      src={post.media.url}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {post.media.type === "video" && (
                    <video
                      autoPlay
                      muted
                      loop
                      controls
                      className="w-full h-full object-cover"
                    >
                      <source src={post.media.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}
              <div className="p-4 flex flex-col justify-between" style={{ height: "calc(100% - 200px)" }}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <img
                        src={post.profilePicture}
                        alt={post.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => (e.currentTarget.src = DefaultAvatar)}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">{post.name}</h3>
                        <p className="text-sm text-gray-500">{post.username}</p>
                      </div>
                    </div>
                    <button className="text-gray-600 hover:text-gray-800">
                      <FaEllipsisV />
                    </button>
                  </div>
                  <p className="text-gray-700 mb-2">{post.caption}</p>
                </div>
                <div className="flex justify-between mr-8 mt-4 text-gray-600 text-sm">
                  <span>{post.time}</span>
                  <div className="flex space-x-4">
                    <span className="flex items-center gap-1">
                      <BiSolidLike size={16} /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaRegCommentDots size={16} /> {post.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaShare size={16} /> {post.shares}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;