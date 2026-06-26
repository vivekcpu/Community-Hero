import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Users, Activity, CheckCircle2, AlertTriangle, Trash2, Ban,
  RefreshCw, SlidersHorizontal, Bot, Lock, LogOut, Search,
  AlertCircle, Clock, ThumbsUp, MessageSquare, Sparkles, Play,
  Send, X, User as UserIcon, ChevronRight, ShieldCheck, MapPin, Flame, Award, Coins, Megaphone, Calendar
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axiosInstance from "../api/axiosInstance";

interface Report {
  _id: string;
  title: string;
  description: string;
  category: "Infrastructure" | "Waste" | "Lighting" | "Water" | "Safety" | "Other";
  severity: number;
  status: "Active" | "Pending" | "Resolved";
  upvotes: any[];
  commentsCount?: number;
  location: {
    address: string;
    coordinates: number[];
  };
  author?: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    level?: number;
    xp?: number;
  };
  urgencyScore?: number;
  isMostUrgent?: boolean;
  urgencyJustification?: string;
  createdAt: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  coins: number;
  xp: number;
  level: number;
  isBanned?: boolean;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalComplaints: number;
  solvedComplaints: number;
  pendingComplaints: number;
  activeComplaints: number;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<"complaints" | "users" | "notices">("complaints");

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [complaints, setComplaints] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Filters & Sorting states
  const [sortBy, setSortBy] = useState<string>("newest");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [realSearchTerm, setRealSearchTerm] = useState<string>("");

  // Users Tab Search state
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");

  // AI Pipeline / Suggestion panel states
  const [selectedReportForAi, setSelectedReportForAi] = useState<Report | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{
    summary: string;
    suggestions: string[];
  } | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Running Urgency scores state
  const [calculatingUrgencyId, setCalculatingUrgencyId] = useState<string | null>(null);

  // Modal / Detail states
  const [viewingCommentsId, setViewingCommentsId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [viewingUpvotersId, setViewingUpvotersId] = useState<string | null>(null);
  const [upvotersList, setUpvotersList] = useState<any[]>([]);
  
  // Chat Bot states
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [chatBotReport, setChatBotReport] = useState<Report | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; content: string }[]>([]);
  const [isSendingToBot, setIsSendingToBot] = useState(false);
  const [botInput, setBotInput] = useState("");

  // Custom non-blocking Delete Confirmation state
  const [userPendingDelete, setUserPendingDelete] = useState<UserData | null>(null);

  // Notice publishing states
  const [isPublishNoticeOpen, setIsPublishNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [isPublishingNotice, setIsPublishingNotice] = useState(false);
  const [noticeSuccessMessage, setNoticeSuccessMessage] = useState("");
  const [adminNotices, setAdminNotices] = useState<any[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [selectedAdminNotice, setSelectedAdminNotice] = useState<any | null>(null);
  const [isDeleteNoticeConfirmOpen, setIsDeleteNoticeConfirmOpen] = useState(false);

  // State for metrics card popup
  const [selectedMetric, setSelectedMetric] = useState<{
    label: string;
    val: any;
    icon: React.ComponentType<any>;
    color: string;
    bg: string;
    description: string;
    insight: string;
  } | null>(null);

  // Check login on load
  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    if (adminToken) {
      setIsAdminLoggedIn(true);
    } else {
      setIsAdminLoggedIn(false);
    }
  }, []);

  // Fetch all core admin statistics
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await axiosInstance.get("/admin/stats");
      if (response.data?.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch complaints with sorting and search
  const fetchComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const response = await axiosInstance.get(`/admin/complaints?sortBy=${sortBy}`);
      if (response.data?.success) {
        setComplaints(response.data.reports || []);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  // Fetch users list
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axiosInstance.get("/admin/users");
      if (response.data?.success) {
        setUsers(response.data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchAdminNotices = async () => {
    setIsLoadingNotices(true);
    try {
      const response = await axiosInstance.get("/notices");
      if (response.data?.success) {
        setAdminNotices(response.data.notices || []);
      }
    } catch (err) {
      console.error("Error fetching admin notices:", err);
    } finally {
      setIsLoadingNotices(false);
    }
  };

  // Fetch statistics and relevant list on login or tab switch
  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchStats();
      if (activeTab === "complaints") {
        fetchComplaints();
      } else if (activeTab === "users") {
        fetchUsers();
      } else if (activeTab === "notices") {
        fetchAdminNotices();
      }
    }
  }, [isAdminLoggedIn, activeTab, sortBy]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await axiosInstance.post("/admin/login", { username, password });
      if (response.data?.success) {
        const token = response.data.token;
        localStorage.setItem("admin_token", token);
        setIsAdminLoggedIn(true);
      } else {
        setLoginError(response.data?.message || "Invalid administrative credentials");
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.message || "Invalid administrative credentials");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fetch comments for a specific report
  const fetchComments = async (reportId: string) => {
    setViewingCommentsId(reportId);
    setIsLoadingComments(true);
    try {
      const response = await axiosInstance.get(`/admin/complaints/${reportId}/comments`);
      if (response.data?.success) {
        setCommentsList(response.data.comments || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Open Chat Bot
  const handleOpenChatBot = (report: Report) => {
    setChatBotReport(report);
    setIsChatBotOpen(true);
    setChatMessages([
      { role: "bot", content: `Hello Administrator. I am Suggesto. I've analyzed the report "${report.title}". How can I assist you with managing this situation?` }
    ]);
  };

  // Send message to Chat Bot
  const handleSendToBot = async () => {
    if (!botInput.trim() || !chatBotReport) return;

    const userMsg = botInput.trim();
    setBotInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsSendingToBot(true);

    try {
      const response = await axiosInstance.post("/admin/chat", {
        message: userMsg,
        history: chatMessages,
        context: chatBotReport
      });

      if (response.data?.success) {
        setChatMessages(prev => [...prev, { role: "bot", content: response.data.reply }]);
      }
    } catch (err) {
      console.error("ChatBot error:", err);
      setChatMessages(prev => [...prev, { role: "bot", content: "I encountered an error processing your request. Please try again." }]);
    } finally {
      setIsSendingToBot(false);
    }
  };

  // Open modal to review and edit notice before publishing
  const handleOpenPublishNoticeModal = (content: string) => {
    const formattedTitle = chatBotReport 
      ? `📢 Public Notice: Critical ${chatBotReport.category} Advisory` 
      : "📢 Public Safety Alert";
    
    // Clean up content slightly if it starts with markdown headers
    setNoticeTitle(formattedTitle);
    setNoticeContent(content);
    setNoticeSuccessMessage("");
    setIsPublishNoticeOpen(true);
  };

  // Publish or Update Notice to backend
  const handlePublishNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    setIsPublishingNotice(true);
    try {
      if (editingNotice) {
        const response = await axiosInstance.put(`/notices/${editingNotice._id}`, {
          title: noticeTitle,
          content: noticeContent,
          author: editingNotice.author || "Community Hero Admin"
        });
        if (response.data?.success) {
          setNoticeSuccessMessage("Notice updated successfully! 🎉");
          fetchAdminNotices();
          setTimeout(() => {
            setIsPublishNoticeOpen(false);
            setNoticeSuccessMessage("");
            setEditingNotice(null);
            setNoticeTitle("");
            setNoticeContent("");
          }, 1800);
        }
      } else {
        const response = await axiosInstance.post("/notices", {
          title: noticeTitle,
          content: noticeContent,
          author: "Community Hero Admin"
        });
        if (response.data?.success) {
          setNoticeSuccessMessage("Notice posted successfully to Community Hero Notice Board! 🎉");
          fetchAdminNotices();
          setTimeout(() => {
            setIsPublishNoticeOpen(false);
            setNoticeSuccessMessage("");
            setNoticeTitle("");
            setNoticeContent("");
          }, 1800);
        }
      }
    } catch (err: any) {
      console.error("Failed to publish/update notice:", err);
      alert("Error processing notice: " + (err.response?.data?.message || err.message));
    } finally {
      setIsPublishingNotice(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      const response = await axiosInstance.delete(`/notices/${noticeId}`);
      if (response.data?.success) {
        setAdminNotices((prev) => prev.filter((n) => n._id !== noticeId));
        setSelectedAdminNotice(null);
        setIsDeleteNoticeConfirmOpen(false);
      }
    } catch (err) {
      console.error("Error deleting notice:", err);
      alert("Failed to delete notice.");
    }
  };

  const handleStartEditNotice = (notice: any) => {
    setEditingNotice(notice);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setIsPublishNoticeOpen(true);
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/admin/logout");
    } catch (err) {
      console.warn("Logout endpoint error:", err);
    }
    localStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_token");
    setIsAdminLoggedIn(false);
    setStats(null);
    setComplaints([]);
    setUsers([]);
    navigate("/auth");
  };

  // Handle Status Toggle (Active, Pending, Resolved)
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatusMap: Record<string, "Active" | "Pending" | "Resolved"> = {
      Active: "Pending",
      Pending: "Resolved",
      Resolved: "Active"
    };
    const targetStatus = nextStatusMap[currentStatus] || "Active";

    try {
      const response = await axiosInstance.put(`/admin/complaints/${id}/status`, { status: targetStatus });
      if (response.data?.success) {
        // Instant local sync
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: targetStatus } : c));
        fetchStats(); // Update dashboard metric counts instantly!
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Run RAG-based Urgency Scoring
  const handleCalculateUrgency = async (id: string) => {
    setCalculatingUrgencyId(id);
    try {
      const response = await axiosInstance.post(`/admin/complaints/${id}/urgency-score`);
      if (response.data?.success) {
        const { urgencyScore, isMostUrgent, justification } = response.data;
        // Instant visual update on the card
        setComplaints(prev => prev.map(c => c._id === id ? {
          ...c,
          urgencyScore,
          isMostUrgent,
          urgencyJustification: justification
        } : c));
        fetchStats(); // Stats are refreshed to see updated "Most Urgent" tallies
      }
    } catch (err) {
      console.error("Error calculating urgency:", err);
    } finally {
      setCalculatingUrgencyId(null);
    }
  };

  // Run AI Suggestion Bot for specific Complaint
  const handleFetchSuggestions = async (report: Report) => {
    setSelectedReportForAi(report);
    setAiSuggestions(null);
    setIsGeneratingSuggestions(true);

    try {
      const response = await axiosInstance.get(`/admin/suggestions/${report._id}`);
      if (response.data?.success) {
        setAiSuggestions({
          summary: response.data.summary,
          suggestions: response.data.suggestions
        });
      }
    } catch (err) {
      console.error("Error generating suggestions:", err);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Ban or Unban User
  const handleToggleBanUser = async (id: string) => {
    try {
      const response = await axiosInstance.post(`/admin/users/${id}/ban`);
      if (response.data?.success) {
        const updatedUser = response.data.user;
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isBanned: updatedUser.isBanned } : u));
        fetchStats(); // Refresh stats for logged-in user counts
      }
    } catch (err) {
      console.error("Error changing ban state:", err);
    }
  };

  // Delete User account permanently
  const handleDeleteUser = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/admin/users/${id}`);
      if (response.data?.success) {
        setUsers(prev => prev.filter(u => u._id !== id));
        fetchStats(); // Refresh user count in statistics
        setUserPendingDelete(null); // Reset non-blocking modal confirmation state
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Open upvotes viewer
  const handleOpenUpvoters = (report: Report) => {
    setViewingUpvotersId(report._id);
    setUpvotersList(report.upvotes || []);
  };

  // Filter complaints list locally based on inputs
  const filteredComplaints = complaints.filter(c => {
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch = !realSearchTerm.trim() || 
      c.title.toLowerCase().includes(realSearchTerm.toLowerCase()) ||
      (c._id && c._id.toLowerCase().includes(realSearchTerm.toLowerCase())) ||
      (c.location?.address && c.location.address.toLowerCase().includes(realSearchTerm.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Filter users list locally
  const filteredUsers = users.filter(u => {
    if (!userSearchTerm.trim()) return true;
    const query = userSearchTerm.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u._id.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-[#f7f9fa] font-sans antialiased flex flex-col">
      {/* Top Header - Responsive Padding */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 md:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="bg-[#58cc02] text-white p-2 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Community Hero</h1>
              <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-black tracking-wider uppercase">ADMIN</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Municipal Response Oversight</p>
          </div>
        </div>
        {isAdminLoggedIn && (
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        )}
      </header>

      {!isAdminLoggedIn ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-gray-200/80 p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#58cc02]" />
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-emerald-50 text-[#58cc02] p-4 rounded-2xl mb-4 border border-emerald-100 shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-800 uppercase tracking-tight">Admin Gateway</h2>
              <p className="text-xs text-gray-400 font-medium mt-1">Please authenticate with administrator credentials</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-3 px-4 text-xs font-semibold outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-3 px-4 text-xs font-semibold outline-none transition"
                />
              </div>

              {loginError && (
                <div className="flex items-start space-x-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-600 text-[11px] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#58cc02] text-white rounded-2xl py-3 px-4 text-xs font-extrabold uppercase tracking-widest shadow-md hover:bg-[#46a302] transition disabled:opacity-50"
              >
                {isLoggingIn ? "Authenticating..." : "Authorized Login"}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-gray-100 pt-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Demo Account Access</p>
              <div className="mt-1 bg-slate-50 p-2 rounded-xl text-[10px] font-mono text-slate-500 inline-block border border-gray-100">
                username: admin | password: hero
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-xs text-[#58cc02] hover:text-[#46a302] font-black uppercase tracking-wider transition cursor-pointer"
              >
                Go back to Citizen Area
              </button>
            </div>
          </div>
        </div>
      ) : (
        <main className="flex-1 w-full px-4 md:px-6 py-6 space-y-6">
          
          {/* RESPONSIVE METRICS DASHBOARD - FULL WIDTH */}
          <div className="bg-white border-2 border-gray-100/90 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">Metrics Dashboard</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Real-time statistics & municipal KPIs</p>
              </div>
              <div className="flex items-center space-x-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shrink-0">
                <span className="w-1.5 h-1.5 bg-[#58cc02] rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-[#58cc02] uppercase tracking-wider">Live</span>
              </div>
            </div>

            {/* Resolution Rate bar */}
            {stats?.totalComplaints ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-w-2xl">
                <div className="flex items-center justify-between text-[11px] font-black text-gray-500 uppercase mb-2">
                  <span>Issue Resolution Progress Rate</span>
                  <span className="text-emerald-600">
                    {Math.round(((stats.solvedComplaints || 0) / stats.totalComplaints) * 100)}% ({stats.solvedComplaints}/{stats.totalComplaints} solved)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-[#58cc02] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round(((stats.solvedComplaints || 0) / stats.totalComplaints) * 100))}%` }}
                  />
                </div>
              </div>
            ) : null}
            
            {/* Grid: 2 columns on mobile, 3 on tablet, 6 on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { 
                  label: "Registered Citizens", 
                  val: stats?.totalUsers, 
                  icon: Users, 
                  color: "text-sky-500", 
                  bg: "bg-sky-50",
                  description: "Total registered citizen accounts in the Community Hero ecosystem.",
                  insight: "These verified municipal members participate in reporting, resolving, and upvoting local civil matters." 
                },
                { 
                  label: "Active Online", 
                  val: stats?.activeUsers, 
                  icon: Activity, 
                  color: "text-emerald-500", 
                  bg: "bg-emerald-50",
                  description: "Citizens with active platform interaction within the past 24 hours.",
                  insight: "High online activity ensures rapid community-driven crowdsourcing of civic reports." 
                },
                { 
                  label: "Total Complaints", 
                  val: stats?.totalComplaints, 
                  icon: Clock, 
                  color: "text-slate-500", 
                  bg: "bg-slate-50",
                  description: "Total cumulative volume of civic issues reported since program inception.",
                  insight: "A complete historical archive of all user-filed infrastructure, waste, lighting, and safety concerns." 
                },
                { 
                  label: "Active Issues", 
                  val: stats?.activeComplaints, 
                  icon: AlertTriangle, 
                  color: "text-red-500", 
                  bg: "bg-red-50",
                  description: "Unresolved complaints actively pending validation or dispatch.",
                  insight: "These urgent issues are prioritized by severity and impact score for municipal dispatch." 
                },
                { 
                  label: "Pending Ops", 
                  val: stats?.pendingComplaints, 
                  icon: SlidersHorizontal, 
                  color: "text-amber-500", 
                  bg: "bg-amber-50",
                  description: "Issues currently undergoing operational reviews or field assessments.",
                  insight: "Field operations are currently coordinating resources or planning repairs for these tasks." 
                },
                { 
                  label: "Solved Issues", 
                  val: stats?.solvedComplaints, 
                  icon: CheckCircle2, 
                  color: "text-emerald-600", 
                  bg: "bg-emerald-50",
                  description: "Complaints fully resolved and certified by community officers.",
                  insight: "Resolving issues awards reporting citizens with valuable coins, levels, and level-up milestones." 
                },
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedMetric(item)}
                  className="bg-white border-2 border-gray-100 hover:border-[#58cc02] rounded-2xl p-4 shadow-sm flex items-center space-x-4 transition cursor-pointer hover:scale-[1.03] active:scale-95 duration-200 group"
                  title={`View details of ${item.label}`}
                >
                  <div className={`${item.bg} ${item.color} p-3 rounded-xl border border-current/10 shrink-0 group-hover:scale-105 transition`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider truncate group-hover:text-gray-500 transition">{item.label}</p>
                    <p className="text-lg font-black text-gray-800 leading-tight">
                      {isLoadingStats ? "..." : item.val ?? 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="bg-white border-2 border-gray-100 p-1.5 rounded-2xl flex flex-wrap gap-1.5 shadow-sm max-w-xl">
            <button
              onClick={() => setActiveTab("complaints")}
              className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === "complaints"
                  ? "bg-[#58cc02] text-white shadow-md shadow-emerald-100"
                  : "text-gray-500 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Complaints Feed</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === "users"
                  ? "bg-[#58cc02] text-white shadow-md shadow-emerald-100"
                  : "text-gray-500 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Moderation</span>
            </button>
            <button
              onClick={() => setActiveTab("notices")}
              className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === "notices"
                  ? "bg-[#58cc02] text-white shadow-md shadow-emerald-100"
                  : "text-gray-500 hover:bg-slate-50"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Manage Notices</span>
            </button>
          </div>

          {/* Tab 1: Complaints View */}
          {activeTab === "complaints" ? (
            <div className="space-y-5">
              
              {/* Filter Controls Board */}
              <div className="bg-white border-2 border-gray-100 p-4 rounded-3xl shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={realSearchTerm}
                      onChange={(e) => setRealSearchTerm(e.target.value)}
                      placeholder="Search complaints by title, location address, or ID..."
                      className="w-full bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none transition"
                    />
                  </div>

                  {/* Sorting dropdown */}
                  <div className="flex items-center space-x-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase shrink-0">Sort By:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2 px-3 text-xs font-bold text-gray-700 cursor-pointer outline-none transition"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="upvotes">Community Upvotes</option>
                      <option value="comments">Comments Count</option>
                      <option value="severity">Report Severity</option>
                      <option value="urgency">RAG AI Urgency</option>
                    </select>
                  </div>
                </div>

                {/* Filter Pills row */}
                <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Status:</span>
                    <div className="flex bg-slate-50 border border-gray-200 rounded-xl p-0.5">
                      {["all", "Active", "Pending", "Resolved"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                            statusFilter === status
                              ? "bg-slate-800 text-white shadow-sm"
                              : "text-gray-500 hover:text-slate-800"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Category:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-600 outline-none cursor-pointer"
                    >
                      <option value="all">ALL CATEGORIES</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Waste">Waste</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Water">Water</option>
                      <option value="Safety">Safety</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSortBy("newest");
                      setCategoryFilter("all");
                      setStatusFilter("all");
                      setRealSearchTerm("");
                      fetchComplaints();
                    }}
                    className="text-[10px] font-black text-[#58cc02] bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-lg w-full sm:w-auto sm:ml-auto uppercase tracking-wider transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>

              {/* Feed Content */}
              {isLoadingComplaints ? (
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 shadow-sm">
                  <RefreshCw className="w-8 h-8 text-[#58cc02] animate-spin" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Syncing civic records...</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-16 text-center text-gray-400 font-bold text-xs uppercase tracking-wider shadow-sm">
                  No complaints matches the specified criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {filteredComplaints.map((report) => (
                    <div
                      key={report._id}
                      className={`bg-white border-2 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition relative overflow-hidden flex flex-col md:flex-row md:items-start gap-4 ${
                        report.isMostUrgent 
                          ? "border-red-300 bg-red-50/5" 
                          : report.urgencyScore && report.urgencyScore >= 6 
                          ? "border-amber-200" 
                          : "border-gray-100"
                      }`}
                    >
                      {/* Left color status bar */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        report.status === "Resolved" 
                          ? "bg-emerald-500" 
                          : report.status === "Pending" 
                          ? "bg-amber-500" 
                          : "bg-red-500"
                      }`} />

                      {/* Info & Metadata Panel */}
                      <div className="flex-1 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={report.author?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${report.author?.name}`} 
                              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 shadow-sm shrink-0"
                              alt="author"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-800 leading-none truncate">{report.author?.name || "Unknown Citizen"}</h4>
                              <div className="flex items-center space-x-1.5 mt-1">
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Lvl {report.author?.level || 1}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">• {new Date(report.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions (Status & Profile View) */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <button 
                              onClick={() => navigate(`/profile/${report.author?._id || ''}`)}
                              className="p-1.5 text-slate-400 hover:text-[#58cc02] hover:bg-slate-50 rounded-xl transition-colors"
                              title="View Citizen Profile"
                            >
                              <UserIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(report._id, report.status)}
                              className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition shadow-sm cursor-pointer ${
                                report.status === "Resolved"
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                  : report.status === "Pending"
                                  ? "bg-amber-500 text-white hover:bg-amber-600"
                                  : "bg-red-500 text-white hover:bg-red-600"
                              }`}
                            >
                              {report.status}
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-1 mb-1.5">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                              report.category === "Infrastructure" ? "bg-indigo-50 text-indigo-600" :
                              report.category === "Lighting" ? "bg-amber-50 text-amber-600" :
                              report.category === "Waste" ? "bg-slate-100 text-slate-700" :
                              "bg-emerald-50 text-emerald-600"
                            }`}>
                              {report.category}
                            </span>
                            <span className="text-[9px] text-gray-400 font-mono font-bold uppercase">ID: {report._id.substring(0, 8)}</span>
                          </div>
                          <h3 className="text-sm font-black text-gray-800 leading-tight">{report.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                        </div>

                        {/* Address */}
                        <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-[#58cc02]" />
                          <span>{report.location?.address}</span>
                        </div>

                        {/* Metrics display */}
                        <div className="flex flex-wrap items-center gap-4 border-t border-gray-50 pt-3 text-[10px] text-gray-400 font-black uppercase tracking-wider">
                          <button 
                            onClick={() => handleOpenUpvoters(report)}
                            className="flex items-center space-x-1 hover:text-[#58cc02] transition"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{Array.isArray(report.upvotes) ? report.upvotes.length : 0} Upvotes</span>
                          </button>
                          <button 
                            onClick={() => fetchComments(report._id)}
                            className="flex items-center space-x-1 hover:text-[#58cc02] transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{report.commentsCount ?? 0} Comments</span>
                          </button>
                          <div className="flex items-center space-x-1 text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                            <Flame className="w-3.5 h-3.5" />
                            <span>Severity {report.severity}/10</span>
                          </div>
                        </div>

                        {/* AI PIPELINE SECTIONS INLINE */}
                        <div className="pt-2.5 space-y-2.5 border-t border-gray-100/80">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-2">
                            {/* Score calculation button */}
                            <button
                              onClick={() => handleCalculateUrgency(report._id)}
                              disabled={calculatingUrgencyId === report._id}
                              className="bg-slate-900 text-white hover:bg-slate-800 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center space-x-1 transition disabled:opacity-50"
                            >
                              {calculatingUrgencyId === report._id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <SlidersHorizontal className="w-3 h-3" />
                              )}
                              <span>Run AI Urgency Analysis</span>
                            </button>

                            {/* Suggestions button */}
                            <button
                              onClick={() => handleFetchSuggestions(report)}
                              className="bg-emerald-50 text-[#58cc02] hover:bg-emerald-100 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center space-x-1 transition"
                            >
                              <Bot className="w-3 h-3" />
                              <span>Generate Crew Suggestions</span>
                            </button>

                            {/* Consult bot button */}
                            <button
                              onClick={() => handleOpenChatBot(report)}
                              className="bg-sky-50 text-sky-600 hover:bg-sky-100 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center space-x-1 transition"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Consult Suggesto Bot</span>
                            </button>
                          </div>

                          {/* Urgency scorecard */}
                          {report.urgencyScore ? (
                            <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-start gap-3 transition ${
                              report.isMostUrgent 
                                ? "bg-red-50/50 border-red-200" 
                                : "bg-slate-50 border-gray-200"
                            }`}>
                              <div className={`p-2.5 rounded-xl text-center shrink-0 border ${
                                report.isMostUrgent 
                                  ? "bg-red-100 text-red-600 border-red-200 font-extrabold" 
                                  : "bg-slate-100 text-slate-700 border-slate-200 font-bold"
                              }`}>
                                <div className="text-[8px] uppercase tracking-wider">Score</div>
                                <div className="text-xl leading-none mt-0.5">{report.urgencyScore}/10</div>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5 mb-1 flex-wrap gap-1">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">RAG Urgency Analysis</span>
                                  {report.isMostUrgent && (
                                    <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse shrink-0">CRITICAL PRIORITY</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 italic leading-relaxed font-medium">"{report.urgencyJustification}"</p>
                              </div>
                            </div>
                          ) : null}

                          {/* Suggestions output panel */}
                          {selectedReportForAi?._id === report._id && (
                            <div className="p-4 bg-[#58cc02]/5 border-2 border-[#58cc02]/20 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between border-b border-[#58cc02]/10 pb-2">
                                <span className="text-[10px] font-black text-[#58cc02] uppercase tracking-widest flex items-center">
                                  <Bot className="w-3.5 h-3.5 mr-1" /> Field Crew Tactical Guidance
                                </span>
                                <button 
                                  onClick={() => {
                                    setSelectedReportForAi(null);
                                    setAiSuggestions(null);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded-lg"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {isGeneratingSuggestions ? (
                                <div className="flex items-center space-x-2 py-4 justify-center">
                                  <RefreshCw className="w-4 h-4 text-[#58cc02] animate-spin" />
                                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">AI Strategizing...</span>
                                </div>
                              ) : aiSuggestions ? (
                                <div className="space-y-3">
                                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{aiSuggestions.summary}</p>
                                  <div className="space-y-1.5">
                                    <h5 className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Tactical Action Steps:</h5>
                                    <ul className="space-y-1">
                                      {aiSuggestions.suggestions.map((s, idx) => (
                                        <li key={idx} className="text-xs text-gray-500 leading-relaxed flex items-start">
                                          <span className="text-[#58cc02] mr-2 shrink-0 font-extrabold">•</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "users" ? (
            // Tab 2: User Moderation View
            <div className="space-y-5">
              
              {/* User toolbar */}
              <div className="bg-white border-2 border-gray-100 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search citizens by name, email or account ID..."
                    className="w-full bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none transition"
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                  className="bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  <span>Refresh Users</span>
                </button>
              </div>

              {/* Users list */}
              {isLoadingUsers ? (
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 shadow-sm">
                  <RefreshCw className="w-8 h-8 text-[#58cc02] animate-spin" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading user database...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-16 text-center text-gray-400 font-bold text-xs uppercase tracking-wider shadow-sm">
                  No matching citizens found in the system database.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user._id}
                      className={`bg-white border-2 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between gap-4 transition ${
                        user.isBanned 
                          ? "border-red-200 bg-red-50/5" 
                          : "border-gray-150/80 hover:border-gray-250"
                      }`}
                    >
                      <div className="flex items-start justify-between min-w-0">
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          <img
                            src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
                            alt={user.name}
                            className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-150 shrink-0 shadow-sm cursor-pointer hover:opacity-80 transition"
                            onClick={() => navigate(`/profile/${user._id}`)}
                            title="View Citizen Profile"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <h4 
                                className="font-black text-gray-800 text-xs truncate hover:text-[#58cc02] cursor-pointer transition"
                                onClick={() => navigate(`/profile/${user._id}`)}
                                title="View Citizen Profile"
                              >
                                {user.name}
                              </h4>
                              {user.isBanned && (
                                <span className="bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                  BANNED
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-semibold text-gray-400 truncate mt-0.5">{user.email}</p>
                            <p className="text-[9px] text-gray-400 font-mono font-bold mt-1 uppercase">ID: {user._id.substring(0, 10)}</p>
                          </div>
                        </div>

                        {/* Profile Button */}
                        <button
                          onClick={() => navigate(`/profile/${user._id}`)}
                          className="p-1.5 text-slate-400 hover:text-[#58cc02] hover:bg-slate-50 rounded-xl transition-colors shrink-0"
                          title="View Citizen Profile"
                        >
                          <UserIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Score metrics line */}
                      <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] text-gray-600 font-black uppercase tracking-wider">
                        <span className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <Award className="w-3 h-3 mr-1" /> Lvl {user.level}
                        </span>
                        <span>•</span>
                        <span>🪙 {user.coins} Coins</span>
                        <span>•</span>
                        <span>⭐ {user.xp} XP</span>
                      </div>

                      {/* Banning and deletion buttons */}
                      <div className="flex items-center space-x-2 border-t border-gray-50 pt-3">
                        <button
                          onClick={() => handleToggleBanUser(user._id)}
                          className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition cursor-pointer ${
                            user.isBanned 
                              ? "bg-emerald-50 border-emerald-200 text-[#58cc02] hover:bg-emerald-100" 
                              : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          <Ban className="w-3 h-3" />
                          <span>{user.isBanned ? "Unban Account" : "Ban Account"}</span>
                        </button>

                        <button
                          onClick={() => setUserPendingDelete(user)}
                          className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition"
                          title="Delete Account permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Tab 3: Notices Management View
            <div className="space-y-5">
              <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Community Notice Board Dispatcher</h3>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    Manage safety alerts, official advisories, and public announcements displayed on the city bulletins board.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingNotice(null);
                    setNoticeTitle("");
                    setNoticeContent("");
                    setIsPublishNoticeOpen(true);
                  }}
                  className="bg-[#58cc02] text-white hover:bg-[#46a302] shadow-md px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center space-x-2 shrink-0"
                >
                  <Megaphone className="w-4.5 h-4.5" />
                  <span>Draft New Bulletin</span>
                </button>
              </div>

              {isLoadingNotices ? (
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 shadow-sm">
                  <RefreshCw className="w-8 h-8 text-[#58cc02] animate-spin" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading safety bulletins...</p>
                </div>
              ) : adminNotices.length === 0 ? (
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-16 text-center text-gray-400 font-bold text-xs uppercase tracking-wider shadow-sm">
                  No bulletins posted yet. Draft your first bulletin above.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {adminNotices.map((notice, index) => {
                    // Generate a nice visual representation for the blog card header
                    const headers = [
                      "from-emerald-500 to-teal-600",
                      "from-blue-500 to-indigo-600",
                      "from-orange-500 to-red-600",
                      "from-purple-500 to-pink-600"
                    ];
                    const gradient = headers[index % headers.length];

                    return (
                      <div
                        key={notice._id}
                        onClick={() => {
                          setSelectedAdminNotice(notice);
                          setIsDeleteNoticeConfirmOpen(false);
                        }}
                        className="bg-white border-2 border-gray-150 hover:border-[#58cc02] rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer group transform hover:-translate-y-1"
                      >
                        {/* Decorative Blog Card Cover */}
                        <div className={`h-24 bg-gradient-to-r ${gradient} p-4 flex flex-col justify-end relative overflow-hidden shrink-0`}>
                          <div className="absolute top-2 right-2 bg-white/25 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                            Bulletin #{adminNotices.length - index}
                          </div>
                          <div className="absolute -right-6 -top-6 text-white/10 text-7xl font-black select-none font-mono">
                            GAZETTE
                          </div>
                          <div className="flex items-center space-x-1.5 text-white/95 text-[10px] font-black uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="bg-emerald-50 text-[#58cc02] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-100">
                                {notice.author || "Official dispatch"}
                              </span>
                            </div>
                            <h4 className="font-black text-sm text-gray-800 tracking-tight leading-snug group-hover:text-[#58cc02] transition-colors line-clamp-2">
                              {notice.title}
                            </h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3">
                              {notice.content}
                            </p>
                          </div>

                          <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#58cc02]">
                            <span>Read &amp; Manage</span>
                            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Notice Detail, Update, and Delete Pop-up Modal */}
              {selectedAdminNotice && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white border-3 border-gray-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Modal Header */}
                    <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center space-x-2">
                        <Megaphone className="w-5 h-5 text-[#58cc02]" />
                        <span className="bg-emerald-50 text-[#58cc02] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-100">
                          {selectedAdminNotice.author || "Official Dispatch"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAdminNotice(null);
                          setIsDeleteNoticeConfirmOpen(false);
                        }}
                        className="p-1.5 rounded-xl text-gray-400 hover:bg-slate-200 hover:text-gray-700 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Published on {new Date(selectedAdminNotice.createdAt).toLocaleDateString()} at {new Date(selectedAdminNotice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight leading-snug">
                          {selectedAdminNotice.title}
                        </h3>
                      </div>

                      {/* Content Box */}
                      <div className="text-xs text-gray-700 font-medium leading-relaxed bg-slate-50/50 p-4.5 rounded-2xl border border-slate-150/50 markdown-body font-sans">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedAdminNotice.content}</ReactMarkdown>
                      </div>

                      {/* Beautiful State-Driven Inline Delete Confirmation */}
                      {isDeleteNoticeConfirmOpen && (
                        <div className="bg-red-50 border-2 border-red-150 rounded-2xl p-4.5 space-y-3 animate-in slide-in-from-bottom duration-200">
                          <div className="flex items-start space-x-2.5">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-black text-red-900 uppercase tracking-wider">Irreversible Action</h4>
                              <p className="text-[11px] text-red-700 font-semibold mt-0.5">Are you absolutely sure you want to delete this bulletin? This will immediately remove it from all citizen feeds.</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-end space-x-2.5">
                            <button
                              onClick={() => setIsDeleteNoticeConfirmOpen(false)}
                              className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                            >
                              No, Keep It
                            </button>
                            <button
                              onClick={() => handleDeleteNotice(selectedAdminNotice._id)}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition"
                            >
                              Yes, Delete Bulletin
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer (only visible when not in active delete confirm state) */}
                    <div className="p-5 bg-slate-50 border-t border-gray-150 flex items-center justify-between">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Author: {selectedAdminNotice.author}
                      </div>
                      
                      {!isDeleteNoticeConfirmOpen && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              handleStartEditNotice(selectedAdminNotice);
                              setSelectedAdminNotice(null);
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-gray-200 font-black uppercase tracking-widest px-4 py-2.5 rounded-xl text-[10px] transition shadow-xs flex items-center space-x-1"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                            <span>Update Bulletin</span>
                          </button>
                          <button
                            onClick={() => setIsDeleteNoticeConfirmOpen(true)}
                            className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-100 hover:border-red-500 font-black uppercase tracking-widest px-4 py-2.5 rounded-xl text-[10px] transition shadow-xs flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* Comment Viewer Drawer/Modal */}
          {viewingCommentsId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-gray-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[500px]">
                <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-[#58cc02]" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Citizen Feedback Logs</h3>
                  </div>
                  <button 
                    onClick={() => setViewingCommentsId(null)}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {isLoadingComments ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <RefreshCw className="w-6 h-6 text-[#58cc02] animate-spin" />
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Retrieving logs...</span>
                    </div>
                  ) : commentsList.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                      No citizen comments have been logged for this complaint.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commentsList.map((comment) => (
                        <div key={comment._id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-start space-x-3">
                          <img 
                            src={comment.author?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.author?.name}`} 
                            className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-150 shrink-0 shadow-xs"
                            alt="avatar"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <h5 className="text-xs font-black text-gray-700 leading-none">{comment.author?.name || "Citizen"}</h5>
                              <span className="text-[9px] text-gray-400 font-bold uppercase">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => setViewingCommentsId(null)}
                    className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl transition hover:bg-slate-800"
                  >
                    Close Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upvoters Viewer Modal */}
          {viewingUpvotersId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-gray-200 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[400px]">
                <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ThumbsUp className="w-4 h-4 text-[#58cc02]" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Upvote Endorsements</h3>
                  </div>
                  <button 
                    onClick={() => setViewingUpvotersId(null)}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {upvotersList.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                      No citizen endorsements have been recorded.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {upvotersList.map((user, idx) => (
                        <div key={user._id || idx} className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl">
                          <img 
                            src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} 
                            className="w-8 h-8 rounded-lg bg-slate-100 border shrink-0" 
                            alt="avatar"
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-black text-gray-700 truncate leading-none">{user.name || "Unknown Citizen"}</h5>
                            <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 rounded uppercase tracking-wider mt-1 inline-block">Lvl {user.level || 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => setViewingUpvotersId(null)}
                    className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl hover:bg-slate-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Suggesto Assistant Chat Dialog Modal */}
          {isChatBotOpen && chatBotReport && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-gray-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[550px]">
                {/* Chat Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="bg-[#58cc02] p-1.5 rounded-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm uppercase tracking-wide flex items-center">
                        <span>Suggesto Bot</span>
                        <span className="ml-1.5 text-[8px] bg-[#58cc02] text-white px-1.5 py-0.5 rounded font-black tracking-widest">MUNICIPAL AI</span>
                      </h3>
                      <p className="text-[9px] text-gray-300 truncate font-medium">Re: "{chatBotReport.title}"</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsChatBotOpen(false);
                      setChatBotReport(null);
                      setChatMessages([]);
                    }}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`flex items-start space-x-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                        <div className={`p-1.5 rounded-lg shrink-0 ${m.role === "user" ? "bg-slate-200 text-slate-700" : "bg-[#58cc02] text-white"}`}>
                          {m.role === "user" ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          m.role === "user" 
                            ? "bg-slate-900 text-white rounded-tr-none shadow-sm" 
                            : "bg-white text-gray-700 border border-gray-100 rounded-tl-none shadow-sm font-medium"
                        }`}>
                          {m.role === "bot" ? (
                            <div className="markdown-body">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap">{m.content}</span>
                          )}
                        </div>
                      </div>

                      {m.role === "bot" && (
                        <button
                          onClick={() => handleOpenPublishNoticeModal(m.content)}
                          className="mt-1.5 ml-9 flex items-center space-x-1.5 text-[10px] text-emerald-600 font-extrabold hover:text-[#58cc02] hover:bg-emerald-100/60 transition px-2.5 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100/40 cursor-pointer shadow-xs"
                          title="Click to publish this generated advisory as an official community notice"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>Publish to Notice Page</span>
                        </button>
                      )}
                    </div>
                  ))}

                  {isSendingToBot && (
                    <div className="flex justify-start">
                      <div className="flex items-center space-x-2">
                        <div className="bg-[#58cc02] text-white p-1.5 rounded-lg animate-pulse">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="bg-white border border-gray-150 p-3 rounded-2xl rounded-tl-none flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-3 bg-white border-t border-gray-150 flex items-center space-x-2">
                  <input
                    type="text"
                    value={botInput}
                    onChange={(e) => setBotInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isSendingToBot) {
                        handleSendToBot();
                      }
                    }}
                    placeholder="Ask Suggesto for tactical administrative action..."
                    className="flex-1 bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none transition"
                  />
                  <button
                    onClick={handleSendToBot}
                    disabled={isSendingToBot || !botInput.trim()}
                    className="bg-[#58cc02] hover:bg-[#46a302] text-white p-2.5 rounded-xl transition disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Non-blocking User Deletion Confirmation Modal */}
          {userPendingDelete && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
              <div className="bg-white border-2 border-red-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-3 text-red-600">
                  <div className="p-3 bg-red-50 rounded-2xl">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-gray-800">Confirm Citizen Purge</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Permanent Deletion</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-gray-600 space-y-2">
                  <p>
                    Are you absolutely sure you want to permanently delete <strong className="text-gray-800 font-extrabold">{userPendingDelete.name}</strong>'s profile?
                  </p>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                    ⚠️ Warning: This action cannot be undone. All active sessions, Coins, XP achievements, and levels will be wiped forever from the municipal ledger.
                  </p>
                  <div className="pt-2 border-t border-gray-150 flex items-center space-x-3 text-[10px] text-gray-400">
                    <span className="font-bold">Citizen ID:</span>
                    <span className="font-mono font-bold bg-slate-200/60 px-2 py-0.5 rounded text-gray-700">{userPendingDelete._id}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => setUserPendingDelete(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(userPendingDelete._id)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-red-100 transition cursor-pointer"
                  >
                    Yes, Delete Forever
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Interactive Metric Detailed Info Modal */}
          {selectedMetric && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
              <div className="bg-white border-2 border-gray-150 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${selectedMetric.bg} ${selectedMetric.color} p-3.5 rounded-2xl border border-current/10`}>
                      <selectedMetric.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider">{selectedMetric.label}</h3>
                      <p className="text-[10px] font-black text-[#58cc02] uppercase tracking-widest mt-0.5">Community Metrics</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMetric(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Big Number View */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1">Current Metric Value</span>
                    <span className="text-4xl font-black text-gray-800 tracking-tight block">
                      {isLoadingStats ? "..." : selectedMetric.val ?? 0}
                    </span>
                  </div>

                  {/* Description Box */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                        {selectedMetric.description}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-[#58cc02] uppercase tracking-widest mb-1">Municipal Insight</h4>
                      <p className="text-xs text-slate-500 leading-relaxed italic bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/40">
                        "{selectedMetric.insight}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedMetric(null)}
                    className="w-full py-3 bg-[#58cc02] hover:bg-[#46a302] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-100 transition cursor-pointer text-center"
                  >
                    Got It, Thank You
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Notice Publishing Modal */}
          {isPublishNoticeOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
              <div className="bg-white border-2 border-emerald-100 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 text-emerald-600">
                    <div className="p-3 bg-emerald-50 rounded-2xl">
                      <Megaphone className="w-6 h-6 text-[#58cc02]" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wider text-gray-800">
                        {editingNotice ? "Edit Safety Notice" : "Publish Safety Notice"}
                      </h3>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Community Hero Gazette</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsPublishNoticeOpen(false);
                      setEditingNotice(null);
                      setNoticeTitle("");
                      setNoticeContent("");
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {noticeSuccessMessage ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 text-center space-y-2 py-10 animate-bounce">
                    <span className="text-4xl">🎉</span>
                    <h4 className="font-black text-sm uppercase tracking-wider text-emerald-950">
                      {editingNotice ? "Notice Updated!" : "Notice Dispatched!"}
                    </h4>
                    <p className="text-xs font-semibold text-emerald-700">{noticeSuccessMessage}</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {/* Notice Title input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Notice Title</label>
                      <input
                        type="text"
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        placeholder="Notice Title..."
                        className="w-full bg-slate-50 border-2 border-gray-150 focus:border-[#58cc02] rounded-xl px-4 py-2.5 text-xs font-bold outline-none transition text-gray-800"
                      />
                    </div>

                    {/* Notice Content textarea */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        Notice Content (Supports Markdown)
                      </label>
                      <textarea
                        value={noticeContent}
                        onChange={(e) => setNoticeContent(e.target.value)}
                        placeholder="Enter notice body..."
                        rows={7}
                        className="w-full bg-slate-50 border-2 border-gray-150 focus:border-[#58cc02] rounded-xl px-4 py-3 text-xs font-semibold leading-relaxed outline-none transition text-gray-700 font-sans"
                      />
                    </div>

                    {/* Meta information */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between text-[10px]">
                      <div>
                        <span className="text-gray-400 font-black uppercase tracking-wider">Author Name:</span>
                        <strong className="text-gray-800 ml-1 font-extrabold">
                          {editingNotice?.author || "Community Hero Admin"}
                        </strong>
                      </div>
                      <span className="text-slate-400 font-bold bg-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[8px]">Gazette Feed</span>
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setIsPublishNoticeOpen(false);
                          setEditingNotice(null);
                          setNoticeTitle("");
                          setNoticeContent("");
                        }}
                        disabled={isPublishingNotice}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePublishNotice}
                        disabled={isPublishingNotice || !noticeTitle.trim() || !noticeContent.trim()}
                        className="flex-1 py-3 bg-[#58cc02] hover:bg-[#46a302] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-100 transition cursor-pointer flex items-center justify-center space-x-2"
                      >
                        {isPublishingNotice ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Megaphone className="w-3.5 h-3.5" />
                            <span>{editingNotice ? "Update Notice" : "Publish Notice"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
}
