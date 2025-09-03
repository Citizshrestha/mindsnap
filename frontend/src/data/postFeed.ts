export interface Post {
  id: number;
  name: string;
  username: string;
  time: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  profilePicture: string;
  media: {
    type: "image" | "video" | "audio" | "file";
    url: string; 
    name?: string; 
  } | null;
}

export const postsData: Post[] = [
  {
    id: 1,
    name: "Citiz Shrestha",
    username: "@citizshrestha",
    time: "2 min ago",
    caption: "Coding the future, one byte at a time. 💻✨ #Decoding",
    likes: 10,
    comments: 4,
    shares: 2,
    profilePicture: "https://randomuser.me/api/portraits/men/32.jpg",
    media: {
      type: "video",
      url: "https://www.pexels.com/download/video/6804109/",
    },
  },
  {
    id: 2,
    name: "Sophia Morgan",
    username: "@sophiamorgan",
    time: "7 min ago",
    caption: "Hello from Yosemite National Park! 🏔️🌲 Nature is breathtaking! 🌄✨ #AdventureTime",
    likes: 43,
    comments: 11,
    shares: 5,
    profilePicture: "https://randomuser.me/api/portraits/women/65.jpg",
    media: {
      type: "image",
      url: "https://images.unsplash.com/photo-1505203723186-fdcd69a5aacb?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHlvc2VtaXRlJTIwbmF0aW9uYWwlMjBwYXJrfGVufDB8fDB8fHww", 
    },
  },
  {
    id: 3,
    name: "Liam Carter",
    username: "@liamcarter",
    time: "12 min ago",
    caption: "Vibing on this sound ✨🌃  vibes are everything! 🏙️💫 #Vibe",
    likes: 27,
    comments: 8,
    shares: 3,
    profilePicture: "https://randomuser.me/api/portraits/men/45.jpg",
    media: {
      type: "audio",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
    },
  },
  {
    id: 4,
    name: "Emma Wilson",
    username: "@emmawilson",
    time: "20 min ago",
    caption: "Peaceful mornings by the beach 🌊☀️ Soul therapy! 🏖️🧘‍♀️ #BeachVibes",
    likes: 51,
    comments: 15,
    shares: 7,
    profilePicture: "https://randomuser.me/api/portraits/women/44.jpg",
    media: {
      type: "file",
      url: "https://example.com/sample.pdf", 
      name: "sample.pdf",
    },
  },
  {
    id: 5,
    name: "Daniel Kim",
    username: "@danielkim",
    time: "30 min ago",
    caption: "Hiking adventures are the best kind of therapy 🏔️🥾 Reconnecting with nature! 🌿❤️ #MountainLife",
    likes: 36,
    comments: 10,
    shares: 4,
    profilePicture: "https://randomuser.me/api/portraits/men/77.jpg",
    media: null,
  },
];