import React, { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function GlassCard({ children, className = "", id }: GlassCardProps) {
  return (
    <div
      id={id}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        border: "0.5px solid rgba(88, 204, 2, 0.2)",
        borderRadius: "14px",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)"
      }}
    >
      {children}
    </div>
  );
}
