export interface IBadge {
  name: string;
  icon: string;
  earnedAt: string | Date;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  coins: number;
  xp: number;
  level: number;
  badges: IBadge[];
  reportsCount: number;
  createdAt?: string | Date;
}

export interface ILocation {
  type: string;
  coordinates: number[]; // [lng, lat]
  address: string;
}

export interface IReport {
  _id: string;
  author: IUser | string;
  title: string;
  description: string;
  category: "Infrastructure" | "Waste" | "Lighting" | "Water" | "Safety" | "Other";
  severity: number;
  imageUrl: string;
  audioUrl?: string;
  location: ILocation;
  status: "Active" | "Pending" | "Resolved";
  upvotes: string[]; // List of User IDs
  createdAt: string | Date;
  commentsCount?: number;
}

export interface ILeaderboard {
  users: IUser[];
  stats: {
    totalHeroes: number;
    totalReports: number;
    resolutionRate: number;
  };
  userRank?: {
    rank: number;
    xp: number;
    level: number;
  };
}
