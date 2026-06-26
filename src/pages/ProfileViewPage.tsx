import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfilePage from "../components/profile/ProfilePage.js";
import { ArrowLeft } from "lucide-react";

export default function ProfileViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to previous</span>
        </button>
      </div>
      <ProfilePage userId={id} onLogoutSuccess={() => navigate("/auth")} />
    </div>
  );
}
