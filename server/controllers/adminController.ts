import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Report from "../models/Report.js";
import ReportComment from "../models/Comment.js";
import { isUsingMemoryDb, memoryReports, memoryUsers, memoryComments } from "../db.js";
import { activeSessions } from "../middleware/authMiddleware.js";
import { getGeminiClient, callGeminiWithRetry, safeJsonParse } from "../utils/ai.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_here";

/**
 * Admin Login
 * Credentials: admin / hero
 */
export const adminLogin = async (req: Request, res: Response): Promise<any> => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Please provide username and password" });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  if (cleanUsername === "admin" && cleanPassword === "hero") {
    // Generate an admin token
    const token = jwt.sign({ id: "admin", role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
    
    // Set admin token cookie
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.status(200).json({
      success: true,
      token,
      admin: {
        username: "admin",
        role: "Administrator"
      }
    });
  }

  return res.status(401).json({ success: false, message: "Invalid administrator credentials" });
};

/**
 * Admin Logout
 */
export const adminLogout = async (req: Request, res: Response) => {
  res.clearCookie("admin_token");
  res.status(200).json({ success: true, message: "Admin logged out successfully" });
};

/**
 * Get Admin Stats (Registered users, active users, total complaints, etc)
 */
export const getAdminStats = async (req: Request, res: Response): Promise<any> => {
  try {
    let totalUsers = 0;
    let totalComplaints = 0;
    let solvedComplaints = 0;
    let pendingComplaints = 0;

    if (isUsingMemoryDb) {
      totalUsers = memoryUsers.length;
      totalComplaints = memoryReports.length;
      solvedComplaints = memoryReports.filter((r) => r.status === "Resolved").length;
      pendingComplaints = memoryReports.filter((r) => r.status === "Pending").length;
    } else {
      totalUsers = await (User as any).countDocuments();
      totalComplaints = await (Report as any).countDocuments();
      solvedComplaints = await (Report as any).countDocuments({ status: "Resolved" });
      pendingComplaints = await (Report as any).countDocuments({ status: "Pending" });
    }

    // Active users tracking (within last 15 minutes)
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    let currentActiveUsers = Array.from(activeSessions.entries())
      .filter(([_, timestamp]) => timestamp > fifteenMinutesAgo)
      .length;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers: currentActiveUsers,
        totalComplaints,
        solvedComplaints,
        pendingComplaints,
        activeComplaints: totalComplaints - solvedComplaints - pendingComplaints
      }
    });
  } catch (err: any) {
    console.error("Error getting admin stats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get All Complaints with detailed pagination & multi-criteria sorting
 */
export const getAllComplaints = async (req: Request, res: Response): Promise<any> => {
  try {
    const sortBy = (req.query.sortBy as string) || "newest"; // newest, oldest, upvotes, comments, severity, urgency
    let reports: any[] = [];

    if (isUsingMemoryDb) {
      // Deep clone to avoid mutating standard DB state
      reports = JSON.parse(JSON.stringify(memoryReports));
      
      // Populate author details and comments count if needed
      for (const report of reports) {
        const comments = memoryComments.filter((c) => c.reportId === report._id);
        report.commentsCount = comments.length;
      }
    } else {
      reports = await (Report as any).find()
        .populate("author", "name email avatar level xp")
        .populate("upvotes", "name email avatar level")
        .lean();
        
      // Count comments for each report dynamically
      for (const report of reports) {
        const cCount = await (ReportComment as any).countDocuments({ reportId: report._id });
        report.commentsCount = cCount;
      }
    }

    // Sort the list based on the requested criteria
    reports.sort((a: any, b: any) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "upvotes") {
        const aVotes = Array.isArray(a.upvotes) ? a.upvotes.length : 0;
        const bVotes = Array.isArray(b.upvotes) ? b.upvotes.length : 0;
        return bVotes - aVotes;
      }
      if (sortBy === "comments") {
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      }
      if (sortBy === "severity") {
        return (b.severity || 0) - (a.severity || 0);
      }
      if (sortBy === "urgency") {
        const aUrgency = a.urgencyScore || 0;
        const bUrgency = b.urgencyScore || 0;
        return bUrgency - aUrgency;
      }
      return 0;
    });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err: any) {
    console.error("Error getting complaints:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Toggle Status of a Complaint
 */
export const updateComplaintStatus = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { status } = req.body; // Active, Pending, Resolved

  if (!["Active", "Pending", "Resolved"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  try {
    let updatedReport: any = null;

    if (isUsingMemoryDb) {
      const report = memoryReports.find((r) => r._id === id);
      if (!report) {
        return res.status(404).json({ success: false, message: "Complaint not found" });
      }
      report.status = status;
      updatedReport = { ...report };
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid complaint ID format" });
      }
      updatedReport = await (Report as any).findByIdAndUpdate(id, { status }, { new: true }).populate("author", "name email");
      if (!updatedReport) {
        return res.status(404).json({ success: false, message: "Complaint not found" });
      }
    }

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status} successfully.`,
      report: updatedReport
    });
  } catch (err: any) {
    console.error("Error updating status:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Urgency Scoring via RAG Pipeline
 */
export const calculateUrgencyScore = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    let report: any = null;
    let comments: any[] = [];

    if (isUsingMemoryDb) {
      report = memoryReports.find((r) => r._id === id);
      if (report) {
        comments = memoryComments.filter((c) => c.reportId === id);
      }
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid complaint ID format" });
      }
      report = await (Report as any).findById(id).lean();
      if (report) {
        comments = await (ReportComment as any).find({ reportId: id }).populate("author", "name").lean();
      }
    }

    if (!report) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const commentsText = comments.map((c) => `${c.author?.name || "User"}: ${c.text}`).join("\n");
    const upvoteCount = Array.isArray(report.upvotes) ? report.upvotes.length : 0;
    const severity = report.severity || 5;

    // Call Gemini with RAG Context (Report meta + comment logs)
    const ai = getGeminiClient();
    let score = 5;
    let isMostUrgent = false;
    let justification = "Calculated via automated safety metrics.";

    if (ai) {
      try {
        const prompt = `Task: Calculate Urgency Score (1-10) for a civic complaint.
Context:
- Title: ${report.title}
- Category: ${report.category}
- Initial Severity: ${severity}/10
- Upvotes: ${upvoteCount}
- Description: ${report.description}
- Comments: ${commentsText || "None"}

Output ONLY JSON:
{
  "urgencyScore": number,
  "isMostUrgent": boolean,
  "justification": "Concise 2-sentence explanation."
}`;

        const response = await callGeminiWithRetry(ai, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const rawText = (response.text || "").trim();
        console.log("[Urgency Pipeline] Raw AI Response:", rawText);
        
        // Parse the JSON safely
        const parsed = safeJsonParse(rawText);
        if (parsed) {
          score = Math.max(1, Math.min(10, parsed.urgencyScore || 5));
          isMostUrgent = !!parsed.isMostUrgent;
          justification = parsed.justification || justification;
        }
      } catch (aiErr: any) {
        console.info("[Urgency Pipeline] Gemini call completed with heuristic fallback:", aiErr.message || aiErr);
        // Fallback Heuristic
        score = Math.min(10, Math.round(severity + (upvoteCount * 0.5) + (comments.length * 0.5)));
        if (commentsText.toLowerCase().includes("danger") || commentsText.toLowerCase().includes("injur") || commentsText.toLowerCase().includes("accident") || severity >= 8) {
          score = Math.max(8, score);
        }
        isMostUrgent = score >= 8;
        justification = `Calculated via heuristic analysis. Based on severity of ${severity}, community upvote engagement of ${upvoteCount}, and presence of critical danger keywords in user comments.`;
      }
    } else {
      // Deterministic Fallback Heuristic
      score = Math.min(10, Math.round(severity + (upvoteCount * 0.5) + (comments.length * 0.5)));
      if (commentsText.toLowerCase().includes("danger") || commentsText.toLowerCase().includes("injur") || commentsText.toLowerCase().includes("accident") || severity >= 8) {
        score = Math.max(8, score);
      }
      isMostUrgent = score >= 8;
      justification = `Heuristic fallback (Gemini API key not configured). Analyzed reported severity of ${severity}/10, with ${upvoteCount} upvotes and ${comments.length} citizen comments.`;
    }

    // Persist calculated score inside DB/Memory
    if (isUsingMemoryDb) {
      const idx = memoryReports.findIndex((r) => r._id === id);
      if (idx !== -1) {
        memoryReports[idx].urgencyScore = score;
        memoryReports[idx].isMostUrgent = isMostUrgent;
        memoryReports[idx].urgencyJustification = justification;
      }
    } else {
      await (Report as any).findByIdAndUpdate(id, {
        urgencyScore: score,
        isMostUrgent,
        urgencyJustification: justification
      });
    }

    res.status(200).json({
      success: true,
      urgencyScore: score,
      isMostUrgent,
      justification,
      reportId: id
    });
  } catch (err: any) {
    console.error("Error calculating urgency:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * AI Suggestion Bot
 * Admin inputs a report reference / ID to get a concise summary and step-by-step actionable suggestions
 */
export const getAiSuggestions = async (req: Request, res: Response): Promise<any> => {
  const { reportId } = req.params;

  try {
    let report: any = null;
    let comments: any[] = [];

    if (isUsingMemoryDb) {
      report = memoryReports.find((r) => r._id === reportId);
      if (report) {
        comments = memoryComments.filter((c) => c.reportId === reportId);
      }
    } else {
      if (mongoose.Types.ObjectId.isValid(reportId)) {
        report = await (Report as any).findById(reportId).lean();
        if (report) {
          comments = await (ReportComment as any).find({ reportId }).populate("author", "name").lean();
        }
      }
    }

    if (!report) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const commentsText = comments.map((c) => `- ${c.author?.name || "User"}: ${c.text}`).join("\n");
    const ai = getGeminiClient();

    let summary = "";
    let suggestions: string[] = [];

    if (ai) {
      try {
        const prompt = `Task: Provide administrative summary and 3-4 actionable field crew steps.
Complaint: ${report.title} (${report.category}, Severity ${report.severity}/10)
Description: ${report.description}
Address: ${report.location?.address}
User Feedback: ${commentsText || "None"}

Output ONLY JSON:
{
  "summary": "Concise executive summary.",
  "suggestions": ["Specific field recommendation", "Another step", "etc."]
}`;

        const response = await callGeminiWithRetry(ai, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const rawText = (response.text || "").trim();
        const parsed = safeJsonParse(rawText);
        if (parsed) {
          summary = parsed.summary;
          suggestions = parsed.suggestions;
        }
      } catch (aiErr: any) {
        console.info("[Suggestion Bot] Gemini call completed with standard heuristic fallback:", aiErr.message || aiErr);
      }
    }

    // High quality deterministic backup suggestions if AI is unavailable or fails
    if (!summary || !suggestions || suggestions.length === 0) {
      summary = `The complaint "${report.title}" describes a ${report.category} issue of severity ${report.severity}/10 located at ${report.location?.address || "unspecified location"}. There are currently ${comments.length} user comments detailing public concerns.`;
      
      if (report.category === "Infrastructure") {
        suggestions = [
          "Deploy warning signage and traffic cones immediately to alert oncoming drivers.",
          "Dispatch an emergency road maintenance unit to fill potholes or repair asphalt defects.",
          "Initiate structural assessment of adjacent pavement to prevent expansion of fractures."
        ];
      } else if (report.category === "Lighting") {
        suggestions = [
          "Deploy temporary solar light towers to illuminate high-pedestrian zones tonight.",
          "Dispatch a technician to inspect the light fixture, photosensor, and power circuit.",
          "Schedule permanent replacement of malfunctioning LED bulbs within 24 hours."
        ];
      } else if (report.category === "Waste") {
        suggestions = [
          "Dispatch rapid-pickup waste team to empty overflowing trash receptacles.",
          "Sweep and sanitize surrounding lawn/pavement to restore sanitation and prevent rodent attraction.",
          "Evaluate waste bin capacity and schedule more frequent pick-up intervals at this location."
        ];
      } else {
        suggestions = [
          "Issue rapid dispatch order for an on-site inspection team within 12 hours.",
          "Implement temporary safety cordons or warnings if immediate physical danger exists.",
          "Update status to Pending on citizen dashboard to notify the community of administrative action."
        ];
      }
    }

    res.status(200).json({
      success: true,
      summary,
      suggestions,
      reportId
    });
  } catch (err: any) {
    console.error("Error getting suggestions:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get All Registered Users
 */
export const getAllUsersAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    let users: any[] = [];
    if (isUsingMemoryDb) {
      users = [...memoryUsers];
    } else {
      users = await (User as any).find().select("-password").lean();
    }
    res.status(200).json({ success: true, users });
  } catch (err: any) {
    console.error("Error getting users:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete User Account (and their associated reports if wanted)
 */
export const deleteUserAdmin = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    if (isUsingMemoryDb) {
      const idx = memoryUsers.findIndex((u) => u._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "User not found in memory DB" });
      }
      memoryUsers.splice(idx, 1);
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid user ID format" });
      }
      const deleted = await (User as any).findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "User not found in database" });
      }
    }

    res.status(200).json({ success: true, message: "User account deleted successfully." });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ban User Account
 */
export const banUserAdmin = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    if (isUsingMemoryDb) {
      const user = memoryUsers.find((u) => u._id === id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      user.isBanned = !user.isBanned; // Toggle ban state
      return res.status(200).json({
        success: true,
        message: `User ban status has been set to ${user.isBanned}`,
        user
      });
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid user ID format" });
      }
      const user = await (User as any).findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      const isCurrentlyBanned = (user as any).isBanned || false;
      const updatedUser = await (User as any).findByIdAndUpdate(
        id,
        { isBanned: !isCurrentlyBanned },
        { new: true }
      ).select("-password");

      return res.status(200).json({
        success: true,
        message: `User ban status has been set to ${!isCurrentlyBanned}`,
        user: updatedUser
      });
    }
  } catch (err: any) {
    console.error("Error banning user:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get comments for a specific report (Admin view)
 */
export const getReportComments = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    let comments: any[] = [];
    if (isUsingMemoryDb) {
      comments = memoryComments.filter(c => c.reportId === id);
    } else {
      comments = await (ReportComment as any).find({ reportId: id })
        .populate("author", "name avatar level")
        .sort({ createdAt: -1 });
    }
    res.json({ success: true, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin Chat Bot Interaction
 */
export const adminChatBot = async (req: Request, res: Response): Promise<any> => {
  const { message, history, context } = req.body;
  const ai = getGeminiClient();
  
  if (!ai) {
    return res.json({ 
      success: true, 
      reply: "I am currently in maintenance mode. Please try again later." 
    });
  }

  try {
    // Construct a rich prompt with history
    const historyText = Array.isArray(history) 
      ? history.map((m: any) => `${m.role === "user" ? "Admin" : "Suggesto"}: ${m.content}`).join("\n")
      : "";

    const prompt = `You are "Suggesto", a concise municipal AI assistant.
Context: ${context.title} (${context.category}, Severity ${context.severity})
Desc: ${context.description}
Address: ${context.location?.address}

History:
${historyText}

Admin: ${message}

Task: Provide professional, actionable advice using markdown formatting (bullet points, bolding) where appropriate. Be extremely concise.`;

    const response = await callGeminiWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const reply = response.text || "I'm sorry, I couldn't generate a response.";
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error("ChatBot Error, using elegant fallback:", err);
    // Provide an elegant fallback response rather than failing with 500
    const category = context.category || "General";
    const title = context.title || "Complaint";
    const reply = `### 📋 Citizen Care Heuristic Assistant (AI Offline)

I am currently operating in backup mode due to high API demand. I have analyzed your complaint **"${title}"** under **${category}**:

- **Immediate Action**: Dispatch a local field unit to verify the details at ${context.location?.address || "the reported coordinates"}.
- **Community Transparency**: Update the status on the citizen dashboard to **Pending** or **Active** so residents know action is being taken.
- **Safety Precaution**: If there is immediate danger (Severity ${context.severity || 5}/10), deploy safety barriers or caution signs.

*I am ready for any other queries you have!*`;

    res.json({ success: true, reply });
  }
};
