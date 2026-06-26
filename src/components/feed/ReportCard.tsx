import React, { useState } from "react";
import { ThumbsUp, MapPin, MessageSquare, Volume2, Calendar, Edit2, Trash2, X } from "lucide-react";
import { IReport, IUser } from "../../types.js";
import { formatDistanceToNow } from "date-fns";
import Badge from "../ui/Badge.js";
import SeverityBar from "../ui/SeverityBar.js";
import NeoCard from "../ui/NeoCard.js";
import { useDispatch, useSelector } from "react-redux";
import { upvoteReport, editReport, deleteReport } from "../../store/slices/reportsSlice.js";
import { RootState, AppDispatch } from "../../store/index.js";
import CommentSection from "./CommentSection.js";

interface ReportCardProps {
  key?: any;
  report: IReport;
  onAuthorClick?: (authorId: string) => void;
}

export default function ReportCard({ report, onAuthorClick }: ReportCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [isUpvoteAnimating, setIsUpvoteAnimating] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(report.commentsCount || 0);

  // Edit/Delete States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(report.title);
  const [editDescription, setEditDescription] = useState(report.description);
  const [editCategory, setEditCategory] = useState(report.category);
  const [editSeverity, setEditSeverity] = useState(report.severity);
  const [editAddress, setEditAddress] = useState(report.location?.address || "");
  const [isSaving, setIsSaving] = useState(false);

  // Author could be populated or just ID
  const author = typeof report.author === "object" ? (report.author as IUser) : null;
  const authorId = typeof report.author === "string" ? report.author : report.author?._id;

  const isUpvoted = currentUser ? report.upvotes.includes(currentUser._id) : false;
  const isOwner = currentUser && authorId && currentUser._id.toString() === authorId.toString();

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setIsUpvoteAnimating(true);
    dispatch(upvoteReport(report._id));
    setTimeout(() => setIsUpvoteAnimating(false), 300);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) return;

    setIsSaving(true);
    try {
      await dispatch(
        editReport({
          reportId: report._id,
          reportData: {
            title: editTitle,
            description: editDescription,
            category: editCategory,
            severity: editSeverity,
            location: {
              coordinates: report.location?.coordinates || [0, 0],
              address: editAddress,
            },
          },
        })
      ).unwrap();
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update report: " + err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      try {
        await dispatch(deleteReport(report._id)).unwrap();
      } catch (err) {
        alert("Failed to delete report: " + err);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (isEditing) {
    return (
      <div className="animate-fade-up">
        <NeoCard className="mb-6 relative overflow-hidden bg-white p-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Edit Your Post</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Report Title</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2 px-3 text-xs font-semibold outline-none transition"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
              <textarea
                required
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2 px-3 text-xs font-semibold outline-none transition"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as IReport["category"])}
                className="w-full bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2 px-3 text-xs font-semibold outline-none transition"
              >
                {["Infrastructure", "Waste", "Lighting", "Water", "Safety", "Other"].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Range Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Severity level</label>
                <span className="text-xs font-extrabold text-amber-500">{editSeverity}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={editSeverity}
                onChange={(e) => setEditSeverity(Number(e.target.value))}
                className="w-full accent-[#58cc02]"
              />
            </div>

            {/* Address Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Location Address</span>
              </label>
              <input
                type="text"
                required
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full bg-slate-50 border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2 px-3 text-xs font-semibold outline-none transition"
              />
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 border-2 border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-500 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-[#58cc02] text-white font-bold text-xs rounded-xl shadow hover:bg-emerald-600 transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <NeoCard className="mb-6 relative overflow-hidden bg-white">
        {/* Card Header: Author Profile */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar block */}
            <div
              onClick={() => authorId && onAuthorClick?.(authorId)}
              className="w-10 h-10 rounded-full cursor-pointer overflow-hidden border border-emerald-100 flex items-center justify-center bg-gradient-to-tr from-[#84d640] to-[#58cc02] text-white text-xs font-bold font-mono shadow-sm hover:scale-105 transition"
            >
              {author?.avatar ? (
                <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(author?.name || "Hero")}</span>
              )}
            </div>

            {/* Author info */}
            <div>
              <div className="flex items-center space-x-2">
                <span
                  onClick={() => authorId && onAuthorClick?.(authorId)}
                  className="text-sm font-bold text-gray-800 cursor-pointer hover:text-[#58cc02]"
                >
                  {author?.name || (author?.email ? author.email.split("@")[0] : "Hero")}
                </span>
                <span className="bg-emerald-50 text-[#58cc02] text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                  Lvl {author?.level || 1}
                </span>
              </div>
              <div className="flex flex-col">
                {authorId && (
                  <span className="text-[9px] font-mono text-gray-400 leading-tight">
                    ID: {authorId}
                  </span>
                )}
                <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                  {report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : "just now"}
                </p>
              </div>
            </div>
          </div>

          {/* Status badge & Owner Actions */}
          <div className="flex items-center space-x-2">
            {isOwner && (
              <div className="flex items-center space-x-1.5 mr-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-[#58cc02] hover:bg-emerald-50 rounded-lg transition"
                  title="Edit Report"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  title="Delete Report"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <Badge label={report.status} variant={report.status} />
          </div>
        </div>

        {/* Category Badge & Title */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge label={report.category} variant={report.category} />
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              report.severity > 7 
                ? "bg-rose-50 text-rose-600 border border-rose-100" 
                : report.severity > 3 
                ? "bg-amber-50 text-amber-600 border border-amber-100" 
                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            }`}>
              Severity: {report.severity}/10
            </span>
          </div>
        </div>
        <h3 className="text-base font-extrabold text-gray-800 mb-2">{report.title}</h3>

        {/* Report Image Thumbnail */}
        {report.imageUrl && (
          <div className="w-full h-48 rounded-xl overflow-hidden mb-4 border border-gray-100 bg-gray-50 flex items-center justify-center">
            <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        {/* Report Description */}
        <p className="text-sm text-gray-600 mb-4 leading-relaxed font-sans">{report.description}</p>

        {/* Audio Complaint Player if present */}
        {report.audioUrl && (
          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4">
            <div className="p-2 bg-[#58cc02] rounded-full text-white animate-pulse">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-800">Voice Complaint Recorded</p>
              <audio src={report.audioUrl} controls className="w-full mt-1.5 h-8 scale-95" />
            </div>
          </div>
        )}

        {/* Geo-Location Address */}
        {report.location?.address && (
          <div className="flex items-center text-xs font-semibold text-[#777777] mb-4">
            <MapPin className="w-3.5 h-3.5 mr-1 text-rose-500 shrink-0" />
            <span className="truncate">{report.location.address}</span>
          </div>
        )}

        {/* Severity Bar */}
        <div className="border-t border-gray-100 pt-3 mb-4">
          <SeverityBar severity={report.severity} />
        </div>

        {/* Bottom Interactive Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          {/* Upvote Button */}
          <button
            onClick={handleUpvote}
            disabled={!currentUser}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition duration-150 ${
              isUpvoted
                ? "bg-[#EAFCD6] border-[#58cc02] text-[#46a302]"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            } ${!currentUser ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"} ${
              isUpvoteAnimating ? "scale-110" : ""
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isUpvoted ? "fill-[#58cc02]" : ""}`} />
            <span>{report.upvotes.length} Upvotes</span>
          </button>

          {/* Comments and Share count simulation */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition duration-150 cursor-pointer active:scale-95 ${
              showComments
                ? "bg-slate-100 border-slate-300 text-slate-800"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentsCount} Comments</span>
          </button>
        </div>

        {/* LinkedIn style Comments Drawer/Section */}
        {showComments && (
          <CommentSection
            reportId={report._id}
            currentUser={currentUser}
            onCommentAdded={(newCount) => setCommentsCount(newCount)}
          />
        )}
      </NeoCard>
    </div>
  );
}
