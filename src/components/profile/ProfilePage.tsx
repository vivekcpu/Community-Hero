import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, updateAvatar, deleteAccount } from "../../store/slices/authSlice.js";
import { RootState, AppDispatch } from "../../store/index.js";
import { Award, LogOut, FileText, Compass, Heart, RefreshCw, Settings, Camera, Trash2, Check, X, Sparkles } from "lucide-react";
import XpBar from "../ui/XpBar.js";
import CoinDisplay from "../ui/CoinDisplay.js";
import NeoCard from "../ui/NeoCard.js";
import axiosInstance from "../../api/axiosInstance.js";
import { IReport, IUser } from "../../types.js";
import ReportCard from "../feed/ReportCard.js";

interface ProfilePageProps {
  userId?: string | null;
  onLogoutSuccess?: () => void;
}

export default function ProfilePage({ userId, onLogoutSuccess }: ProfilePageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const [profileUser, setProfileUser] = useState<IUser | null>(null);
  const [reports, setReports] = useState<IReport[]>([]);
  const [stats, setStats] = useState<{ rank: number; totalXp: number; totalCoins: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [updating, setUpdating] = useState(false);

  // States for Instagram-like device image upload and crop
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgRatio, setImgRatio] = useState<number>(1);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setOffset({ x: 0, y: 0 });
          setZoom(1);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgRatio(img.naturalWidth / img.naturalHeight);
  };

  const targetId = userId || currentUser?._id;
  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    if (!targetId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/users/${targetId}`);
        if (res.data.success) {
          setProfileUser(res.data.user);
          setReports(res.data.reports || []);
          setStats(res.data.stats || null);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetId]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    onLogoutSuccess?.();
  };

  const handleUpdateAvatar = async (url: string) => {
    if (!currentUser) return;
    setUpdating(true);
    try {
      const updated = await dispatch(updateAvatar({ userId: currentUser._id, avatar: url })).unwrap();
      if (updated) {
        setProfileUser(updated);
      }
    } catch (err: any) {
      alert(err || "Failed to update profile picture");
    } finally {
      setUpdating(false);
    }
  };

  const handleCropAndSave = async () => {
    if (!selectedImage) return;
    setUpdating(true);
    try {
      const img = new Image();
      img.src = selectedImage;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setUpdating(false);
          return;
        }

        let drawWidth = 200;
        let drawHeight = 200;
        if (imgRatio > 1) {
          drawHeight = 200;
          drawWidth = 200 * imgRatio;
        } else {
          drawWidth = 200;
          drawHeight = 200 / imgRatio;
        }

        const scaledWidth = drawWidth * zoom;
        const scaledHeight = drawHeight * zoom;

        const x = 100 - scaledWidth / 2 + offset.x;
        const y = 100 - scaledHeight / 2 + offset.y;

        ctx.clearRect(0, 0, 200, 200);
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        const base64Data = canvas.toDataURL("image/jpeg", 0.9);

        if (currentUser) {
          const updated = await dispatch(updateAvatar({ userId: currentUser._id, avatar: base64Data })).unwrap();
          if (updated) {
            setProfileUser(updated);
          }
          setSelectedImage(null);
        }
        setUpdating(false);
      };
    } catch (err: any) {
      console.error("Crop error:", err);
      alert(err || "Failed to crop and save your profile picture");
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    const confirm1 = window.confirm(
      "Are you absolutely sure you want to delete your account? This will permanently delete all your data, coins, and reports."
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "This action is completely irreversible. Click OK to proceed with permanent deletion."
    );
    if (!confirm2) return;

    setUpdating(true);
    try {
      await dispatch(deleteAccount(currentUser._id)).unwrap();
      onLogoutSuccess?.();
    } catch (err: any) {
      alert(err || "Failed to delete account");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 max-w-xl mx-auto">
        <RefreshCw className="w-8 h-8 text-[#58cc02] animate-spin mb-2" />
        <p className="text-xs font-bold text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const activeUser = isOwnProfile ? (profileUser || currentUser) : profileUser;
  if (!activeUser) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-bold text-gray-500">No profile found. Please login.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 pt-4 animate-fade-up">
      {/* Profile Header card */}
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 text-center relative overflow-hidden mb-6 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#84d640] to-[#58cc02]" />

        {isOwnProfile && (
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                showSettings ? "bg-emerald-100 text-[#58cc02]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
              title="Edit Profile & Account Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Big Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 mx-auto mb-3 shadow">
          <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full object-cover" />
        </div>

        <h2 className="text-lg font-extrabold text-gray-800">{activeUser.name}</h2>
        <p className="text-xs text-gray-400 font-medium mb-4">{activeUser.email}</p>

        {/* Settings Panel */}
        {isOwnProfile && showSettings && (
          <div className="max-w-md mx-auto mb-5 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-left animate-fade-down space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center">
                <Settings className="w-3.5 h-3.5 mr-1 text-[#58cc02]" /> Profile & Account Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Picture Section with Instagram-style Cropper */}
            <div className="space-y-3.5 bg-white border border-slate-100 p-4 rounded-2xl">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center">
                <Camera className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Update Profile Picture
              </label>

              {!selectedImage ? (
                <div className="border-2 border-dashed border-slate-200 hover:border-[#58cc02] rounded-2xl p-6 text-center transition bg-slate-50/50 relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={updating}
                  />
                  <Camera className="w-8 h-8 text-slate-400 group-hover:text-[#58cc02] mx-auto mb-2 transition" />
                  <p className="text-xs font-extrabold text-slate-700">Upload Image from Device</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">PNG, JPG, or WEBP · Drag & Drop or Click</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wide">
                    Drag photo to position · Use slider to zoom
                  </p>

                  {/* Cropping Viewport */}
                  <div 
                    className="w-[200px] h-[200px] rounded-full overflow-hidden border-4 border-[#58cc02] relative bg-slate-900 cursor-move mx-auto select-none touch-none shadow-md"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img 
                      src={selectedImage} 
                      alt="Crop preview" 
                      onLoad={onImageLoad}
                      className="absolute pointer-events-none max-w-none"
                      style={{
                        width: imgRatio > 1 ? "auto" : "200px",
                        height: imgRatio > 1 ? "200px" : "auto",
                        left: "50%",
                        top: "50%",
                        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transformOrigin: "center center",
                      }}
                    />
                    {/* Inner Guideline Circular Overlay */}
                    <div className="absolute inset-0 border-2 border-dashed border-white/45 rounded-full pointer-events-none" />
                  </div>

                  {/* Zoom Slider Controls */}
                  <div className="space-y-1.5 px-2">
                    <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <span>Zoom Out</span>
                      <span>{Math.round(zoom * 100)}%</span>
                      <span>Zoom In</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-[#58cc02] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      disabled={updating}
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex space-x-2 pt-1">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={handleCropAndSave}
                      className="flex-1 py-2 bg-[#58cc02] hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                    >
                      {updating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{updating ? "Saving..." : "Crop & Save"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => setSelectedImage(null)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Account Danger Zone */}
            <div className="border-t border-slate-200/60 pt-3">
              <label className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider flex items-center mb-2">
                <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500 animate-pulse" /> Danger Zone
              </label>
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-red-800">Delete Account</h4>
                  <p className="text-[9px] text-red-500 font-medium">Permanently remove your account and all data</p>
                </div>
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleDeleteAccount}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* XP Progress Bar */}
        <div className="max-w-md mx-auto mb-4 bg-slate-50 border border-gray-100 p-4 rounded-2xl">
          <XpBar xp={activeUser.xp} />
        </div>

        {/* Secondary Stats metrics */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-2.5 flex items-center justify-center space-x-2">
            <CoinDisplay coins={activeUser.coins} />
          </div>
          <div className="bg-indigo-50 border border-indigo-200/50 rounded-xl p-2.5 flex items-center justify-center space-x-2 font-sans font-bold text-indigo-700 text-xs">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>{activeUser.reportsCount} Reports</span>
          </div>
        </div>
      </div>

      {/* Earned Milestones / Badges Container */}
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 mb-6">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
          <Award className="w-4 h-4 mr-1 text-yellow-500" /> Earned Badges
        </p>

        {activeUser.badges && activeUser.badges.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {activeUser.badges.map((badge, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-gray-100 rounded-2xl p-3 flex items-center space-x-2 hover:scale-102 transition"
              >
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <h4 className="text-xs font-extrabold text-gray-800">{badge.name}</h4>
                  <p className="text-[9px] font-bold text-emerald-600">Earned Successfully</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <Award className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-gray-400">No badges earned yet. Submit reports to unlock!</p>
          </div>
        )}
      </div>

      {/* User's recent reports timelines */}
      <div className="mb-6">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Reports Submitted</p>
        {reports.length > 0 ? (
          reports.map((report) => <ReportCard key={report._id} report={report as any} />)
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center text-gray-400">
            <Compass className="w-8 h-8 mx-auto mb-1.5 opacity-60 text-emerald-500" />
            <p className="text-xs font-bold">No issues reported yet by this hero.</p>
          </div>
        )}
      </div>

      {/* Guardian Credentials card */}
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
          <Sparkles className="w-4 h-4 mr-1 text-[#58cc02]" /> Guardian Credentials & Verification
        </p>
        <div className="space-y-3.5 font-sans">
          {/* User Name */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Guardian Name</span>
            <span className="text-sm font-extrabold text-gray-800">{activeUser.name}</span>
          </div>

          {/* User ID */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Guardian Account ID</span>
            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{activeUser._id}</span>
          </div>

          {/* Actual Rank */}
          <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Actual Rank Standing</span>
            <span className="text-sm font-extrabold text-[#58cc02] bg-white border border-[#58cc02]/30 px-3 py-1 rounded-xl">
              #{stats?.rank || 1}
            </span>
          </div>

          {/* Actual XP */}
          <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Verified Experience (XP)</span>
            <span className="text-sm font-extrabold text-indigo-600 bg-white border border-indigo-200 px-3 py-1 rounded-xl">
              {activeUser.xp} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
