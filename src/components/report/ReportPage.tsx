import React, { useState } from "react";
import ImageReport from "./ImageReport.js";
import VoiceReport from "./VoiceReport.js";
import { Camera, Mic, Sparkles } from "lucide-react";

interface ReportPageProps {
  onSuccessSubmit?: () => void;
}

export default function ReportPage({ onSuccessSubmit }: ReportPageProps) {
  const [reportMode, setReportMode] = useState<"image" | "voice">("image");

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 pt-4 animate-fade-up">
      {/* Selector Mode Button Cards */}
      <div className="mb-6 bg-white border-2 border-gray-200 rounded-2xl p-2 flex space-x-2">
        <button
          onClick={() => setReportMode("image")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
            reportMode === "image"
              ? "bg-[#58cc02] text-white shadow"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Snap & Assess</span>
        </button>
        <button
          onClick={() => setReportMode("voice")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
            reportMode === "voice"
              ? "bg-[#58cc02] text-white shadow"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Hero Voice</span>
        </button>
      </div>

      {/* Dynamic Render Mode Components */}
      {reportMode === "image" ? (
        <ImageReport onSuccess={onSuccessSubmit} />
      ) : (
        <VoiceReport onSuccess={onSuccessSubmit} />
      )}
    </div>
  );
}
