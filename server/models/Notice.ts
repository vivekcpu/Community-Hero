import mongoose, { Schema, Document } from "mongoose";

export interface INotice extends Document {
  title: string;
  content: string;
  author: string;
  createdAt: Date;
}

const NoticeSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: "Community Hero Admin" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notice || mongoose.model<INotice>("Notice", NoticeSchema);
