// src/redux/slices/userSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  _id: string; 
  profilePicture: string;
  username: string;
  gender: string;
  vibe: string;
  fullname: string;
  dob: string;
  vibeDescription: string;
  aboutMe: string;
}

const initialState: UserState = {
  _id: localStorage.getItem("userId") || "",
  profilePicture: localStorage.getItem("profilePicture") || "",
  username: localStorage.getItem("username") || "Guest",
  gender: localStorage.getItem("gender") || "None",
  vibe: localStorage.getItem("vibe") || "VIBE",
  fullname: localStorage.getItem("fullname") || "",
  dob: localStorage.getItem("dob") || "",
  vibeDescription: localStorage.getItem("vibeDescription") || "",
  aboutMe: localStorage.getItem("aboutMe") || "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfilePicture: (state, action: PayloadAction<string>) => {
      state.profilePicture = action.payload;
      localStorage.setItem("profilePicture", action.payload);
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
      localStorage.setItem("username", action.payload);
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
    setUserProfile: (state, action: PayloadAction<Partial<UserState>>) => {
      Object.assign(state, action.payload);
      Object.entries(action.payload).forEach(([key, value]) => {
        if (value !== undefined) localStorage.setItem(key, value as string);
      });
    },
  },
});

export const { setProfilePicture, setUsername, setGender, setVibe, setFullName, setDob, setVibeDescription, setAboutMe, setUserId, setUserProfile } = userSlice.actions;
export default userSlice.reducer;