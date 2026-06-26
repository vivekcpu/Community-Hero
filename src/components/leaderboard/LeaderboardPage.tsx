import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeaderboard } from "../../store/slices/leaderboardSlice.js";
import { RootState, AppDispatch } from "../../store/index.js";
import { Trophy, ShieldAlert, Sparkles, User, FileText, CheckCircle } from "lucide-react";
import NeoCard from "../ui/NeoCard.js";

interface LeaderboardPageProps {
  onNavigateProfile?: (userId: string) => void;
}

export default function LeaderboardPage({ onNavigateProfile }: LeaderboardPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { users, stats, userRank, loading, error } = useSelector((state: RootState) => state.leaderboard);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const topThree = users.slice(0, 3);
  const remaining = users.slice(3);

  // Emojis for top rankings
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 pt-4 animate-fade-up">
      {/* Global Impact Stats Box */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-3 text-center shadow-sm">
          <User className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
          <h4 className="text-sm font-extrabold text-gray-800">{stats.totalHeroes}</h4>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Heroes</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-3 text-center shadow-sm">
          <FileText className="w-4 h-4 mx-auto mb-1 text-sky-500" />
          <h4 className="text-sm font-extrabold text-gray-800">{stats.totalReports}</h4>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Reports Logged</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-3 text-center shadow-sm">
          <CheckCircle className="w-4 h-4 mx-auto mb-1 text-indigo-500" />
          <h4 className="text-sm font-extrabold text-gray-800">{stats.resolutionRate}%</h4>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Solved Rate</p>
        </div>
      </div>

      {/* Top 3 podium block layouts */}
      {topThree.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Top 3 Guardians</h3>
          <div className="flex items-end justify-center space-x-3 pt-6 pb-2">
            
            {/* 2nd place podium */}
            {topThree[1] && (
              <div
                onClick={() => onNavigateProfile?.(topThree[1]._id)}
                className="flex flex-col items-center flex-1 cursor-pointer transform hover:scale-102 transition"
              >
                <div className="relative mb-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-300 shadow bg-slate-100 flex items-center justify-center">
                    <img src={topThree[1].avatar} alt={topThree[1].name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-3 -right-1 text-base">{medals[1]}</span>
                </div>
                <div className="bg-white border-2 border-b-0 border-gray-200 rounded-t-xl px-2 py-3 w-full text-center h-24 flex flex-col justify-between shadow-[0_-4px_8px_rgba(0,0,0,0.02)]">
                  <div>
                    <p className="text-xs font-extrabold text-gray-800 truncate">{topThree[1].name.split(" ")[0]}</p>
                    <p className="text-[10px] font-bold text-gray-400">Level {topThree[1].level}</p>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-500">{topThree[1].xp} XP</span>
                </div>
              </div>
            )}

            {/* 1st place podium */}
            {topThree[0] && (
              <div
                onClick={() => onNavigateProfile?.(topThree[0]._id)}
                className="flex flex-col items-center flex-1 cursor-pointer transform hover:scale-105 transition z-10"
              >
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-yellow-400 shadow-md bg-amber-50 flex items-center justify-center relative">
                    <img src={topThree[0].avatar} alt={topThree[0].name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce">{medals[0]}</span>
                </div>
                <div className="bg-[#FFFDF5] border-2 border-b-0 border-yellow-200 rounded-t-2xl px-2 py-4 w-full text-center h-28 flex flex-col justify-between shadow-lg">
                  <div>
                    <p className="text-xs font-extrabold text-yellow-800 truncate">{topThree[0].name.split(" ")[0]}</p>
                    <p className="text-[10px] font-bold text-yellow-600">Level {topThree[0].level}</p>
                  </div>
                  <span className="text-xs font-extrabold text-yellow-600 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 mr-0.5" /> {topThree[0].xp} XP
                  </span>
                </div>
              </div>
            )}

            {/* 3rd place podium */}
            {topThree[2] && (
              <div
                onClick={() => onNavigateProfile?.(topThree[2]._id)}
                className="flex flex-col items-center flex-1 cursor-pointer transform hover:scale-102 transition"
              >
                <div className="relative mb-2">
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-600 bg-amber-50 flex items-center justify-center">
                    <img src={topThree[2].avatar} alt={topThree[2].name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-3 -right-1 text-base">{medals[2]}</span>
                </div>
                <div className="bg-white border-2 border-b-0 border-gray-200 rounded-t-xl px-2 py-3 w-full text-center h-20 flex flex-col justify-between shadow-[0_-4px_8px_rgba(0,0,0,0.02)]">
                  <div>
                    <p className="text-xs font-extrabold text-gray-800 truncate">{topThree[2].name.split(" ")[0]}</p>
                    <p className="text-[10px] font-bold text-gray-400">Level {topThree[2].level}</p>
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-700">{topThree[2].xp} XP</span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Ranks 4+ List */}
      <div className="space-y-3 mb-6">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Top Contributors</p>

        {remaining.map((user, idx) => {
          const rank = idx + 4;
          const isMe = currentUser && currentUser._id === user._id;

          return (
            <div
              key={user._id}
              onClick={() => onNavigateProfile?.(user._id)}
              className={`bg-white border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition hover:border-gray-300 ${
                isMe ? "border-[#58cc02] bg-emerald-50/20" : "border-gray-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-5 text-xs font-extrabold text-gray-400">{rank}</span>
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-gray-100" />
                <div>
                  <h4 className="text-xs font-extrabold text-gray-800">{user.name}</h4>
                  <p className="text-[9px] font-bold text-gray-400">Level {user.level} · {user.reportsCount} reports</p>
                </div>
              </div>
              <span className={`text-xs font-extrabold ${isMe ? "text-[#58cc02]" : "text-gray-500"}`}>{user.xp} XP</span>
            </div>
          );
        })}
      </div>

      {/* Sticky Own Rank Info Box if authenticated */}
      {userRank && currentUser && (
        <NeoCard id="sticky-own-rank-card" className="bg-emerald-50 border-2 border-[#58cc02] p-5 flex flex-col space-y-3.5 mt-6 shadow-md">
          <div className="flex items-center justify-between border-b border-emerald-100/60 pb-2.5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#58cc02] flex items-center justify-center text-white text-xs font-extrabold shadow">
                #{userRank.rank}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-emerald-900">{currentUser.name}</h4>
                <p className="text-[10px] text-emerald-600/80 font-mono tracking-wider font-semibold">ID: {currentUser._id}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end space-y-1">
              <div>
                <span className="bg-[#58cc02] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm inline-block uppercase tracking-wider">
                  Level {userRank.level}
                </span>
              </div>
              <div className="text-[10px] font-extrabold text-emerald-700/90 tracking-wider uppercase">
                Status: {userRank.level >= 15 ? "Elite Guardian" : userRank.level >= 10 ? "Master Guardian" : userRank.level >= 5 ? "Senior Guardian" : "Guardian"}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-1 font-sans">
            <div className="bg-white/60 border border-emerald-100 rounded-xl p-2.5">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">Actual Rank</span>
              <p className="text-sm font-black text-[#58cc02]">Rank #{userRank.rank}</p>
            </div>
            <div className="bg-white/60 border border-emerald-100 rounded-xl p-2.5 text-right">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">Verified Experience</span>
              <p className="text-sm font-black text-emerald-800">{userRank.xp} XP</p>
            </div>
          </div>
        </NeoCard>
      )}
    </div>
  );
}
