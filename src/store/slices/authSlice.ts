import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";
import { IUser } from "../../types.js";

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const loadInitialUser = (): IUser | null => {
  try {
    const item = localStorage.getItem("user");
    if (!item || item === "undefined" || item === "null") {
      return null;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error("Error parsing user from localStorage:", err);
    return null;
  }
};

const initialState: AuthState = {
  user: loadInitialUser(),
  isAuthenticated: !!localStorage.getItem("token_active") && !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Registration failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/login", userData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/auth/logout");
      return null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (userId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/users/${userId}`);
      return null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete account");
    }
  }
);

export const updateAvatar = createAsyncThunk(
  "auth/updateAvatar",
  async ({ userId, avatar }: { userId: string; avatar: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}`, { avatar });
      return response.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update profile picture");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/me");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch user");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("token_active", "true");
    },
    updateUserRewards: (state, action) => {
      if (state.user) {
        state.user.coins += action.payload.coins;
        state.user.xp += action.payload.xp;
        state.user.level = Math.floor(state.user.xp / 500) + 1;
        state.user.reportsCount += 1;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    updateUserLocal: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("token_active", "true");
        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("token_active", "true");
        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("token_active");
      })
      // Delete Account
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("token_active");
      })
      // Update Avatar
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      // Current User
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("token_active");
      });
  },
});

export const { clearError, setCredentials, updateUserRewards, updateUserLocal } = authSlice.actions;
export default authSlice.reducer;
