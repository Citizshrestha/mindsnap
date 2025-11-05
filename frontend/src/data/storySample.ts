export interface StorySample {
  _id?: string;
  user: string;
  caption: string; 
  content: {
    url: string;
    mediaType: "image" | "video" | "text";
  };
  expiresAt: string;
  createdAt?: string;
  views: string[];
  likes: string[];
  profilePic: string; 
}

const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000; 

export const storiesData: StorySample[] = [
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k1",
    user: "Aarav Sharma",
    caption: "Enjoying a sunny day at the park!",
    profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face&q=80",
    content: {
      url: "https://images.unsplash.com/photo-1746950862509-959ed92c42b8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Sita Rai", "Ramesh Karki"],
    likes: ["Anjali Thapa"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k2",
    user: "Sita Rai",
    caption: "Trying out a new recipe today!",
    profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face&q=80",
    content: {
      url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Aarav Sharma", "Nirmal Gurung", "Kiran Lama"],
    likes: ["Pooja Adhikari"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k3",
    user: "Bikash Shrestha",
    caption: "Hiking adventure in the mountains!",
    profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&q=80",
    content: {
      url: "https://images.unsplash.com/photo-1595675024853-0f3ec9098ac7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Maya Tamang"],
    likes: ["Sita Rai", "Ramesh Karki", "Anjali Thapa"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k4",
    user: "Anjali Thapa",
    caption: "Relaxing by the beach this weekend!",
    profilePic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80",
    content: {
      url: "https://images.pexels.com/photos/27355586/pexels-photo-27355586/free-photo-of-daniel-1.jpeg?auto=compress&cs=tinysrgb&w=600",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Bikash Shrestha", "Nirmal Gurung"],
    likes: ["Kiran Lama"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k5",
    user: "Ramesh Karki",
    caption: "Exploring the city streets!",
    profilePic: "/images/Male Avatar.png", 
    content: {
      url: "https://picsum.photos/id/1015/600/400",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Sita Rai"],
    likes: ["Aarav Sharma", "Maya Tamang"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k6",
    user: "Maya Tamang",
    caption: "Beautiful sunset view tonight!",
    profilePic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face&q=80",
    content: {
      url: "https://picsum.photos/id/1025/600/400",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Pooja Adhikari", "Nirmal Gurung", "Kiran Lama", "Bikash Shrestha"],
    likes: ["Sita Rai"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k7",
    user: "Nirmal Gurung",
    caption: "Working on a new project today!",
    profilePic: "/images/Male Avatar.png", 
    content: {
      url: "https://picsum.photos/id/1035/600/400",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Anjali Thapa", "Ramesh Karki"],
    likes: ["Pooja Adhikari", "Maya Tamang", "Kiran Lama"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k8",
    user: "Pooja Adhikari",
    caption: "Celebrating a special occasion!",
    profilePic: "/images/Female Avatar.webp", 
    content: {
      url: "https://picsum.photos/id/1045/600/400",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Sita Rai"],
    likes: ["Aarav Sharma"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k9",
    user: "Kiran Lama",
    caption: "Morning jog in the park!",
    profilePic: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face&q=80",
    content: {
      url: "https://picsum.photos/id/1055/600/400",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Maya Tamang", "Ramesh Karki"],
    likes: ["Nirmal Gurung"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k0",
    user: "Deepak Bhandari",
    caption: "Learning something new today!",
    profilePic: "/images/Male Avatar.png", 
    content: {
      url: "https://picsum.photos/id/1065/600/400",
      mediaType: "image"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Aarav Sharma"],
    likes: ["Sita Rai", "Anjali Thapa"],
  },
  {
    _id: "67a1b2c3d4e5f6g7h8i9j0k10",
    user: "Sabin Shrestha",
    caption: "Check out my new video!",
    profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face&q=80",
    content: {
      url: "https://www.pexels.com/download/video/4585216/",
      mediaType: "video"
    },
    expiresAt: new Date(now + oneDay).toISOString(),
    views: ["Aarav Sharma", "Sita Rai"],
    likes: ["Bikash Shrestha"],
  },
];

export default storiesData;