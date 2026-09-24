import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReportComment extends Document {
  reportId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  text: string;
  parentId?: mongoose.Types.ObjectId; // For replies
  createdAt: Date;
}

const ReportCommentSchema: Schema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: "Report", required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: "ReportComment", default: null },
  createdAt: { type: Date, default: Date.now }
});

const ReportComment: Model<IReportComment> = mongoose.models.ReportComment || 
  mongoose.model<IReportComment>("ReportComment", ReportCommentSchema);

export default ReportComment;
