import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { isUsingMemoryDb, memoryUsers } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_here";

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    avatar: string;
    coins: number;
    xp: number;
    level: number;
    badges: any[];
    reportsCount: number;
  };
}

// Global registry of active user sessions (userId -> lastActiveTimestamp)
export const activeSessions = new Map<string, number>();

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    let user: any = null;

    if (isUsingMemoryDb) {
      user = memoryUsers.find((u) => u._id === decoded.id || u._id === decoded._id);
      if (!user) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found in memory" });
      }
    } else {
      const userId = decoded.id || decoded._id;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ success: false, message: "Not authorized, invalid token identifier format" });
      }
      user = await (User as any).findById(userId).select("-password");
      if (!user) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found" });
      }
    }

    // Check if the user is banned
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "Your account has been banned by an administrator." });
    }

    req.user = user;

    // Track active session
    if (user._id) {
      activeSessions.set(user._id.toString(), Date.now());
    }

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};
