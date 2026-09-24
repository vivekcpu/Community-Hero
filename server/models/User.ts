import mongoose, { Schema, Document } from "mongoose";

export interface IBadge {
  name: string;
  icon: string;
  earnedAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar: string;
  coins: number;
  xp: number;
  level: number;
  badges: IBadge[];
  reportsCount: number;
  isBanned?: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String, default: "" },
  coins: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [
    {
      name: { type: String },
      icon: { type: String },
      earnedAt: { type: Date, default: Date.now }
    }
  ],
  reportsCount: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index descending on XP for faster leaderboard ranking
UserSchema.index({ xp: -1 });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
