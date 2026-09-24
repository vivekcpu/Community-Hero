import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { isUsingMemoryDb, memoryUsers } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_here";

const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
};

const setTokenCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (req: Request, res: Response): Promise<any> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please provide name, email, and password" });
  }

  // Check if user exists
  if (isUsingMemoryDb) {
    const exists = memoryUsers.some((u) => u.email === email);
    if (exists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
  } else {
    const exists = await (User as any).findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

  let newUser: any;

  if (isUsingMemoryDb) {
    newUser = {
      _id: `user_${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      avatar,
      coins: 0,
      xp: 0,
      level: 1,
      badges: [],
      reportsCount: 0,
      createdAt: new Date()
    };
    memoryUsers.push(newUser);
  } else {
    newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar,
      coins: 0,
      xp: 0,
      level: 1,
      badges: [],
      reportsCount: 0,
      createdAt: new Date()
    });
  }

  const token = generateToken(newUser._id.toString());
  setTokenCookie(res, token);

  const userResponse = { ...newUser };
  if (userResponse.password) delete userResponse.password;

  res.status(201).json({
    success: true,
    token,
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      coins: newUser.coins,
      xp: newUser.xp,
      level: newUser.level,
      badges: newUser.badges,
      reportsCount: newUser.reportsCount
    }
  });
};

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" });
  }

  let user: any;

  if (isUsingMemoryDb) {
    user = memoryUsers.find((u) => u.email === email);
  } else {
    user = await (User as any).findOne({ email });
  }

  if (!user || !user.password) {
    return res.status(400).json({ success: false, message: "Invalid email or password" });
  }

  if (user.isBanned) {
    return res.status(403).json({ success: false, message: "Your account has been banned by an administrator." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Invalid email or password" });
  }

  const token = generateToken(user._id.toString());
  setTokenCookie(res, token);

  res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      coins: user.coins,
      xp: user.xp,
      level: user.level,
      badges: user.badges,
      reportsCount: user.reportsCount
    }
  });
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getMe = async (req: any, res: Response) => {
  res.status(200).json({ success: true, user: req.user });
};

const getBaseUrl = (req: Request) => {
  // 1. Check APP_URL from environment first (provided by AI Studio preview/production)
  if (process.env.APP_URL && process.env.APP_URL.startsWith("http")) {
    return process.env.APP_URL.replace(/\/+$/, "");
  }

  // 2. Fall back to secure or standard x-forwarded headers to resolve the public ingress domain
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
  
  // Clean potential array headers or duplicate hosts
  const cleanHost = Array.isArray(host) ? host[0] : host;
  const cleanProto = Array.isArray(proto) ? proto[0] : proto;
  
  return `${cleanProto}://${cleanHost}`.replace(/\/+$/, "");
};

const getCallbackUrl = (req: Request) => {
  const base = getBaseUrl(req);
  const callbackUrl = `${base}/api/auth/google/callback`;
  console.log(`[Google OAuth] Resolved Redirect URI: ${callbackUrl}`);
  return callbackUrl;
};

const getFrontEndHomeUrl = (req: Request) => {
  const base = getBaseUrl(req);
  return `${base}/`;
};

const getOAuth2Client = (req: Request) => {
  const callbackUrl = getCallbackUrl(req);
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl
  );
};

export const googleLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const client = getOAuth2Client(req);
    const authorizeUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ],
      prompt: "consent"
    });
    
    if (req.query.json === "true" || req.headers.accept?.includes("application/json")) {
      return res.json({ success: true, url: authorizeUrl });
    }
    
    return res.redirect(authorizeUrl);
  } catch (error: any) {
    console.error("Google Login Init Error:", error);
    return res.status(500).json({ success: false, message: "Failed to initialize Google Login: " + error.message });
  }
};

export const googleCallback = async (req: Request, res: Response): Promise<any> => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("No authorization code provided.");
  }
  
  try {
    const client = getOAuth2Client(req);
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);
    
    const idToken = tokens.id_token;
    if (!idToken) {
      throw new Error("No id_token returned from Google.");
    }
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid token payload.");
    }
    
    const { email, name, picture } = payload;
    if (!email) {
      throw new Error("Email not provided in Google profile.");
    }
    
    let user: any;
    const avatar = picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || "GoogleUser")}`;
    
    if (isUsingMemoryDb) {
      user = memoryUsers.find((u) => u.email === email);
      if (!user) {
        user = {
          _id: `user_google_${Date.now()}`,
          name: name || "Google User",
          email,
          avatar,
          coins: 100,
          xp: 10,
          level: 1,
          badges: [{ name: "First Steps", icon: "🌱", earnedAt: new Date() }],
          reportsCount: 0,
          createdAt: new Date()
        };
        memoryUsers.push(user);
      } else {
        user.name = name || user.name;
        user.avatar = user.avatar || avatar;
      }
    } else {
      user = await (User as any).findOne({ email });
      if (!user) {
        user = await User.create({
          name: name || "Google User",
          email,
          avatar,
          coins: 100,
          xp: 10,
          level: 1,
          badges: [{ name: "First Steps", icon: "🌱", earnedAt: new Date() }],
          reportsCount: 0,
          createdAt: new Date()
        });
      } else {
        user.name = name || user.name;
        user.avatar = user.avatar || avatar;
        await user.save();
      }
    }
    
    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);
    
    const homeUrl = getFrontEndHomeUrl(req);
    
    res.send(`
      <html>
        <head>
          <title>Authenticating...</title>
        </head>
        <body>
          <script>
            const token = ${JSON.stringify(token)};
            const user = ${JSON.stringify({
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              coins: user.coins,
              xp: user.xp,
              level: user.level,
              badges: user.badges,
              reportsCount: user.reportsCount
            })};
            
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("token", token);
            localStorage.setItem("token_active", "true");
            
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                token,
                user
              }, '*');
              window.close();
            } else {
              window.location.href = ${JSON.stringify(homeUrl)};
            }
          </script>
          <div style="font-family: system-ui, sans-serif; text-align: center; margin-top: 100px;">
            <h3>Authentication successful!</h3>
            <p>Connecting you to Community Hero... This window should close or redirect automatically.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Google Auth Callback Error:", error);
    res.status(500).send(`
      <html>
        <body style="font-family: system-ui, sans-serif; text-align: center; margin-top: 100px; color: #e11d48;">
          <h3>Authentication Failed</h3>
          <p>${error.message || "An unexpected error occurred during Google Sign-In."}</p>
          <a href="/auth" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 8px;">Back to Login</a>
        </body>
      </html>
    `);
  }
};
