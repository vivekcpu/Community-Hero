import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReports } from "../../store/slices/reportsSlice.js";
import { RootState, AppDispatch } from "../../store/index.js";
import ReportCard from "./ReportCard.js";
import { Search, RefreshCw, Filter, Sparkles } from "lucide-react";
import NeoCard from "../ui/NeoCard.js";

interface FeedPageProps {
  onNavigateProfile?: (userId: string) => void;
  onNavigateReport?: () => void;
}

const CATEGORIES = ["All", "Infrastructure", "Waste", "Lighting", "Water", "Safety", "Other"];
const STATUSES = ["All", "Active", "Pending", "Resolved"];

export default function FeedPage({ onNavigateProfile, onNavigateReport }: FeedPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { items: reports, loading, error, hasMore, page } = useSelector((state: RootState) => state.reports);
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Initial fetch
    dispatch(
      fetchReports({
        category: selectedCategory === "All" ? "" : selectedCategory,
        status: selectedStatus === "All" ? "" : selectedStatus,
        page: 1,
      })
    );
  }, [dispatch, selectedCategory, selectedStatus]);

  const handleRefresh = () => {
    dispatch(
      fetchReports({
        category: selectedCategory === "All" ? "" : selectedCategory,
        status: selectedStatus === "All" ? "" : selectedStatus,
        page: 1,
      })
    );
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      dispatch(
        fetchReports({
          category: selectedCategory === "All" ? "" : selectedCategory,
          status: selectedStatus === "All" ? "" : selectedStatus,
          page: page + 1,
        })
      );
    }
  };

  // Search filter
  const filteredReports = reports.filter((r) => {
    const text = (r.title + " " + r.description + " " + (r.location?.address || "")).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 pt-4 animate-fade-up">
      {/* Hero Welcome banner */}
      <div className="mb-6 bg-gradient-to-tr from-[#84d640] to-[#58cc02] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl translate-x-10 -translate-y-10" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-lg" />
        
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-bounce" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
            Civic League
          </span>
        </div>
        <h2 className="text-xl font-extrabold mb-1 tracking-tight">
          Welcome back, {user?.name || "Hero"}!
        </h2>
        <p className="text-xs text-white/90 leading-relaxed max-w-sm">
          Snap photos of street damage, report overflowing waste, or use your voice to fix the neighborhood. Earn XP and coins for every positive action!
        </p>

        {onNavigateReport && (
          <button
            onClick={onNavigateReport}
            className="mt-4 px-4 py-2 bg-white text-[#58cc02] font-bold text-xs rounded-xl shadow-lg hover:bg-emerald-50 transition active:scale-95 cursor-pointer"
          >
            Create Report +10 🪙
          </button>
        )}
      </div>

      {/* Search Input block */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for complaints, roads, potholes..."
          className="w-full bg-white border-2 border-gray-200 focus:border-[#58cc02] rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none transition shadow-sm"
        />
      </div>

      {/* Categories Horizontal scrolling container */}
      <div className="mb-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Filter Category</p>
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border-2 ${
                selectedCategory === cat
                  ? "bg-[#58cc02] border-[#58cc02] text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Status Filters */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-1.5 bg-gray-100 rounded-xl p-1 text-xs font-bold text-gray-500">
          {STATUSES.map((stat) => (
            <button
              key={stat}
              onClick={() => setSelectedStatus(stat)}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === stat ? "bg-white text-gray-800 shadow-sm" : "hover:text-gray-800"
              }`}
            >
              {stat}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className="p-2 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition text-gray-500 bg-white active:scale-95 shrink-0"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main Reports Timeline */}
      <div>
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard
              key={report._id}
              report={report as any}
              onAuthorClick={(id) => onNavigateProfile?.(id)}
            />
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <span className="text-4xl">🌱</span>
            <h3 className="text-base font-extrabold text-gray-700 mt-3">No reports found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              No civic concerns match your current filters. Be the first to report a local issue!
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && filteredReports.length > 0 && (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full text-center py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl text-xs font-bold text-gray-500 transition cursor-pointer active:scale-95"
          >
            {loading ? "Loading more heroes..." : "Load More Activity"}
          </button>
        )}
      </div>
    </div>
  );
}
