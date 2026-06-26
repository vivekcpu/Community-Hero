import express from "express";
import { register, login, logout, getMe, googleLogin, googleCallback } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect as any, getMe as any);

// Real production-grade Google authentication endpoints
router.get("/google", googleLogin as any);
router.get("/google/callback", googleCallback as any);

export default router;
