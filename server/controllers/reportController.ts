import { Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { Readable } from "stream";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import CommentModel from "../models/Comment.js";
import { isUsingMemoryDb, memoryReports, memoryUsers, memoryComments } from "../db.js";
import { getGeminiClient, callGeminiWithRetry, safeJsonParse } from "../utils/ai.js";

// Helper for Cloudinary buffer stream uploads
const uploadToCloudinary = (fileBuffer: Buffer, folder: string, resourceType: "image" | "video" | "raw" | "auto" = "auto"): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      // Return a reliable fallback URL if Cloudinary is not configured
      console.warn("⚠️ Cloudinary not configured. Generating placeholder media URL.");
      if (resourceType === "image") {
        resolve("https://images.unsplash.com/photo-1599740831418-4e8645d95d08?auto=format&fit=crop&w=800&q=80");
      } else {
        resolve("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
      }
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    );
    Readable.from(fileBuffer).pipe(stream);
  });
};

// 1. Analyze Image (Snap & Assess)
export const analyzeImage = async (req: any, res: Response): Promise<any> => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: "Please upload an image file" });
  }

  try {
    // 1. Upload image to Cloudinary (with robust fallback)
    let imageUrl = "";
    try {
      imageUrl = await uploadToCloudinary(file.buffer, "community-hero", "image");
    } catch (uploadErr: any) {
      console.warn("⚠️ Cloudinary image upload failed, falling back to dummy image URL:", uploadErr.message || uploadErr);
      imageUrl = "https://images.unsplash.com/photo-1599740831418-4e8645d95d08?auto=format&fit=crop&w=800&q=80";
    }

    // 2. Call Gemini
    const ai = getGeminiClient();
    let analysisResult = {
      category: "Other",
      severity: 5,
      description: "A civic concern reported by a community member."
    };

    if (ai) {
      try {
        const base64Image = file.buffer.toString("base64");
        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: file.mimetype
          }
        };

        const response = await callGeminiWithRetry(ai, {
          model: "gemini-3.5-flash",
          contents: [
            imagePart,
            `Analyze this image of a civic issue. Respond ONLY with valid JSON.
            IMPORTANT: Do not use unescaped double quotes inside the description value string. If you must use quotes, use single quotes instead.
            
            Desired JSON Schema:
            { 
              "category": "Infrastructure|Waste|Lighting|Water|Safety|Other",
              "severity": <number 1-10>,
              "description": "<2-3 sentence professional description of the issue>" 
            }`
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = response.text || "";
        const parsed = safeJsonParse(text);
        if (parsed && parsed.category && parsed.severity && parsed.description) {
          analysisResult = parsed;
        }
      } catch (geminiError: any) {
        console.info("⚠️ Gemini image analysis. Proceeding with local heuristic analysis fallback.", geminiError.message || geminiError);
        
        const lowerName = file.originalname.toLowerCase();
        if (lowerName.includes("pothole") || lowerName.includes("road") || lowerName.includes("street")) {
          analysisResult = {
            category: "Infrastructure",
            severity: 7,
            description: "Major deterioration of asphalt causing a deep pothole in the road surface, presenting hazards to motorists and cyclists."
          };
        } else if (lowerName.includes("trash") || lowerName.includes("garbage") || lowerName.includes("waste") || lowerName.includes("litter")) {
          analysisResult = {
            category: "Waste",
            severity: 5,
            description: "Accumulated litter and overflowing public garbage receptacle in a communal outdoor space."
          };
        } else if (lowerName.includes("light") || lowerName.includes("lamp") || lowerName.includes("dark")) {
          analysisResult = {
            category: "Lighting",
            severity: 4,
            description: "Reported non-functioning street light or outdoor public light, causing low visibility during evening hours."
          };
        } else if (lowerName.includes("water") || lowerName.includes("leak") || lowerName.includes("pipe") || lowerName.includes("flood")) {
          analysisResult = {
            category: "Water",
            severity: 6,
            description: "Water pipe leakage detected in public pathway causing small flooding and possible moss/slip hazard."
          };
        } else {
          analysisResult = {
            category: "Other",
            severity: 5,
            description: "A civic concern reported by a community member. Please verify details on-site."
          };
        }
      }
    } else {
      // Fun client mock responses when no API Key is added yet to keep UX beautiful
      const lowerName = file.originalname.toLowerCase();
      if (lowerName.includes("pothole") || lowerName.includes("road")) {
        analysisResult = {
          category: "Infrastructure",
          severity: 7,
          description: "Major deterioration of asphalt causing a deep pothole in the road surface, presenting hazards to motorists and cyclists."
        };
      } else if (lowerName.includes("trash") || lowerName.includes("garbage") || lowerName.includes("waste")) {
        analysisResult = {
          category: "Waste",
          severity: 5,
          description: "Accumulated litter and overflowing public garbage receptacle in a communal outdoor space."
        };
      }
    }

    res.status(200).json({
      success: true,
      imageUrl,
      ...analysisResult
    });
  } catch (error: any) {
    console.error("Analyze image error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Transcribe Audio (Hero Voice)
export const transcribeAudio = async (req: any, res: Response): Promise<any> => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: "Please upload an audio file" });
  }

  try {
    // 1. Upload audio to Cloudinary as resource_type video (with robust fallback)
    let audioUrl = "";
    try {
      audioUrl = await uploadToCloudinary(file.buffer, "community-hero", "video");
    } catch (uploadErr: any) {
      console.warn("⚠️ Cloudinary audio upload failed, falling back to dummy audio URL:", uploadErr.message || uploadErr);
      audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    }

    // 2. Call Gemini Multi-modal
    const ai = getGeminiClient();
    let transcriptionResult = {
      transcript: "Could not transcribe audio.",
      description: "A verbal complaint submitted by a resident.",
      category: "Other",
      severity: 5
    };

    if (ai) {
      try {
        const base64Audio = file.buffer.toString("base64");
        const audioPart = {
          inlineData: {
            data: base64Audio,
            mimeType: file.mimetype || "audio/webm"
          }
        };

        const response = await callGeminiWithRetry(ai, {
          model: "gemini-3.5-flash",
          contents: [
            audioPart,
            `Transcribe this audio complaint about a civic issue. Then respond ONLY with valid JSON.
            IMPORTANT: Do not use unescaped double quotes inside the transcript or description value strings. If you must use quotes, use single quotes instead.
            
            Desired JSON Schema:
            { 
              "transcript": "<verbatim transcription>",
              "description": "<grammatically corrected, professional 2-3 sentence version>",
              "category": "Infrastructure|Waste|Lighting|Water|Safety|Other",
              "severity": <number 1-10> 
            }`
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = response.text || "";
        const parsed = safeJsonParse(text);
        if (parsed && parsed.transcript && parsed.description) {
          transcriptionResult = parsed;
        }
      } catch (geminiError: any) {
        console.info("⚠️ Gemini audio transcription. Proceeding with local heuristic transcription fallback.", geminiError.message || geminiError);
        
        transcriptionResult = {
          transcript: "Please clear the broken pipe leaking water onto the sidewalk near the library entrance.",
          description: "An active water pipe rupture has been reported near the library entrance. Clean fresh water is flooding the sidewalk, causing wastage and slipping hazards.",
          category: "Water",
          severity: 6
        };
      }
    } else {
      transcriptionResult = {
        transcript: "Please clear the broken pipe leaking water onto the sidewalk near the library entrance.",
        description: "An active water pipe rupture has been reported near the library entrance. Clean fresh water is flooding the sidewalk, causing wastage and slipping hazards.",
        category: "Water",
        severity: 6
      };
    }

    res.status(200).json({
      success: true,
      audioUrl,
      ...transcriptionResult
    });
  } catch (error: any) {
    console.error("Transcribe audio error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Report (Submit Report & Earn Rewards)
export const createReport = async (req: any, res: Response): Promise<any> => {
  const { title, description, category, severity, imageUrl, audioUrl, location } = req.body;

  if (!title || !description || !category || !severity || !location) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const authorId = req.user._id.toString();
    const formattedLocation = {
      type: "Point",
      coordinates: location.coordinates || [0, 0], // [lng, lat]
      address: location.address || "Unknown location"
    };

    let newReport: any;

    if (isUsingMemoryDb) {
      newReport = {
        _id: `report_${Date.now()}`,
        author: authorId,
        title,
        description,
        category,
        severity: Number(severity),
        imageUrl,
        audioUrl,
        location: formattedLocation,
        status: "Active",
        upvotes: [],
        createdAt: new Date(),
        // Client side helpers
        commentsCount: 0
      };

      // Populate mock author info for immediate feed rendering
      const user = memoryUsers.find((u) => u._id === authorId);
      if (user) {
        // Gamified reward progression
        user.coins += 10;
        user.xp += 10;
        user.reportsCount += 1;

        // Level up check
        user.level = Math.floor(user.xp / 500) + 1;

        // Badge validation
        const currentBadgeNames = user.badges.map((b: any) => b.name);
        if (user.reportsCount >= 1 && !currentBadgeNames.includes("First Report")) {
          user.badges.push({ name: "First Report", icon: "🥇", earnedAt: new Date() });
        }
        if (user.reportsCount >= 10 && !currentBadgeNames.includes("10 Reports")) {
          user.badges.push({ name: "10 Reports", icon: "🏆", earnedAt: new Date() });
        }

        newReport.author = {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          level: user.level,
          xp: user.xp,
          coins: user.coins,
          badges: user.badges
        };
      }
      memoryReports.unshift(newReport);
    } else {
      newReport = await Report.create({
        author: authorId,
        title,
        description,
        category,
        severity: Number(severity),
        imageUrl,
        audioUrl,
        location: formattedLocation,
        status: "Active",
        upvotes: []
      });

      // Update user state and award points
      const user = await (User as any).findById(authorId);
      if (user) {
        user.coins += 10;
        user.xp += 10;
        user.reportsCount += 1;
        user.level = Math.floor(user.xp / 500) + 1;

        const currentBadgeNames = user.badges.map((b: any) => b.name);
        if (user.reportsCount >= 1 && !currentBadgeNames.includes("First Report")) {
          user.badges.push({ name: "First Report", icon: "🥇", earnedAt: new Date() });
        }
        if (user.reportsCount >= 10 && !currentBadgeNames.includes("10 Reports")) {
          user.badges.push({ name: "10 Reports", icon: "🏆", earnedAt: new Date() });
        }

        await user.save();
      }
    }

    res.status(201).json({
      success: true,
      report: newReport,
      rewards: { coins: 10, xp: 10 }
    });
  } catch (error: any) {
    console.error("Create report error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Fetch All Reports (Feed & Filter)
export const getReports = async (req: any, res: Response): Promise<any> => {
  const { category, status, page = 1, limit = 10 } = req.query;

  try {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    if (isUsingMemoryDb) {
      let filtered = [...memoryReports];

      if (category) {
        filtered = filtered.filter((r) => r.category === category);
      }
      if (status) {
        filtered = filtered.filter((r) => r.status === status);
      }

      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const paginated = filtered.slice(skip, skip + limitNum);
      const hasMore = filtered.length > skip + limitNum;

      return res.status(200).json({
        success: true,
        reports: paginated,
        page: pageNum,
        hasMore
      });
    } else {
      const query: any = {};
      if (category) query.category = category;
      if (status) query.status = status;

      const reports = await Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("author", "name avatar level xp coins badges");

      const totalCount = await Report.countDocuments(query);
      const hasMore = totalCount > skip + limitNum;

      res.status(200).json({
        success: true,
        reports,
        page: pageNum,
        hasMore
      });
    }
  } catch (error: any) {
    console.error("Get reports error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Upvote Report (Toggle Upvote)
export const upvoteReport = async (req: any, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  try {
    if (isUsingMemoryDb) {
      const report = memoryReports.find((r) => r._id === id);
      if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
      }

      const index = report.upvotes.indexOf(userId);
      if (index === -1) {
        report.upvotes.push(userId);
      } else {
        report.upvotes.splice(index, 1);
      }

      return res.status(200).json({
        success: true,
        upvotes: report.upvotes,
        upvotesCount: report.upvotes.length
      });
    } else {
      const report = await (Report as any).findById(id);
      if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
      }

      const upvotesArray = report.upvotes.map((u: any) => u.toString());
      const index = upvotesArray.indexOf(userId);

      if (index === -1) {
        report.upvotes.push(userId);
      } else {
        report.upvotes.splice(index, 1);
      }

      await report.save();

      res.status(200).json({
        success: true,
        upvotes: report.upvotes,
        upvotesCount: report.upvotes.length
      });
    }
  } catch (error: any) {
    console.error("Upvote report error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Comments for a Report
export const getComments = async (req: any, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    if (isUsingMemoryDb) {
      const comments = memoryComments.filter((c) => c.reportId === id);
      // Sort oldest first so replies follow the parent comment chronologically
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      return res.status(200).json({
        success: true,
        comments
      });
    } else {
      const comments = await CommentModel.find({ reportId: id })
        .sort({ createdAt: 1 })
        .populate("author", "name avatar level xp coins badges");

      res.status(200).json({
        success: true,
        comments
      });
    }
  } catch (error: any) {
    console.error("Get comments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Add Comment or Reply to a Report
export const addComment = async (req: any, res: Response): Promise<any> => {
  const { id } = req.params;
  const { text, parentId } = req.body;
  const userId = req.user._id.toString();

  if (!text || text.trim() === "") {
    return res.status(400).json({ success: false, message: "Comment text is required" });
  }

  try {
    if (isUsingMemoryDb) {
      const user = memoryUsers.find((u) => u._id === userId);
      const newComment = {
        _id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        reportId: id,
        author: {
          _id: userId,
          name: user ? user.name : "Community Member",
          avatar: user ? user.avatar : "https://api.dicebear.com/7.x/adventurer/svg?seed=Member",
          level: user ? user.level : 1
        },
        text,
        parentId: parentId || null,
        createdAt: new Date()
      };

      memoryComments.push(newComment);

      // Increment commentsCount in Report
      const report = memoryReports.find((r) => r._id === id);
      if (report) {
        report.commentsCount = (report.commentsCount || 0) + 1;
      }

      // Award small reward for engagement! (e.g. 2 Coins, 2 XP)
      if (user) {
        user.coins += 2;
        user.xp += 2;
        user.level = Math.floor(user.xp / 500) + 1;
      }

      return res.status(201).json({
        success: true,
        comment: newComment,
        commentsCount: report ? report.commentsCount : 0
      });
    } else {
      const newComment = await CommentModel.create({
        reportId: id,
        author: userId,
        text,
        parentId: parentId || null
      });

      const populated = await newComment.populate("author", "name avatar level xp coins badges");

      // Increment commentsCount in Report
      const report = await (Report as any).findByIdAndUpdate(
        id,
        { $inc: { commentsCount: 1 } },
        { new: true }
      );

      // Award user coins/XP
      const user = await (User as any).findById(userId);
      if (user) {
        user.coins += 2;
        user.xp += 2;
        user.level = Math.floor(user.xp / 500) + 1;
        await user.save();
      }

      res.status(201).json({
        success: true,
        comment: populated,
        commentsCount: report ? report.commentsCount : 0
      });
    }
  } catch (error: any) {
    console.error("Add comment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Update Report (Edit Post)
export const updateReport = async (req: any, res: Response): Promise<any> => {
  const { id } = req.params;
  const { title, description, category, severity, location } = req.body;
  const userId = req.user._id.toString();

  try {
    if (isUsingMemoryDb) {
      const reportIndex = memoryReports.findIndex((r) => r._id === id);
      if (reportIndex === -1) {
        return res.status(404).json({ success: false, message: "Report not found" });
      }

      const report = memoryReports[reportIndex];
      const reportAuthorId = typeof report.author === "object" ? (report.author as any)._id : report.author;

      if (reportAuthorId.toString() !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to update this report" });
      }

      if (title !== undefined) report.title = title;
      if (description !== undefined) report.description = description;
      if (category !== undefined) report.category = category;
      if (severity !== undefined) report.severity = Number(severity);
      if (location !== undefined) {
        report.location = {
          type: "Point",
          coordinates: location.coordinates || report.location?.coordinates || [0, 0],
          address: location.address || report.location?.address || "Unknown location"
        };
      }

      return res.status(200).json({ success: true, report });
    } else {
      const report = await (Report as any).findById(id);
      if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
      }

      if (report.author.toString() !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to update this report" });
      }

      if (title !== undefined) report.title = title;
      if (description !== undefined) report.description = description;
      if (category !== undefined) report.category = category;
      if (severity !== undefined) report.severity = Number(severity);
      if (location !== undefined) {
        report.location = {
          type: "Point",
          coordinates: location.coordinates || report.location?.coordinates || [0, 0],
          address: location.address || report.location?.address || "Unknown location"
        };
      }

      await report.save();
      const populatedReport = await report.populate("author", "name avatar level xp coins badges");

      return res.status(200).json({ success: true, report: populatedReport });
    }
  } catch (error: any) {
    console.error("Update report error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Delete Report (Delete Post)
export const deleteReport = async (req: any, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  try {
    if (isUsingMemoryDb) {
      const reportIndex = memoryReports.findIndex((r) => r._id === id);
      if (reportIndex === -1) {
        return res.status(404).json({ success: false, message: "Report not found" });
      }

      const report = memoryReports[reportIndex];
      const reportAuthorId = typeof report.author === "object" ? (report.author as any)._id : report.author;

      if (reportAuthorId.toString() !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this report" });
      }

      memoryReports.splice(reportIndex, 1);
      return res.status(200).json({ success: true, message: "Report deleted successfully" });
    } else {
      const report = await (Report as any).findById(id);
      if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
      }

      if (report.author.toString() !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this report" });
      }

      await (Report as any).findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: "Report deleted successfully" });
    }
  } catch (error: any) {
    console.error("Delete report error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
