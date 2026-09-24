import express from "express";
import { getUserProfile, getAllUsers, deleteUser, updateUserAvatar, redeemItem } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllUsers as any);
router.get("/:id", getUserProfile as any);
router.put("/:id", protect as any, updateUserAvatar as any);
router.post("/:id/redeem", protect as any, redeemItem as any);
router.delete("/:id", protect as any, deleteUser as any);

export default router;
