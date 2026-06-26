import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/index.js";
import { logoutUser } from "../../store/slices/authSlice.js";
import axiosInstance from "../../api/axiosInstance.js";
import { Shield, X, Trash2, Search, Database, Users, AlertCircle, Sparkles } from "lucide-react";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  coins: number;
  xp: number;
  level: number;
  createdAt?: string;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminUsersModal({ isOpen, onClose }: AdminUsersModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [isUsingMemoryDb, setIsUsingMemoryDb] = useState(false);

  // Fetch users when modal is open
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/users");
      if (response.data?.success) {
        setUsers(response.data.users || []);
        // Determine if using memory DB from the route or database state
        // (the server sets memory mode warn/logs but we can also detect it if there's user_demo_1 in results)
        const hasDemoUsers = (response.data.users || []).some((u: any) => u._id.startsWith("user_demo_"));
        setIsUsingMemoryDb(hasDemoUsers);
      } else {
        setError("Failed to fetch users list.");
      }
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setError(err.response?.data?.message || "An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoadingId(userId);
    try {
      const response = await axiosInstance.delete(`/users/${userId}`);
      if (response.data?.success) {
        // If current logged-in user deleted themselves, force logout
        if (currentUser && currentUser._id === userId) {
          alert("You have deleted your own account. Logging out now.");
          dispatch(logoutUser());
          onClose();
          window.location.href = "/auth";
        } else {
          // Remove from local list state
          setUsers((prev) => prev.filter((u) => u._id !== userId));
        }
      } else {
        alert(response.data?.message || "Failed to delete user.");
      }
    } catch (err: any) {
      console.error("Delete user error:", err);
      alert(err.response?.data?.message || "Error deleting user. Make sure you are authorized.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Container */}
      <div 
        className="bg-white border-3 border-gray-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col"
        style={{ boxShadow: "8px 8px 0px #0f172a" }}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b-3 border-slate-900">
          <div className="flex items-center space-x-2.5">
            <div className="bg-rose-500 p-1.5 rounded-lg border border-rose-400">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-sans font-black text-lg tracking-tight">Database & User Management</h3>
              <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider flex items-center mt-0.5">
                <Database className="w-3 h-3 mr-1" />
                {isUsingMemoryDb ? "Running on In-Memory Sandbox" : "Running on Live MongoDB Database"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info notice banner */}
        <div className="bg-slate-50 px-5 py-3 border-b-2 border-slate-100 flex items-center space-x-2 text-xs font-semibold text-slate-600">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            {isUsingMemoryDb 
              ? "Since no MongoDB URI is set, users are saved in the temporary server memory. Restarts clear this."
              : "Active MongoDB configuration is loaded. Accounts are persisted permanently in your database."}
          </span>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:outline-none text-sm font-semibold transition"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Refresh List</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-grow overflow-y-auto p-4 max-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wider">Syncing database...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold text-center">
              {error}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-semibold text-sm">
              No matching users found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map((user) => {
                const isCurrent = currentUser?._id === user._id;
                return (
                  <div 
                    key={user._id}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition ${
                      isCurrent 
                        ? "bg-emerald-50/50 border-emerald-200" 
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={user.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Demo"}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-gray-100 bg-slate-50 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-bold text-gray-800 text-sm truncate">{user.name}</h4>
                          {isCurrent && (
                            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-400 truncate">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-gray-500 font-bold">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">Lvl {user.level}</span>
                          <span>🪙 {user.coins} Coins</span>
                          <span>⭐ {user.xp} XP</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteUser(user._id, user.email)}
                      disabled={deleteLoadingId === user._id}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition disabled:opacity-50 shrink-0"
                      title={isCurrent ? "Delete my account" : "Delete user"}
                    >
                      {deleteLoadingId === user._id ? (
                        <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider">
          <span>Total: {filteredUsers.length} active account(s)</span>
          <span className="text-slate-500 flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-yellow-500" /> Civic Hero Admin tools
          </span>
        </div>
      </div>
    </div>
  );
}
