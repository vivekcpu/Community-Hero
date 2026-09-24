import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Megaphone, Calendar, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axiosInstance from "../../api/axiosInstance";

interface Notice {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/notices");
      if (response.data?.success) {
        setNotices(response.data.notices);
      } else {
        setError("Could not load community notices.");
      }
    } catch (err: any) {
      console.error("Error loading notices:", err);
      setError("Failed to fetch notices. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div id="notices-page-container" className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#58cc02]/10 rounded-2xl">
            <Megaphone className="w-6 h-6 text-[#58cc02]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">MUNICIPAL GAZETTE</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Official Updates & Safety Alerts</p>
          </div>
        </div>

        <button
          onClick={fetchNotices}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-50 border border-gray-150 text-gray-500 hover:text-gray-800 hover:bg-slate-100 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Notices List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-[#58cc02] animate-spin" />
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Retrieving bulletins...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-100 text-red-800 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h4 className="font-bold text-sm uppercase">Bulletin Board Offline</h4>
          <p className="text-xs">{error}</p>
          <button
            onClick={fetchNotices}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-black uppercase tracking-wider rounded-xl transition"
          >
            Retry Connection
          </button>
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-slate-50 border border-slate-150 rounded-3xl p-10 text-center space-y-3">
          <span className="text-4xl">🕊️</span>
          <h4 className="font-black text-sm uppercase tracking-wider text-gray-700">All Clear & Secure</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium leading-relaxed">
            There are no active safety notices or municipal alerts at this time. Check back later for official city updates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice, idx) => (
            <motion.div
              id={`notice-card-${notice._id}`}
              key={notice._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => setSelectedNotice(notice)}
              className="bg-white border-2 border-gray-100 hover:border-[#58cc02] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 space-y-3 relative overflow-hidden cursor-pointer group"
            >
              {/* Highlight strip for admin postings */}
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#58cc02] group-hover:w-2 transition-all duration-200" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-50 border border-emerald-100 text-[#58cc02] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Official Advisory
                  </span>
                </div>
                <div className="flex items-center text-gray-400 text-[10px] font-bold space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(notice.createdAt)}</span>
                </div>
              </div>

              <div className="pl-2">
                <h3 className="font-black text-sm sm:text-base text-gray-800 tracking-tight leading-snug group-hover:text-[#58cc02] transition-colors">
                  {notice.title}
                </h3>
              </div>

              <div className="pl-2 pr-1">
                <div className="text-xs text-gray-600 font-semibold leading-relaxed bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/50 markdown-body font-sans max-h-24 overflow-hidden relative">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{notice.content}</ReactMarkdown>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50/80 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Click to read full prompt */}
              <div className="pl-2 text-[10px] text-[#58cc02] font-black uppercase tracking-widest flex items-center space-x-1">
                <span>Click to read full bulletin</span>
                <span>→</span>
              </div>

              {/* Author Footer */}
              <div className="flex items-center justify-between border-t border-gray-50 pt-3 pl-2 text-[10px]">
                <div className="flex items-center space-x-2 text-slate-700 font-extrabold">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-100 flex items-center justify-center bg-[#58cc02]/10 shrink-0">
                    <img 
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(notice.author)}`} 
                      alt={notice.author} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-gray-700 text-xs font-black">{notice.author}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#58cc02] shrink-0" />
                </div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  City Hall Dispatch
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detailed Notice Viewer Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-3 border-gray-200 rounded-3xl w-full max-w-lg shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-slate-50">
              <div className="space-y-1">
                <span className="bg-emerald-100 border border-emerald-200 text-[#58cc02] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                  Official City Bulletin
                </span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-1">
                  Posted: {formatDate(selectedNotice.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-slate-200 hover:text-gray-700 transition"
              >
                <span className="text-xs font-black uppercase px-2 py-1">Close</span>
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h3 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight leading-snug">
                {selectedNotice.title}
              </h3>

              <div className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 markdown-body font-sans">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNotice.content}</ReactMarkdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-700 font-extrabold">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-100 flex items-center justify-center bg-[#58cc02]/10 shrink-0">
                  <img 
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(selectedNotice.author)}`} 
                    alt={selectedNotice.author} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="text-gray-800 text-xs font-black">{selectedNotice.author}</div>
                  <div className="text-[9px] text-[#58cc02] font-black uppercase tracking-widest">Verified Dispatcher</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="bg-[#58cc02] text-white hover:bg-[#46a302] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl text-[10px] shadow-sm shadow-emerald-100 transition-all cursor-pointer"
              >
                Acknowledged
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
