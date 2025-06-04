import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  profilePicture: string;
  username: string;
}

const initialState: UserState = {
  profilePicture: localStorage.getItem("profilePicture") || "/images/default.jpg",
  username: localStorage.getItem("username") || "Guest",
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
  },
});

export const { setProfilePicture, setUsername } = userSlice.actions;
export default userSlice.reducer;