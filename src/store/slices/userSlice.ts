import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  coins: number;
  xp: number;
  level: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  } | null;
}

const initialState: UserState = {
  coins: 0,
  xp: 0,
  level: 1,
  location: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setLocation: (state, action: PayloadAction<{ lat: number; lng: number; address: string }>) => {
      state.location = action.payload;
    },
    addReward: (state, action: PayloadAction<{ coins: number; xp: number }>) => {
      state.coins += action.payload.coins;
      state.xp += action.payload.xp;
      state.level = Math.floor(state.xp / 500) + 1;
    },
    resetUserStats: (state) => {
      state.coins = 0;
      state.xp = 0;
      state.level = 1;
      state.location = null;
    }
  },
});

export const { setLocation, addReward, resetUserStats } = userSlice.actions;
export default userSlice.reducer;
