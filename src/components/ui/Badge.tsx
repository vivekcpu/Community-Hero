import React from "react";

interface BadgeProps {
  label: string;
  variant?: "Infrastructure" | "Waste" | "Lighting" | "Water" | "Safety" | "Other" | "Resolved" | "Active" | "Pending";
}

export default function Badge({ label, variant = "Other" }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case "Infrastructure":
        return "bg-orange-50 text-orange-600 border border-orange-200";
      case "Waste":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Lighting":
        return "bg-yellow-50 text-yellow-600 border border-yellow-200";
      case "Water":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Safety":
        return "bg-red-50 text-red-600 border border-red-200";
      case "Resolved":
        return "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "Pending":
        return "bg-orange-100 text-orange-700 border border-orange-300";
      case "Active":
        return "bg-sky-100 text-sky-700 border border-sky-300";
      case "Other":
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-sans uppercase tracking-wider ${getColors()}`}>
      {label}
    </span>
  );
}
