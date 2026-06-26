import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import reportsReducer from "./slices/reportsSlice.js";
import userReducer from "./slices/userSlice.js";
import leaderboardReducer from "./slices/leaderboardSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reports: reportsReducer,
    user: userReducer,
    leaderboard: leaderboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off serialization check for easy Date handling
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
