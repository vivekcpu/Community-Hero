import React, { useState, useEffect } from "react";
import { Send, CornerDownRight, MessageSquare, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import axiosInstance from "../../api/axiosInstance.js";
import { IUser } from "../../types.js";

interface CommentSectionProps {
  reportId: string;
  currentUser: IUser | null;
  onCommentAdded: (newCount: number) => void;
}

export default function CommentSection({ reportId, currentUser, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [reportId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/reports/${reportId}/comments`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await axiosInstance.post(`/reports/${reportId}/comments`, {
        text: newCommentText.trim()
      });

      if (res.data.success) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewCommentText("");
        onCommentAdded(res.data.commentsCount);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!currentUser || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await axiosInstance.post(`/reports/${reportId}/comments`, {
        text: replyText.trim(),
        parentId
      });

      if (res.data.success) {
        setComments((prev) => [...prev, res.data.comment]);
        setReplyText("");
        setActiveReplyId(null);
        onCommentAdded(res.data.commentsCount);
      }
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Group comments: Parents and children
  const parentComments = comments.filter((c) => !c.parentId);
  const repliesGroupedByParent = comments.reduce((acc, comment) => {
    if (comment.parentId) {
      if (!acc[comment.parentId]) {
        acc[comment.parentId] = [];
      }
      acc[comment.parentId].push(comment);
    }
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
      {/* Post a comment section */}
      {currentUser ? (
        <form onSubmit={handlePostComment} className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-100 flex items-center justify-center bg-gradient-to-tr from-[#84d640] to-[#58cc02] text-white text-[10px] font-bold font-mono">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(currentUser.name)}</span>
            )}
          </div>
          <div className="flex-1 relative">
            <textarea
              placeholder="Add a public comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              rows={1}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#58cc02] focus:bg-white rounded-2xl py-2 pl-4 pr-10 text-xs font-semibold outline-none transition resize-none"
              style={{ minHeight: "38px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={submittingComment || !newCommentText.trim()}
              className="absolute right-2.5 top-2 text-[#58cc02] hover:text-emerald-600 disabled:opacity-40 transition active:scale-90 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-gray-500 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Please sign in to join the conversation.</span>
        </div>
      )}

      {/* Loading spinner */}
      {loading && comments.length === 0 ? (
        <div className="flex items-center justify-center py-4 space-x-2">
          <div className="w-1.5 h-1.5 bg-[#58cc02] rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="w-1.5 h-1.5 bg-[#58cc02] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="w-1.5 h-1.5 bg-[#58cc02] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-gray-400 font-medium italic text-center py-2">
          Be the first to share your thoughts on this report!
        </p>
      ) : (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {parentComments.map((comment) => {
            const commentAuthor = comment.author;
            const replies = repliesGroupedByParent[comment._id] || [];

            return (
              <div key={comment._id} className="space-y-2">
                {/* Parent comment row */}
                <div className="flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-50 flex items-center justify-center bg-emerald-500 text-white text-[9px] font-bold shrink-0 mt-0.5">
                    {commentAuthor?.avatar ? (
                      <img src={commentAuthor.avatar} alt={commentAuthor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(commentAuthor?.name || "Hero")}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    {/* Balloon */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2 text-xs font-semibold">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-gray-800 text-[11px]">
                            {commentAuthor?.name || "Community Member"}
                          </span>
                          <span className="bg-emerald-100/60 text-[#58cc02] text-[8px] font-black px-1.5 py-0.5 rounded">
                            Lvl {commentAuthor?.level || 1}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium leading-relaxed font-sans pr-1 break-words">
                        {comment.text}
                      </p>
                    </div>

                    {/* Actions bar (Reply button) */}
                    {currentUser && (
                      <div className="flex items-center space-x-3 mt-1 ml-2">
                        <button
                          onClick={() => {
                            if (activeReplyId === comment._id) {
                              setActiveReplyId(null);
                            } else {
                              setActiveReplyId(comment._id);
                              setReplyText("");
                            }
                          }}
                          className="text-[10px] font-black text-gray-400 hover:text-[#58cc02] transition cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-nested replies list */}
                {replies.length > 0 && (
                  <div className="pl-6 space-y-3 border-l-2 border-slate-100/80 ml-3.5 mt-1">
                    {replies.map((reply) => {
                      const replyAuthor = reply.author;
                      return (
                        <div key={reply._id} className="flex items-start space-x-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-50 flex items-center justify-center bg-emerald-400 text-white text-[8px] font-bold shrink-0">
                            {replyAuthor?.avatar ? (
                              <img src={replyAuthor.avatar} alt={replyAuthor.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{getInitials(replyAuthor?.name || "Hero")}</span>
                            )}
                          </div>
                          <div className="flex-1 bg-slate-50/70 border border-slate-100/60 rounded-2xl px-3 py-1.5 text-xs font-semibold">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-gray-800 text-[10px]">
                                  {replyAuthor?.name || "Community Member"}
                                </span>
                                <span className="bg-emerald-50 text-[#58cc02] text-[7px] font-black px-1 py-0.5 rounded">
                                  Lvl {replyAuthor?.level || 1}
                                </span>
                              </div>
                              <span className="text-[8px] text-gray-400 font-medium">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-600 font-medium leading-relaxed font-sans break-words">
                              {reply.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply box input */}
                {activeReplyId === comment._id && currentUser && (
                  <form
                    onSubmit={(e) => handlePostReply(e, comment._id)}
                    className="flex items-start pl-6 space-x-2.5 ml-3.5 mt-1.5"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-100 flex items-center justify-center bg-slate-300 text-white text-[7px] font-bold shrink-0">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{getInitials(currentUser.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        placeholder="Reply to this comment..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={1}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:border-[#58cc02] focus:bg-white rounded-xl py-1 px-3 pr-8 text-[11px] font-semibold outline-none transition resize-none"
                        style={{ minHeight: "28px" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handlePostReply(e, comment._id);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={submittingReply || !replyText.trim()}
                        className="absolute right-2 top-1 text-[#58cc02] hover:text-emerald-600 disabled:opacity-40 transition cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
