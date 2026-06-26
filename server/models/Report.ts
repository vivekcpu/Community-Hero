import mongoose, { Schema, Document } from "mongoose";

export interface ILocation {
  type: string;
  coordinates: number[]; // [longitude, latitude]
  address: string;
}

export interface IReport extends Document {
  author: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: "Infrastructure" | "Waste" | "Lighting" | "Water" | "Safety" | "Other";
  severity: number;
  imageUrl?: string;
  audioUrl?: string;
  location: ILocation;
  status: "Active" | "Pending" | "Resolved";
  upvotes: mongoose.Types.ObjectId[];
  commentsCount?: number;
  createdAt: Date;
}

const ReportSchema: Schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["Infrastructure", "Waste", "Lighting", "Water", "Safety", "Other"],
    required: true
  },
  severity: { type: Number, required: true, min: 1, max: 10 },
  imageUrl: { type: String, required: false },
  audioUrl: { type: String },
  commentsCount: { type: Number, default: 0 },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    address: { type: String, required: true }
  },
  status: { type: String, enum: ["Active", "Pending", "Resolved"], default: "Active" },
  upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

// Spatial index for geo-queries
ReportSchema.index({ location: "2dsphere" });

export default mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
