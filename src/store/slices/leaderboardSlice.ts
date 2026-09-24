import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";
import { IUser } from "../../types.js";

interface LeaderboardState {
  users: IUser[];
  stats: {
    totalHeroes: number;
    totalReports: number;
    resolutionRate: number;
  };
  userRank: {
    rank: number;
    xp: number;
    level: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  users: [],
  stats: {
    totalHeroes: 0,
    totalReports: 0,
    resolutionRate: 75
  },
  userRank: null,
  loading: false,
  error: null,
};

export const fetchLeaderboard = createAsyncThunk(
  "leaderboard/fetchLeaderboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/leaderboard");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load leaderboard");
    }
  }
);

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.stats = action.payload.stats || state.stats;
        state.userRank = action.payload.userRank || null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default leaderboardSlice.reducer;
