import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  adminLogin,
  adminLogout,
  getAdminStats,
  getAllComplaints,
  updateComplaintStatus,
  calculateUrgencyScore,
  getAiSuggestions,
  getAllUsersAdmin,
  deleteUserAdmin,
  banUserAdmin,
  getReportComments,
  adminChatBot
} from "../controllers/adminController.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_here";

/**
 * Middleware to protect Admin Routes
 */
const adminProtect = (req: Request, res: Response, next: NextFunction): any => {
  try {
    let token = req.cookies?.admin_token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. Administrator privileges required." });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden. Not an administrator." });
    }

    next();
  } catch (err: any) {
    console.error("[Admin Guard] Error verifying admin session:", err.message);
    return res.status(401).json({ success: false, message: "Session expired or invalid token." });
  }
};

// Public Admin Auth Routes
router.post("/login", adminLogin as any);
router.post("/logout", adminLogout as any);

// Protected Admin Routes
router.get("/stats", adminProtect, getAdminStats as any);
router.get("/complaints", adminProtect, getAllComplaints as any);
router.put("/complaints/:id/status", adminProtect, updateComplaintStatus as any);
router.get("/complaints/:id/comments", adminProtect, getReportComments as any);
router.post("/complaints/:id/urgency-score", adminProtect, calculateUrgencyScore as any);
router.get("/suggestions/:reportId", adminProtect, getAiSuggestions as any);
router.post("/chat", adminProtect, adminChatBot as any);

// User Moderation Routes
router.get("/users", adminProtect, getAllUsersAdmin as any);
router.delete("/users/:id", adminProtect, deleteUserAdmin as any);
router.post("/users/:id/ban", adminProtect, banUserAdmin as any);

export default router;
