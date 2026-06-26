import mongoose from "mongoose";
import Redis from "ioredis";

export let isUsingMemoryDb = false;
export let isUsingMemoryRedis = false;

// Memory DB fallbacks
export const memoryUsers: any[] = [];
export const memoryReports: any[] = [];
export const memoryComments: any[] = [];
export const memoryNotices: any[] = [
  {
    _id: "notice_1",
    title: "🌞 Summer Extreme Heat Warning",
    content: "The Municipal Weather Board has issued an extreme heat warning for the next 48 hours. Temperatures are expected to peak above 39°C. Hydration centers are open at the Central Library and Community Hall. Avoid outdoor exercise between 11 AM and 4 PM.",
    author: "Community Hero Admin",
    createdAt: new Date(Date.now() - 3600000 * 24 * 2) // 2 days ago
  },
  {
    _id: "notice_2",
    title: "🚧 Main St. Water Line Repairs",
    content: "Scheduled water line repairs will occur on Main Street from Elm to Oak Ave. Water services might experience low pressure or brief outages between 9 AM and 2 PM on Monday. Road closures will be active; please follow the marked detours.",
    author: "Community Hero Admin",
    createdAt: new Date(Date.now() - 3600000 * 5) // 5 hours ago
  }
];
export const memoryCache = new Map<string, { value: string; expiry: number }>();

// Default comments for pre-populated reports
const defaultComments = [
  {
    _id: "comment_1",
    reportId: "report_1",
    author: {
      _id: "user_demo_2",
      name: "Kora Bort",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kora",
      level: 2
    },
    text: "I drove by here this morning, it is indeed very dangerous. My car made a horrible noise when hitting it.",
    parentId: null,
    createdAt: new Date(Date.now() - 3600000 * 2.5)
  },
  {
    _id: "comment_2",
    reportId: "report_1",
    author: {
      _id: "user_demo_3",
      name: "Jone De",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jone",
      level: 6
    },
    text: "Oh no! Have you checked your tire pressure? Hope there's no damage!",
    parentId: "comment_1",
    createdAt: new Date(Date.now() - 3600000 * 2)
  },
  {
    _id: "comment_3",
    reportId: "report_1",
    author: {
      _id: "user_demo_3",
      name: "Jone De",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jone",
      level: 6
    },
    text: "Reported this to the city council last week. Still no response.",
    parentId: null,
    createdAt: new Date(Date.now() - 3600000 * 1.5)
  },
  {
    _id: "comment_4",
    reportId: "report_2",
    author: {
      _id: "user_demo_1",
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      level: 4
    },
    text: "This park is usually so clean. It's sad to see this.",
    parentId: null,
    createdAt: new Date(Date.now() - 3600000 * 4)
  },
  {
    _id: "comment_5",
    reportId: "report_3",
    author: {
      _id: "user_demo_1",
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      level: 4
    },
    text: "Pine Blvd is so busy, this really needs fixing ASAP.",
    parentId: null,
    createdAt: new Date(Date.now() - 3600000 * 20)
  },
  {
    _id: "comment_6",
    reportId: "report_3",
    author: {
      _id: "user_demo_2",
      name: "Kora Bort",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kora",
      level: 2
    },
    text: "Agreed. I nearly tripped over the curb yesterday evening.",
    parentId: "comment_5",
    createdAt: new Date(Date.now() - 3600000 * 18)
  },
  {
    _id: "comment_7",
    reportId: "report_3",
    author: {
      _id: "user_demo_1",
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      level: 4
    },
    text: "Stay safe! I'm going to carry a flashlight tonight.",
    parentId: "comment_6",
    createdAt: new Date(Date.now() - 3600000 * 17)
  },
  {
    _id: "comment_8",
    reportId: "report_3",
    author: {
      _id: "user_demo_2",
      name: "Kora Bort",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kora",
      level: 2
    },
    text: "Good idea, I'll do the same.",
    parentId: "comment_7",
    createdAt: new Date(Date.now() - 3600000 * 16)
  }
];

// Prepopulate Memory DB with elegant initial data for immediate beautiful experience
const defaultReports = [
  {
    _id: "report_1",
    title: "Pothole on Main St.",
    description: "Large, deep pothole in the middle of Main St. causing cars to swerve and creating a major traffic hazard.",
    category: "Infrastructure",
    severity: 7,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
    audioUrl: "",
    location: {
      type: "Point",
      coordinates: [-122.4194, 37.7749],
      address: "100 Main St, San Francisco, CA"
    },
    status: "Active",
    upvotes: ["user_demo_2", "user_demo_3"],
    author: {
      _id: "user_demo_1",
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      level: 4,
      xp: 1540,
      coins: 240,
      badges: [{ name: "First Report", icon: "🥇", earnedAt: new Date() }]
    },
    commentsCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 3) // 3 hours ago
  },
  {
    _id: "report_2",
    title: "Overflowing Waste Bin at Central Park",
    description: "Public trash can is completely overflowing with litter spreading across the lawns. Needs immediate city collection.",
    category: "Waste",
    severity: 4,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    audioUrl: "",
    location: {
      type: "Point",
      coordinates: [-122.4224, 37.7752],
      address: "Central Park East, San Francisco, CA"
    },
    status: "Active",
    upvotes: ["user_demo_1"],
    author: {
      _id: "user_demo_2",
      name: "Kora Bort",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kora",
      level: 2,
      xp: 750,
      coins: 120,
      badges: []
    },
    commentsCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 5) // 5 hours ago
  },
  {
    _id: "report_3",
    title: "Streetlight Out on Pine Blvd",
    description: "The entire block is extremely dark and dangerous for pedestrians at night because the corner streetlamp is completely out.",
    category: "Lighting",
    severity: 6,
    imageUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    audioUrl: "",
    location: {
      type: "Point",
      coordinates: [-122.4154, 37.7712],
      address: "450 Pine Blvd, San Francisco, CA"
    },
    status: "Pending",
    upvotes: ["user_demo_1", "user_demo_2", "user_demo_3", "user_demo_4"],
    author: {
      _id: "user_demo_3",
      name: "Jone De",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jone",
      level: 6,
      xp: 2950,
      coins: 450,
      badges: [{ name: "Community Star", icon: "⭐", earnedAt: new Date() }]
    },
    commentsCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 24) // 1 day ago
  }
];

// Add demo users to memory users list
const demoUsers = [
  {
    _id: "user_demo_1",
    name: "Alex Rivera",
    email: "alex@example.com",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
    coins: 240,
    xp: 1540,
    level: 4,
    badges: [{ name: "First Report", icon: "🥇", earnedAt: new Date() }],
    reportsCount: 1,
    createdAt: new Date()
  },
  {
    _id: "user_demo_2",
    name: "Kora Bort",
    email: "kora@example.com",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kora",
    coins: 120,
    xp: 750,
    level: 2,
    badges: [],
    reportsCount: 1,
    createdAt: new Date()
  },
  {
    _id: "user_demo_3",
    name: "Jone De",
    email: "jone@example.com",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jone",
    coins: 450,
    xp: 2950,
    level: 6,
    badges: [{ name: "Community Star", icon: "⭐", earnedAt: new Date() }],
    reportsCount: 1,
    createdAt: new Date()
  }
];

export function getSanitizedMongoUri(uri: string, stripSpaces: boolean = true): string {
  if (!uri) return uri;
  try {
    let cleanUri = uri.trim().replace(/^["']|["']$/g, "").trim();
    if (stripSpaces) {
      cleanUri = cleanUri.replace(/\s+/g, "");
    }
    const prefixMatch = cleanUri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
    if (!prefixMatch) return cleanUri;
    const protocol = prefixMatch[1];
    const remainder = prefixMatch[2];

    const queryOrPathIndex = remainder.search(/[/?]/);
    const authority = queryOrPathIndex !== -1 ? remainder.substring(0, queryOrPathIndex) : remainder;
    const pathAndQuery = queryOrPathIndex !== -1 ? remainder.substring(queryOrPathIndex) : "";

    const lastAtIndex = authority.lastIndexOf("@");
    if (lastAtIndex === -1) return cleanUri;

    const userinfo = authority.substring(0, lastAtIndex);
    const host = authority.substring(lastAtIndex + 1);

    const colonIndex = userinfo.indexOf(":");
    if (colonIndex === -1) {
      let uinfo = userinfo.trim();
      if (stripSpaces) {
        uinfo = uinfo.replace(/\s+/g, "");
      }
      let decodedUinfo = uinfo;
      try {
        decodedUinfo = decodeURIComponent(uinfo);
      } catch (e) {}
      return `${protocol}${encodeURIComponent(decodedUinfo)}@${host}${pathAndQuery}`;
    }

    let username = userinfo.substring(0, colonIndex).trim();
    let password = userinfo.substring(colonIndex + 1).trim();

    if (stripSpaces) {
      username = username.replace(/\s+/g, "");
      password = password.replace(/\s+/g, "");
    }

    let decodedPassword = password;
    try {
      decodedPassword = decodeURIComponent(password);
    } catch (e) {}

    let decodedUsername = username;
    try {
      decodedUsername = decodeURIComponent(username);
    } catch (e) {}

    const encodedPassword = encodeURIComponent(decodedPassword);
    const encodedUsername = encodeURIComponent(decodedUsername);

    return `${protocol}${encodedUsername}:${encodedPassword}@${host}${pathAndQuery}`;
  } catch (err: any) {
    console.error("Error sanitizing MongoDB URI:", err);
    return uri;
  }
}

export async function connectDB() {
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("⚠️ MONGODB_URI is not set. Switching to in-memory database fallback.");
    isUsingMemoryDb = true;
    initializeMemoryDB();
    return;
  }

  // Attempt 1: Always try space-stripped and sanitized URI first to avoid warnings
  const sanitizedUri = getSanitizedMongoUri(mongoUri, true);

  try {
    // Attempt Mongoose connection with 4-second timeout to avoid blocking startup
    mongoose.set("strictQuery", false);
    await mongoose.connect(sanitizedUri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log("❇️ Successfully connected to MongoDB.");
    isUsingMemoryDb = false;
  } catch (err: any) {
    console.warn(`⚠️ First connection attempt with sanitized URI failed: ${err.message}. Retrying with raw URI...`);
    
    // Attempt 2: Try with original raw URI as fallback
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log("❇️ Successfully connected to MongoDB with raw URI.");
      isUsingMemoryDb = false;
    } catch (err2: any) {
      console.error("❌ All connection attempts to MongoDB failed:", err2.message);
      console.warn("⚠️ Switching to in-memory database fallback.");
      isUsingMemoryDb = true;
      initializeMemoryDB();
    }
  }
}

function initializeMemoryDB() {
  if (memoryUsers.length === 0) {
    memoryUsers.push(...demoUsers);
  }
  if (memoryReports.length === 0) {
    memoryReports.push(...defaultReports);
  }
  if (memoryComments.length === 0) {
    memoryComments.push(...defaultComments);
  }
}

// Redis Client Fallback
let redis: any = null;

export function getRedisClient() {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("⚠️ REDIS_URL not set. Running Redis in-memory.");
    isUsingMemoryRedis = true;
    redis = createMemoryRedis();
    return redis;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    
    redis.on("error", (err: any) => {
      console.error("❌ Redis Error:", err.message);
      if (!isUsingMemoryRedis) {
        console.warn("⚠️ Swapping Redis client to in-memory mode.");
        isUsingMemoryRedis = true;
        redis = createMemoryRedis();
      }
    });

    console.log("❇️ Connected to Redis.");
    return redis;
  } catch (err: any) {
    console.error("❌ Failed to initialize Redis:", err.message);
    isUsingMemoryRedis = true;
    redis = createMemoryRedis();
    return redis;
  }
}

function createMemoryRedis() {
  return {
    async get(key: string) {
      const cached = memoryCache.get(key);
      if (!cached) return null;
      if (Date.now() > cached.expiry) {
        memoryCache.delete(key);
        return null;
      }
      return cached.value;
    },
    async setex(key: string, ttl: number, value: string) {
      memoryCache.set(key, {
        value,
        expiry: Date.now() + ttl * 1000,
      });
      return "OK";
    },
    async del(key: string) {
      memoryCache.delete(key);
      return 1;
    },
    async keys(pattern: string) {
      return Array.from(memoryCache.keys());
    },
    on() { return this; }
  };
}
