// src/store.ts
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import messageReducer from "./slices/messageSlice";
import { messageApi } from "../services/messageApi";

export const store = configureStore({
  reducer: {
    user: userReducer,
    message: messageReducer,
    [messageApi.reducerPath] : messageApi.reducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(messageApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;