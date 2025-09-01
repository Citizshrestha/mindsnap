import { useState } from "react";
import Header from "../header/Header";
import Sidebar from "../sidebar/Sidebar";
import MoodMaker from "../MoodMaker/MoodMaker";

const Home = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      name: "Citiz Shrestha",
      username: "@citizshrestha",
      time: "2 min ago",
      text: "Good Morning! Does anyone have a Coding Student Survey?",
      likes: 10,
      comments: 4,
      shares: 2,
      image:
        "https://img.freepik.com/free-vector/programmer-working-isometric-style_52683-16709.jpg",
    },
    {
      id: 2,
      name: "Sophia Morgan",
      username: "@sophiamorgan",
      time: "7 min ago",
      text: "Hello from Yosemite National Park!",
      likes: 43,
      comments: 11,
      shares: 5,
      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
    },
  ]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

        <Header />

      {/* Main Content */}
      <div className="flex-1 w-[950px] relative flex flex-col   min-h-screen">

        <div className="flex h-[calc(100vh-80px)]  overflow-y-auto scrollbar-hide items-start justify-between w-full px-6 py-6 ml-[5rem] mt-[5rem]">
          {/* Feed Area */}
          <div className="flex-1  max-w-3xl">
            {/* Create Post */}
            <div className="bg-white flex flex-col shadow-md rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                         <h2 className="text-xl text-black font-semibold mr-72">Create Post</h2>
                  <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2 text-purple-600">
                  <span className="text-2xl cursor-pointer">📷</span> 
                  <span className="text-2xl cursor-pointer">😊</span> 
                </div>
                <button className="flex items-center gap-2 bg-[#6F8DFB] ml-2 text-white px-5 py-2 rounded-2xl hover:bg-[#5c77d8]">
                  Post 
                </button>
              </div>
              </div>
              <textarea
                className="w-full border font-semibold text-black border-gray-600 rounded-xl p-3 mt-1 outline-none resize-none"
                rows={2}
                placeholder="What's on your Heart?"
              ></textarea>
          
            </div>

            {/* Posts Feed */}
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white shadow-md rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {post.name}{" "}
                        <span className="text-gray-500 font-normal">
                          {post.username}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400">{post.time}</p>
                    </div>
                    <button className="text-gray-400">•••</button>
                  </div>
                  <p className="mt-3 text-gray-700">{post.text}</p>
                  {post.image && (
                    <img
                      src={post.image}
                      alt="post"
                      className="rounded-xl mt-3 w-full object-cover"
                    />
                  )}
                  <div className="flex justify-around text-gray-500 mt-4 text-sm">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                    <span>↗️ {post.shares}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

   
        </div>
      </div>

             {/* MoodMaker Area */}
          <div className="w-1/4 moodMaker sticky top-[7rem] right-0  self-start  ml-16">
            <MoodMaker />
          </div>
    </div>
  );
};

export default Home;