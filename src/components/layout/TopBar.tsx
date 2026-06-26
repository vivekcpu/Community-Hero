import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/index.js";
import { Award } from "lucide-react";
import CoinDisplay from "../ui/CoinDisplay.js";
import { Link, useNavigate } from "react-router-dom";

interface TopBarProps {
  onNavigate?: (tab: string) => void;
  activeTab?: string;
}

export default function TopBar({ onNavigate, activeTab }: TopBarProps) {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Superhero Cape Chick Bird Logo (styled SVG)
  const HeroBirdLogo = () => (
    <svg className="w-10 h-10 mr-2 drop-shadow-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bird Body */}
      <circle cx="50" cy="50" r="30" fill="#E0F2FE" />
      <circle cx="50" cy="48" r="28" fill="#F0F9FF" />
      {/* Eyes */}
      <circle cx="42" cy="42" r="4" fill="#1E293B" />
      <circle cx="58" cy="42" r="4" fill="#1E293B" />
      <circle cx="43" cy="41" r="1.5" fill="#FFFFFF" />
      <circle cx="59" cy="41" r="1.5" fill="#FFFFFF" />
      {/* Beak */}
      <path d="M46 48 L54 48 L50 56 Z" fill="#F59E0B" />
      {/* Rosy Cheeks */}
      <circle cx="36" cy="48" r="3" fill="#FDA4AF" opacity="0.6" />
      <circle cx="64" cy="48" r="3" fill="#FDA4AF" opacity="0.6" />
      {/* Green Hero Cape */}
      <path d="M22 46 C15 35 10 50 16 65 C22 75 35 75 42 66" fill="#58CC02" stroke="#46A302" strokeWidth="2" />
      {/* Green Bow Tie */}
      <path d="M46 59 L54 59 L50 63 Z" fill="#58CC02" />
      <circle cx="50" cy="59" r="2" fill="#46A302" />
    </svg>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center cursor-pointer" onClick={() => onNavigate?.("feed")}>
          <HeroBirdLogo />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold font-sans tracking-tight text-gray-800">Community Hero</h1>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Civic Guardian</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        {isAuthenticated && onNavigate && (
          <nav className="hidden md:flex items-center space-x-1 font-sans text-sm font-bold">
            <button
              onClick={() => onNavigate("feed")}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === "feed" ? "bg-emerald-50 text-[#58cc02]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => onNavigate("notices")}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === "notices" ? "bg-emerald-50 text-[#58cc02]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Notices
            </button>
            <button
              onClick={() => onNavigate("report")}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === "report" ? "bg-emerald-50 text-[#58cc02]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Snap & Voice
            </button>
            <button
              onClick={() => onNavigate("leaderboard")}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === "leaderboard" ? "bg-emerald-50 text-[#58cc02]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => onNavigate("store")}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === "store" ? "bg-emerald-50 text-[#58cc02]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Redeem
            </button>
            <button
              onClick={() => onNavigate("profile")}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === "profile" ? "bg-emerald-50 text-[#58cc02]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              My Profile
            </button>
          </nav>
        )}

        {/* User Stats Display */}
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-3">
            {/* Level Badge */}
            <div className="flex items-center bg-emerald-50 border border-emerald-200/80 rounded-full px-2.5 py-1 text-xs font-bold text-emerald-700">
              <Award className="w-3.5 h-3.5 mr-1 text-[#58cc02]" />
              Level {user.level}
            </div>

            {/* Coins Display */}
            <CoinDisplay coins={user.coins} />

            {/* Mini Avatar */}
            <img
              src={user.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Demo"}
              alt="Avatar"
              onClick={() => onNavigate?.("profile")}
              className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer object-cover hover:scale-105 transition"
            />
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="text-xs font-semibold text-gray-400">Join the cause!</div>
          </div>
        )}
      </div>
    </header>
  );
}
