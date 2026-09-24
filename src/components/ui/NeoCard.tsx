import React, { ReactNode } from "react";

interface NeoCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export default function NeoCard({ children, className = "", id, onClick }: NeoCardProps) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white border-2 border-gray-200/80 rounded-2xl p-5 hover:border-gray-300 transition-all duration-200 ${
        onClick ? "cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
      style={{
        boxShadow: "0 8px 0 #e5e7eb"
      }}
    >
      {children}
    </div>
  );
}
