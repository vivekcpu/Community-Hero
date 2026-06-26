import React from "react";

interface SeverityBarProps {
  severity: number;
}

export default function SeverityBar({ severity }: SeverityBarProps) {
  const percentage = Math.min(100, Math.round((severity / 10) * 100));

  const getBarColor = () => {
    if (severity <= 3) return "bg-emerald-500";
    if (severity <= 7) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getLabel = () => {
    if (severity <= 3) return "Low Priority";
    if (severity <= 7) return "Medium Priority";
    return "High Priority";
  };

  return (
    <div className="w-full font-sans">
      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
        <span>Severity Score</span>
        <span className={`font-semibold ${severity > 7 ? "text-rose-600" : severity > 3 ? "text-amber-600" : "text-emerald-600"}`}>
          {severity}/10 ({getLabel()})
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div
          className={`h-full ${getBarColor()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
