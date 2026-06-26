import express from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { isUsingMemoryDb, memoryUsers } from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_here";

// Optional protect to check current user rank if authenticated
const optionalProtect = async (req: any, res: any, next: any) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id || decoded._id;

      if (isUsingMemoryDb) {
        const user = memoryUsers.find((u) => u._id === userId);
        if (user) {
          req.user = user;
        }
      } else {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          const user = await (User as any).findById(userId).select("-password");
          if (user) {
            req.user = user;
          }
        }
      }
    }
  } catch (err) {
    console.error("Optional protect token verification failed:", err.message);
  }
  next();
};

router.get("/", optionalProtect, getLeaderboard as any);

export default router;
