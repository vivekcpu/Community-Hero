import React from "react";
import { Coins } from "lucide-react";

interface CoinDisplayProps {
  coins: number;
  className?: string;
}

export default function CoinDisplay({ coins, className = "" }: CoinDisplayProps) {
  return (
    <div
      className={`inline-flex items-center bg-[#FFFBEB] border-2 border-[#FEF3C7] rounded-xl px-2.5 py-1 font-sans font-bold text-[#D97706] text-xs shadow-sm hover:scale-105 transition-transform ${className}`}
    >
      <div className="w-4 h-4 rounded-full bg-[#F59E0B] flex items-center justify-center mr-1 text-white text-[10px] font-extrabold animate-pulse">
        🪙
      </div>
      <span>{coins}</span>
    </div>
  );
}
