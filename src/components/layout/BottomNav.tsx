import React from "react";
import { MessageSquare, Camera, Trophy, User, Megaphone, Gift } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "feed", label: "Feed", icon: MessageSquare },
    { id: "notices", label: "Notices", icon: Megaphone },
    { id: "report", label: "Report", icon: Camera },
    { id: "store", label: "Redeem", icon: Gift },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 py-2 px-6 flex justify-between items-center shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center relative py-1 px-3"
          >
            {/* Tab Icon */}
            <Icon
              className={`w-5.5 h-5.5 transition-transform duration-200 ${
                isActive ? "text-[#58cc02] scale-110" : "text-gray-400"
              }`}
            />
            {/* Duolingo Green Indicator Dot */}
            {isActive && (
              <span className="absolute bottom-0 w-1.5 h-1.5 bg-[#58cc02] rounded-full animate-ping-once" />
            )}
            <span
              className={`text-[9px] font-bold mt-1 transition-colors duration-200 ${
                isActive ? "text-[#58cc02]" : "text-gray-400"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
