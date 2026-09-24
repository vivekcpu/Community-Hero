import React from "react";

interface XpBarProps {
  xp: number;
}

export default function XpBar({ xp }: XpBarProps) {
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXp = xp % 500;
  const nextLevelXpNeeded = 500;
  const percentage = Math.min(100, Math.round((currentLevelXp / nextLevelXpNeeded) * 100));

  return (
    <div className="w-full font-sans">
      <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-1">
        <span>Level {level}</span>
        <span className="text-[#58cc02]">{currentLevelXp} / {nextLevelXpNeeded} XP</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div
          className="h-full bg-gradient-to-r from-[#84d640] to-[#58cc02] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.1)" }}
        />
      </div>
    </div>
  );
}
