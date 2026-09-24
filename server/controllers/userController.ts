import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Report from "../models/Report.js";
import { isUsingMemoryDb, memoryUsers, memoryReports } from "../db.js";

export const getUserProfile = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    if (isUsingMemoryDb) {
      const user = memoryUsers.find((u) => u._id === id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Filter reports authored by this user, sorted newest first
      const userReports = memoryReports
        .filter((r) => {
          const authorId = r.author && typeof r.author === "object" ? r.author._id : r.author;
          return authorId === id;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      // Estimate ranking
      const sortedUsers = [...memoryUsers].sort((a, b) => b.xp - a.xp);
      const rankIndex = sortedUsers.findIndex((u) => u._id === id);
      const rank = rankIndex === -1 ? sortedUsers.length + 1 : rankIndex + 1;

      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          coins: user.coins,
          xp: user.xp,
          level: user.level,
          badges: user.badges,
          reportsCount: user.reportsCount,
          createdAt: user.createdAt
        },
        reports: userReports,
        stats: {
          rank,
          totalXp: user.xp,
          totalCoins: user.coins
        }
      });
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "User not found (invalid ID format)" });
      }
      const user = await (User as any).findById(id).select("-password");
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const userReports = await (Report as any).find({ author: id })
        .sort({ createdAt: -1 })
        .limit(10);

      // Compute rank dynamically
      const countHigherXp = await User.countDocuments({ xp: { $gt: user.xp } });
      const rank = countHigherXp + 1;

      res.status(200).json({
        success: true,
        user,
        reports: userReports,
        stats: {
          rank,
          totalXp: user.xp,
          totalCoins: user.coins
        }
      });
    }
  } catch (error: any) {
    console.error("User profile fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    if (isUsingMemoryDb) {
      return res.status(200).json({ success: true, users: memoryUsers });
    } else {
      const users = await (User as any).find().select("-password").sort({ createdAt: -1 });
      return res.status(200).json({ success: true, users });
    }
  } catch (error: any) {
    console.error("Fetch users error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: any, res: Response): Promise<any> => {
  const { id } = req.params;
  const loggedInUserId = req.user._id.toString();

  if (loggedInUserId !== id) {
    return res.status(403).json({ success: false, message: "Not authorized to delete this account" });
  }

  try {
    if (isUsingMemoryDb) {
      const index = memoryUsers.findIndex((u) => u._id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "User not found in memory" });
      }
      memoryUsers.splice(index, 1);
      return res.status(200).json({ success: true, message: "User deleted successfully" });
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "User not found (invalid ID format)" });
      }
      const deletedUser = await (User as any).findByIdAndDelete(id);
      if (!deletedUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, message: "User deleted successfully" });
    }
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserAvatar = async (req: any, res: Response): Promise<any> => {
  const { id } = req.params;
  const { avatar } = req.body;
  const loggedInUserId = req.user._id.toString();

  if (loggedInUserId !== id) {
    return res.status(403).json({ success: false, message: "Not authorized to update this profile picture" });
  }

  try {
    if (isUsingMemoryDb) {
      const user = memoryUsers.find((u) => u._id === id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      user.avatar = avatar;
      return res.status(200).json({ success: true, user });
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "User not found (invalid ID format)" });
      }
      const user = await (User as any).findByIdAndUpdate(id, { avatar }, { new: true }).select("-password");
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, user });
    }
  } catch (error: any) {
    console.error("Update avatar error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const redeemItem = async (req: any, res: Response): Promise<any> => {
  const { id } = req.params;
  const { itemCost, itemName } = req.body;
  const loggedInUserId = req.user._id.toString();

  if (loggedInUserId !== id) {
    return res.status(403).json({ success: false, message: "Not authorized to perform this action" });
  }

  if (!itemCost || itemCost < 600) {
    return res.status(400).json({ success: false, message: "Invalid prize selection. Goodies cost at least 600 coins." });
  }

  try {
    if (isUsingMemoryDb) {
      const user = memoryUsers.find((u) => u._id === id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (user.coins < itemCost) {
        return res.status(400).json({ success: false, message: "Insufficient coins to redeem this item" });
      }

      user.coins -= itemCost;
      return res.status(200).json({ 
        success: true, 
        message: `Successfully redeemed a ${itemName}! 🎉 Check your email for delivery details.`, 
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          coins: user.coins,
          xp: user.xp,
          level: user.level,
          badges: user.badges,
          reportsCount: user.reportsCount,
          createdAt: user.createdAt
        }
      });
    } else {
      const user = await (User as any).findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (user.coins < itemCost) {
        return res.status(400).json({ success: false, message: "Insufficient coins to redeem this item" });
      }

      user.coins -= itemCost;
      await user.save();

      const updatedUser = await (User as any).findById(id).select("-password");

      return res.status(200).json({ 
        success: true, 
        message: `Successfully redeemed a ${itemName}! 🎉 Check your email for delivery details.`, 
        user: updatedUser 
      });
    }
  } catch (error: any) {
    console.error("Redeem item error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


