import express, { Request, Response } from "express";
import { isUsingMemoryDb, memoryNotices } from "../db.js";
import Notice from "../models/Notice.js";

const router = express.Router();

// GET /api/notices
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    if (isUsingMemoryDb) {
      // Return memory notices sorted by createdAt desc
      const sorted = [...memoryNotices].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      return res.status(200).json({ success: true, notices: sorted });
    } else {
      const notices = await Notice.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, notices });
    }
  } catch (err: any) {
    console.error("Error fetching notices:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notices
router.post("/", async (req: Request, res: Response): Promise<any> => {
  const { title, content, author } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ success: false, message: "Title and content are required." });
  }

  try {
    const newNoticeData = {
      title,
      content,
      author: author || "Community Hero Admin",
      createdAt: new Date()
    };

    if (isUsingMemoryDb) {
      const newNotice = {
        _id: "notice_" + Date.now(),
        ...newNoticeData
      };
      memoryNotices.push(newNotice);
      return res.status(201).json({ success: true, notice: newNotice });
    } else {
      const newNotice = await Notice.create(newNoticeData);
      return res.status(201).json({ success: true, notice: newNotice });
    }
  } catch (err: any) {
    console.error("Error creating notice:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notices/:id
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { title, content, author } = req.body;

  try {
    if (isUsingMemoryDb) {
      const noticeIndex = memoryNotices.findIndex((n) => n._id === id);
      if (noticeIndex === -1) {
        return res.status(404).json({ success: false, message: "Notice not found." });
      }
      if (title !== undefined) memoryNotices[noticeIndex].title = title;
      if (content !== undefined) memoryNotices[noticeIndex].content = content;
      if (author !== undefined) memoryNotices[noticeIndex].author = author;
      return res.status(200).json({ success: true, notice: memoryNotices[noticeIndex] });
    } else {
      const updated = await (Notice as any).findByIdAndUpdate(
        id,
        { title, content, author },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: "Notice not found." });
      }
      return res.status(200).json({ success: true, notice: updated });
    }
  } catch (err: any) {
    console.error("Error updating notice:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notices/:id
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    if (isUsingMemoryDb) {
      const noticeIndex = memoryNotices.findIndex((n) => n._id === id);
      if (noticeIndex === -1) {
        return res.status(404).json({ success: false, message: "Notice not found." });
      }
      memoryNotices.splice(noticeIndex, 1);
      return res.status(200).json({ success: true, message: "Notice deleted successfully." });
    } else {
      const deleted = await (Notice as any).findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Notice not found." });
      }
      return res.status(200).json({ success: true, message: "Notice deleted successfully." });
    }
  } catch (err: any) {
    console.error("Error deleting notice:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
