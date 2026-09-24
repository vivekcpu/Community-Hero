import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/index.js";
import { fetchCurrentUser } from "../store/slices/authSlice.js";
import TopBar from "../components/layout/TopBar.js";
import BottomNav from "../components/layout/BottomNav.js";
import FeedPage from "../components/feed/FeedPage.js";
import ReportPage from "../components/report/ReportPage.js";
import LeaderboardPage from "../components/leaderboard/LeaderboardPage.js";
import ProfilePage from "../components/profile/ProfilePage.js";
import NoticesPage from "../components/notices/NoticesPage.js";
import RedeemStore from "../components/store/RedeemStore.js";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Layout Tab Navigation states
  const [activeTab, setActiveTab] = useState("feed");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // Duolingo-style Custom Celebration Toast Notification State
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, dispatch]);

  const triggerToast = () => {
    setShowToast(true);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleNavigateAuthor = (userId: string) => {
    setProfileUserId(userId);
    setActiveTab("profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "profile") {
      setProfileUserId(null); // Reset to view own profile
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReportSuccess = () => {
    triggerToast();
    // Redirect to feed to view post
    setActiveTab("feed");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-16 md:pb-0">
      {/* Dynamic Celebration Toast */}
      {showToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-[#84d640] to-[#58cc02] border-3 border-emerald-600 text-white rounded-2xl px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex items-center space-x-3.5 max-w-sm"
          style={{
            animation: "fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            boxShadow: "0 6px 0 #46A302"
          }}
        >
          {/* Cape Chick Bird Emoji */}
          <div className="text-3xl animate-bounce">🐥</div>
          <div className="font-sans">
            <h4 className="text-xs font-black tracking-tight uppercase flex items-center">
              Superb Effort! <Sparkles className="w-3.5 h-3.5 ml-1 text-yellow-300 fill-yellow-300" />
            </h4>
            <p className="text-[10px] text-emerald-100 font-extrabold mt-0.5">
              Civic issue reported! Earned **+10 🪙 & +10 XP**
            </p>
          </div>
        </div>
      )}

      {/* Header top bar */}
      <TopBar activeTab={activeTab} onNavigate={handleTabChange} />

      {/* Main Page scroll content container */}
      <main className="flex-grow max-w-5xl w-full mx-auto pb-12">
        {activeTab === "feed" && (
          <FeedPage
            onNavigateProfile={handleNavigateAuthor}
            onNavigateReport={() => handleTabChange("report")}
          />
        )}

        {activeTab === "notices" && (
          <NoticesPage />
        )}

        {activeTab === "report" && (
          <ReportPage onSuccessSubmit={handleReportSuccess} />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardPage onNavigateProfile={handleNavigateAuthor} />
        )}

        {activeTab === "store" && (
          <RedeemStore />
        )}

        {activeTab === "profile" && (
          <ProfilePage
            userId={profileUserId}
            onLogoutSuccess={() => {
              window.location.href = "/auth";
            }}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Nav bar */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
