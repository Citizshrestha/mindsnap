// src/redux/slices/userSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  _id: string; 
  profilePicture: string;
  coverImage: string;
  username: string;
  email: string;
  gender: string;
  vibe: string;
  fullname: string;
  dob: string;
  vibeDescription: string;
  aboutMe: string;
  followers: number;
  following: number;
  postsCount: number;
}

const initialState: UserState = {
  _id: localStorage.getItem("userId") || "",
  profilePicture: localStorage.getItem("profilePicture") || "",
  coverImage: localStorage.getItem("coverImage") || "",
  email: localStorage.getItem("email") || "",
  username: localStorage.getItem("username") || "Guest",
  gender: localStorage.getItem("gender") || "None",
  vibe: localStorage.getItem("vibe") || "VIBE",
  fullname: localStorage.getItem("fullname") || "",
  dob: localStorage.getItem("dob") || "",
  vibeDescription: localStorage.getItem("vibeDescription") || "",
  aboutMe: localStorage.getItem("aboutMe") || "",
  followers: parseInt(localStorage.getItem("followers") || "0"),
  following: parseInt(localStorage.getItem("following") || "0"),
  postsCount: parseInt(localStorage.getItem("postsCount") || "0"),
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfilePicture: (state, action: PayloadAction<string>) => {
      state.profilePicture = action.payload;
      localStorage.setItem("profilePicture", action.payload);
    },
    setCoverImage: (state, action: PayloadAction<string>) => {
      state.coverImage = action.payload; 
      localStorage.setItem("coverImage", action.payload);
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
      localStorage.setItem("username", action.payload);
    },
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload; 
      localStorage.setItem("email", action.payload);
    },
    setGender: (state, action: PayloadAction<string>) => {
      state.gender = action.payload;
      localStorage.setItem("gender", action.payload);
    },
    setVibe: (state, action: PayloadAction<string>) => {
      state.vibe = action.payload;
      localStorage.setItem("vibe", action.payload);
    },
    setFullName: (state, action: PayloadAction<string>) => {
      state.fullname = action.payload;
      localStorage.setItem("fullname", action.payload);
    },
    setDob: (state, action: PayloadAction<string>) => {
      state.dob = action.payload;
      localStorage.setItem("dob", action.payload);
    },
    setVibeDescription: (state, action: PayloadAction<string>) => {
      state.vibeDescription = action.payload;
      localStorage.setItem("vibeDescription", action.payload);
    },
    setAboutMe: (state, action: PayloadAction<string>) => {
      state.aboutMe = action.payload;
      localStorage.setItem("aboutMe", action.payload);
    },
    setUserId: (state, action: PayloadAction<string>) => { 
      state._id = action.payload;
      localStorage.setItem("userId", action.payload);
    },
    setFollowers: (state, action: PayloadAction<number>) => {
      state.followers = action.payload;
      localStorage.setItem("followers", action.payload.toString());
    },
    setFollowing: (state, action: PayloadAction<number>) => {
      state.following = action.payload;
      localStorage.setItem("following", action.payload.toString());
    },
    setPostsCount: (state, action: PayloadAction<number>) => {
      state.postsCount = action.payload;
      localStorage.setItem("postsCount", action.payload.toString());
    },
    setUserProfile: (state, action: PayloadAction<Partial<UserState>>) => {
      Object.assign(state, action.payload);
      Object.entries(action.payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          localStorage.setItem(key, value.toString());
        }
      });
    },
    clearUserData: (state) => {
      // Reset state to initial values
      state._id = "";
      state.profilePicture = "";
      state.coverImage = "";
      state.email = "";
      state.username = "Guest";
      state.gender = "None";
      state.vibe = "VIBE";
      state.fullname = "";
      state.dob = "";
      state.vibeDescription = "";
      state.aboutMe = "";
      state.followers = 0;
      state.following = 0;
      state.postsCount = 0;
      
      // Clear localStorage
      localStorage.removeItem("userId");
      localStorage.removeItem("profilePicture");
      localStorage.removeItem("coverImage");
      localStorage.removeItem("email");
      localStorage.removeItem("username");
      localStorage.removeItem("gender");
      localStorage.removeItem("vibe");
      localStorage.removeItem("fullname");
      localStorage.removeItem("dob");
      localStorage.removeItem("vibeDescription");
      localStorage.removeItem("aboutMe");
      localStorage.removeItem("followers");
      localStorage.removeItem("following");
      localStorage.removeItem("postsCount");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("unreadCount");
      localStorage.removeItem("notifications");
    },
  },
});

export const { 
  setProfilePicture, 
  setCoverImage, 
  setUsername, 
  setEmail, 
  setGender, 
  setVibe, 
  setFullName, 
  setDob, 
  setVibeDescription, 
  setAboutMe, 
  setUserId, 
  setFollowers,
  setFollowing,
  setPostsCount,
  setUserProfile,
  clearUserData
} = userSlice.actions;

export default userSlice.reducer;