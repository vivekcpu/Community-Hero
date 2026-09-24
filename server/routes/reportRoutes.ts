import express from "express";
import { createReport, getReports, upvoteReport, analyzeImage, transcribeAudio, getComments, addComment, updateReport, deleteReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerMiddleware.js";

const router = express.Router();

// Public feed view
router.get("/", getReports as any);

// Protected report submissions, upvotes, & comments
router.post("/", protect as any, createReport as any);
router.put("/:id", protect as any, updateReport as any);
router.delete("/:id", protect as any, deleteReport as any);
router.post("/:id/upvote", protect as any, upvoteReport as any);
router.get("/:id/comments", getComments as any);
router.post("/:id/comments", protect as any, addComment as any);

// Multimodal AI endpoints
router.post("/analyze-image", protect as any, upload.single("image"), analyzeImage as any);
router.post("/transcribe-audio", protect as any, upload.single("audio"), transcribeAudio as any);

export default router;
