import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";
import { IReport } from "../../types.js";
import { updateUserRewards } from "./authSlice.js";

interface ReportsState {
  items: IReport[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

const initialState: ReportsState = {
  items: [],
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
};

export const fetchReports = createAsyncThunk(
  "reports/fetchReports",
  async (filters: { category?: string; status?: string; page?: number } | undefined, { rejectWithValue }) => {
    try {
      const page = filters?.page || 1;
      const params = {
        category: filters?.category || undefined,
        status: filters?.status || undefined,
        page,
        limit: 10
      };
      const response = await axiosInstance.get("/reports", { params });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch reports");
    }
  }
);

export const submitReport = createAsyncThunk(
  "reports/submitReport",
  async (reportData: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/reports", reportData);
      // Automatically award +10 Coins and +10 XP on the client via redux
      if (response.data?.rewards) {
        dispatch(updateUserRewards(response.data.rewards));
      }
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit report");
    }
  }
);

export const upvoteReport = createAsyncThunk(
  "reports/upvoteReport",
  async (reportId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/reports/${reportId}/upvote`);
      return { reportId, ...response.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to upvote");
    }
  }
);

export const editReport = createAsyncThunk(
  "reports/editReport",
  async ({ reportId, reportData }: { reportId: string; reportData: any }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/reports/${reportId}`, reportData);
      return response.data.report;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update report");
    }
  }
);

export const deleteReport = createAsyncThunk(
  "reports/deleteReport",
  async (reportId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/reports/${reportId}`);
      return reportId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete report");
    }
  }
);

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    resetReports: (state) => {
      state.items = [];
      state.page = 1;
      state.hasMore = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reports
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg?.page && action.meta.arg.page > 1) {
          state.items = [...state.items, ...action.payload.reports];
        } else {
          state.items = action.payload.reports;
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Submit Report
      .addCase(submitReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload.report);
      })
      .addCase(submitReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upvote Report
      .addCase(upvoteReport.fulfilled, (state, action) => {
        const { reportId, upvotes } = action.payload;
        const index = state.items.findIndex((item) => item._id === reportId);
        if (index !== -1) {
          state.items[index].upvotes = upvotes;
        }
      })
      // Edit Report
      .addCase(editReport.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete Report
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      });
  },
});

export const { resetReports } = reportsSlice.actions;
export default reportsSlice.reducer;
