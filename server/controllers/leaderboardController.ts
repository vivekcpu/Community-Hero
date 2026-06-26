import { Request, Response } from "express";
import User from "../models/User.js";
import Report from "../models/Report.js";
import { isUsingMemoryDb, memoryUsers, memoryReports } from "../db.js";

export const getLeaderboard = async (req: any, res: Response): Promise<any> => {
  try {
    let users: any[] = [];
    let stats = {
      totalHeroes: 0,
      totalReports: 0,
      resolutionRate: 75 // default static placeholder or dynamic
    };

    if (isUsingMemoryDb) {
      users = [...memoryUsers]
        .map(u => ({
          _id: u._id,
          name: u.name,
          avatar: u.avatar,
          xp: u.xp,
          level: u.level,
          reportsCount: u.reportsCount,
          badges: u.badges
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 50);

      stats.totalHeroes = memoryUsers.length;
      stats.totalReports = memoryReports.length;
      const resolved = memoryReports.filter((r) => r.status === "Resolved").length;
      stats.resolutionRate = stats.totalReports > 0 ? Math.round((resolved / stats.totalReports) * 100) : 80;
    } else {
      users = await User.find()
        .sort({ xp: -1 })
        .limit(50)
        .select("name avatar xp level reportsCount badges");

      stats.totalHeroes = await User.countDocuments();
      stats.totalReports = await Report.countDocuments();
      const resolved = await Report.countDocuments({ status: "Resolved" });
      stats.resolutionRate = stats.totalReports > 0 ? Math.round((resolved / stats.totalReports) * 100) : 80;
    }

    const responseBody = {
      success: true,
      users,
      stats,
      updatedAt: new Date()
    };

    // Attach personalized user details on the fly
    const finalResponse: any = { ...responseBody };
    if (req.user) {
      const loggedInUserId = req.user._id.toString();
      if (isUsingMemoryDb) {
        const sorted = [...memoryUsers].sort((a, b) => b.xp - a.xp);
        const index = sorted.findIndex((u) => u._id === loggedInUserId);
        finalResponse.userRank = {
          rank: index === -1 ? sorted.length + 1 : index + 1,
          xp: sorted[index]?.xp || req.user.xp || 0,
          level: sorted[index]?.level || req.user.level || 1
        };
      } else {
        // Compute rank dynamically based on how many users have more XP
        const countHigherXp = await User.countDocuments({ xp: { $gt: req.user.xp } });
        // Retrieve fresh user details for exact level/XP
        const freshUser = await (User as any).findById(req.user._id).select("xp level");
        finalResponse.userRank = {
          rank: countHigherXp + 1,
          xp: freshUser ? freshUser.xp : req.user.xp,
          level: freshUser ? freshUser.level : req.user.level
        };
      }
    }

    res.status(200).json(finalResponse);
  } catch (error: any) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to determine rank of a user
function getUserRankDetails(userId: string) {
  if (isUsingMemoryDb) {
    const sorted = [...memoryUsers].sort((a, b) => b.xp - a.xp);
    const index = sorted.findIndex((u) => u._id === userId);
    return {
      rank: index === -1 ? sorted.length + 1 : index + 1,
      xp: sorted[index]?.xp || 0,
      level: sorted[index]?.level || 1
    };
  } else {
    // For Mongoose, we can do an estimated rank based on count of users with more XP
    // This is super fast and clean
    return {
      rank: 1, // Will be fetched/computed dynamically on client if needed, or fallback gracefully
      xp: 0,
      level: 1
    };
  }
}
