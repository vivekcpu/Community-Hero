# 🦸 Community Hero

**Gamified civic-issue reporting platform** — snap a photo or record your voice, let AI classify and describe the problem, and watch it land on a live community feed complete with upvotes, comments, XP, coins, badges, a leaderboard, and an admin command center.

### 🔗 Live App
**[https://community-hero-76238719535.asia-southeast1.run.app](https://community-hero-76238719535.asia-southeast1.run.app/auth)**

> 🧠 Built with **[Google AI Studio](https://aistudio.google.com/)** — scaffolded, iterated, and shipped using AI Studio's build environment and Gemini API.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Reference](#-api-reference)
- [Gamification System](#-gamification-system)
- [Resilience & Fallback Design](#-resilience--fallback-design)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌍 Overview

**Community Hero** turns everyday citizens into civic reporters. Users can:

1. Snap a photo of a civic issue (pothole, overflowing bin, broken streetlight, water leak, etc.) or record a voice complaint.
2. Let **Gemini AI** auto-classify the issue, estimate severity, and generate a clean, professional description (or transcript).
3. Submit the report — pinned to a live map location — to a public community feed.
4. Earn **XP, coins, and badges**, level up, and climb the **leaderboard**.
5. Engage with other reports via **upvotes and threaded comments**.
6. Municipal admins get a dedicated **dashboard** to triage, prioritize (AI urgency scoring), resolve complaints, moderate users, and post public **notices** — plus an AI chatbot assistant.

---

## ✨ Features

### 👤 Citizen-Facing
- **Email/password auth** + **Google OAuth 2.0** login
- **AI Image Analysis ("Snap & Assess")** — upload a photo, Gemini returns category, severity (1–10), and description
- **AI Voice Reports ("Hero Voice")** — record audio, Gemini transcribes + summarizes + classifies it
- **Geolocation-aware reporting** — auto-detects location via browser geolocation, Google Geocoding API, or IP-based fallback, with reverse-geocoded human-readable addresses
- **Community feed** with category/status filters, pagination, upvoting, and threaded comments
- **Gamification** — XP, coins, levels, unlockable badges, and a **Redeem Store** to spend coins
- **Leaderboard** — global XP-based rankings with the current user's live rank
- **Public Notices board** for municipal announcements
- **User profiles** — avatars, stats, badge showcase, activity history
- **Responsive, glassmorphic UI** with smooth animations (Framer Motion)

### 🛠️ Admin-Facing
- Secure, separate **admin authentication** (JWT, role-guarded)
- **Dashboard analytics** — stats overview on complaints, users, and activity
- **Complaint management** — view, filter, and update report status (Active / Pending / Resolved)
- **AI Urgency Scoring** — Gemini ranks and justifies which open complaints need attention first
- **AI Suggestions** — Gemini recommends resolution steps per report
- **AI Admin Chatbot** — conversational assistant for querying platform data
- **User moderation** — view all users, ban, or delete accounts
- **Notices CRUD** — publish/edit/delete public community notices

### ⚙️ Platform Engineering
- **Self-healing infrastructure**: runs fully even without MongoDB, Redis, Cloudinary, or a Gemini key — gracefully degrading to in-memory data stores, mock media URLs, and heuristic AI fallbacks so the app is never "broken" in a fresh environment
- **Multi-model Gemini failover** with quota/`429` cooldown tracking and `503` retry-with-backoff logic across several Gemini model variants
- **Robust JSON repair layer** for parsing occasionally malformed LLM output
- **Single Express server** serving both the API and the Vite-built SPA (dev: Vite middleware; prod: static build)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 4 (`@tailwindcss/vite`, `@tailwindcss/typography`) |
| **Routing** | React Router DOM 7 |
| **State Management** | Redux Toolkit + React-Redux + Redux Persist |
| **Animation** | Motion (Framer Motion) |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Markdown Rendering** | react-markdown + remark-gfm |
| **Backend Runtime** | Node.js + Express 4 |
| **Language (server)** | TypeScript, executed via `tsx` |
| **Database** | MongoDB via Mongoose (with automatic in-memory fallback) |
| **Cache / Sessions** | Redis via ioredis (with automatic in-memory fallback) |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs (password hashing) + Google OAuth 2.0 (`google-auth-library`) |
| **AI / LLM** | Google Gemini API (`@google/genai`) — multimodal image & audio analysis, urgency scoring, chatbot |
| **Media Storage** | Cloudinary (image & audio uploads, with placeholder fallback) |
| **Geolocation** | Google Geolocation & Geocoding APIs + OpenStreetMap Nominatim fallback |
| **File Uploads** | Multer |
| **Bundling (server build)** | esbuild |
| **Dev/Build Platform** | Google AI Studio |
| **Hosting** | Google Cloud Run |

---

## 🏗️ Architecture

Community Hero uses a **monolithic full-stack TypeScript** architecture — a single Express server handles both the REST API and (in production) the static SPA bundle, simplifying deployment to a single Cloud Run service.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│   React 19 SPA · Redux Toolkit store · Tailwind CSS · Motion      │
└───────────────────────────────┬────────────────────────────────┘
                                 │ Axios (REST, cookies/JWT)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express Server (server.ts)                   │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  /api/auth     │  │ /api/reports │  │ /api/leaderboard    │    │
│  │  /api/admin    │  │ /api/users   │  │ /api/notices         │    │
│  │  /api/geocode  │  │ /api/health  │  │                      │    │
│  └───────┬───────┘  └──────┬───────┘  └──────────┬───────────┘    │
│          │  Middleware: CORS · cookie-parser · JWT auth guard ·   │
│          │              Multer (file uploads) · error handler     │
│          ▼                 ▼                     ▼                │
│   controllers/*.ts   controllers/*.ts     controllers/*.ts        │
└───────┬───────────────────┬───────────────────────┬──────────────┘
        │                   │                        │
        ▼                   ▼                        ▼
┌──────────────┐   ┌─────────────────┐   ┌─────────────────────────┐
│  MongoDB      │   │  Gemini AI       │   │  Cloudinary              │
│  (Mongoose)   │   │ (@google/genai)  │   │  (image/audio storage)   │
│  ↳ fallback:  │   │ ↳ multi-model    │   │  ↳ fallback: placeholder │
│  in-memory DB │   │ failover + retry │   │  media URLs               │
└──────────────┘   └─────────────────┘   └─────────────────────────┘
        │
        ▼
┌──────────────┐        ┌───────────────────────────────┐
│  Redis        │        │ Google Maps Geocoding/Geolocation│
│  (ioredis)    │        │ ↳ fallback: OpenStreetMap        │
│  ↳ fallback:  │        │   Nominatim → raw coordinates     │
│  in-memory    │        └───────────────────────────────┘
│  cache        │
└──────────────┘
```

**Key architectural decisions:**

- **Zero-config-friendly**: every external dependency (MongoDB, Redis, Cloudinary, Gemini, Google OAuth) is optional at runtime. Missing config triggers automatic, transparent fallbacks (in-memory store / mock media / heuristic AI responses) rather than crashing — ideal for demos, evaluation, and AI Studio's environment.
- **Layered backend**: `routes → middleware → controllers → models/utils`, keeping request validation, auth, and business logic cleanly separated.
- **Client state**: Redux Toolkit slices (`auth`, `reports`, `leaderboard`, `user`) persisted via `redux-persist` for a seamless refresh experience.
- **AI resilience**: `callGeminiWithRetry` cycles through multiple Gemini model variants, respects per-model cooldowns on quota exhaustion (`429`), retries transient `503`s with backoff, and `safeJsonParse` repairs slightly malformed model output before falling back to regex extraction.

---

## 📁 Folder Structure

```
community-hero/
├── server/                        # Backend (Express + TypeScript)
│   ├── config/
│   │   └── cloudinary.ts          # Cloudinary SDK config
│   ├── controllers/
│   │   ├── adminController.ts     # Admin auth, stats, moderation, AI urgency/suggestions/chatbot
│   │   ├── authController.ts      # Register/login/logout, Google OAuth flow
│   │   ├── leaderboardController.ts
│   │   ├── reportController.ts    # Image/audio AI analysis, CRUD, upvotes, comments
│   │   └── userController.ts      # Profiles, avatar updates, redeem store, delete
│   ├── middleware/
│   │   ├── authMiddleware.ts      # JWT `protect` guard
│   │   ├── errorMiddleware.ts     # Centralized error handler
│   │   └── multerMiddleware.ts    # Multipart/form-data upload config
│   ├── models/                    # Mongoose schemas
│   │   ├── Comment.ts
│   │   ├── Notice.ts
│   │   ├── Report.ts
│   │   └── User.ts
│   ├── routes/                    # Express routers per resource
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── leaderboardRoutes.ts
│   │   ├── noticeRoutes.ts
│   │   ├── reportRoutes.ts
│   │   └── userRoutes.ts
│   ├── utils/
│   │   └── ai.ts                  # Gemini client, multi-model retry/failover, safeJsonParse
│   └── db.ts                      # MongoDB + Redis connections & in-memory fallbacks
│
├── src/                            # Frontend (React + TypeScript)
│   ├── api/
│   │   ├── axiosInstance.ts       # Configured Axios client
│   │   └── geoService.ts          # Geolocation/geocoding client helpers
│   ├── components/
│   │   ├── admin/                 # AdminUsersModal
│   │   ├── feed/                  # FeedPage, ReportCard, CommentSection
│   │   ├── layout/                # TopBar, BottomNav
│   │   ├── leaderboard/           # LeaderboardPage
│   │   ├── notices/                # NoticesPage
│   │   ├── profile/                # ProfilePage
│   │   ├── report/                 # ReportPage, ImageReport, VoiceReport
│   │   ├── store/                  # RedeemStore
│   │   └── ui/                     # Badge, CoinDisplay, GlassCard, NeoCard, SeverityBar, XpBar
│   ├── hooks/
│   │   └── useGeolocation.ts
│   ├── pages/
│   │   ├── AdminPage.tsx
│   │   ├── AuthPage.tsx
│   │   ├── HomePage.tsx
│   │   └── ProfileViewPage.tsx
│   ├── store/                      # Redux Toolkit
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── leaderboardSlice.ts
│   │   │   ├── reportsSlice.ts
│   │   │   └── userSlice.ts
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── server.ts                       # Entry point — Express app, Vite middleware/static serving
├── .env.example                    # Environment variable template
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started (Local Setup)

Follow these steps to clone and run **Community Hero** on your own machine.

### Prerequisites

- **Node.js** ≥ 18.x (LTS recommended)
- **npm** (bundled with Node)
- Optional (the app runs without these, using in-memory fallbacks):
  - A **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
  - A **Redis** instance (local or hosted, e.g. Upstash/Redis Cloud)
  - A **Cloudinary** account (media uploads)
  - A **Google Gemini API key** ([Google AI Studio](https://aistudio.google.com/apikey))
  - **Google OAuth** credentials ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/community-hero.git
cd community-hero
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Google Gemini AI (image/audio analysis, urgency scoring, chatbot)
GEMINI_API_KEY=your_gemini_api_key

# Base URL of the app (used for OAuth callback construction)
APP_URL=http://localhost:3000

# Google OAuth 2.0 credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MongoDB connection string (omit to auto-fallback to in-memory DB)
MONGODB_URI=mongodb://localhost:27017/community-hero

# Redis connection string (omit to auto-fallback to in-memory cache)
REDIS_URL=redis://localhost:6379

# Secret used to sign JWTs — use a long, random string in production
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary media storage credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> 💡 **No credentials? No problem.** Leave any/all of these blank and the app will automatically use an in-memory database, in-memory cache, placeholder media URLs, and heuristic (non-AI) analysis — perfect for a quick local trial.

### 4. Run the app in development mode

```bash
npm run dev
```

This starts the Express server (with Vite in middleware mode for HMR) at:

```
http://localhost:3000
```

### 5. Build for production

```bash
npm run build
```

This runs `vite build` for the frontend and bundles `server.ts` into `dist/server.cjs` via esbuild.

### 6. Run the production build

```bash
npm start
```

This serves the compiled server + static frontend from `dist/`.

### 7. (Optional) Clean build artifacts

```bash
npm run clean
```

### 8. (Optional) Type-check the project

```bash
npm run lint
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Recommended | Enables real Gemini-powered image/audio analysis, urgency scoring & chatbot. Falls back to heuristics if unset. |
| `APP_URL` | Recommended | Public base URL of the app, used to build the Google OAuth callback URL. |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID for "Sign in with Google". |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth 2.0 Client Secret. |
| `MONGODB_URI` | Optional | MongoDB connection string. Falls back to an in-memory store if unset/unreachable. |
| `REDIS_URL` | Optional | Redis connection string. Falls back to an in-memory cache if unset/unreachable. |
| `JWT_SECRET` | **Yes (production)** | Secret key for signing/verifying JWT auth tokens. |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name for media uploads. |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API secret. |
| `GOOGLE_MAPS_PLATFORM_KEY` | Optional | Enables Google Geolocation/Geocoding for auto-detecting & reverse-geocoding report locations (falls back to OpenStreetMap Nominatim). |

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Runs `tsx server.ts` — Express + Vite middleware with HMR |
| Build | `npm run build` | Builds the frontend (Vite) and bundles the server (esbuild) into `dist/` |
| Start | `npm start` | Runs the production build (`dist/server.cjs`) |
| Clean | `npm run clean` | Removes `dist/` and `server.js` |
| Lint / Type-check | `npm run lint` | Runs `tsc --noEmit` across the project |

---

## 🔌 API Reference

Base URL: `/api`

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new account |
| POST | `/login` | Email/password login |
| POST | `/logout` | Clear auth session |
| GET | `/me` | Get current authenticated user *(protected)* |
| GET | `/google` | Initiate Google OAuth login |
| GET | `/google/callback` | Google OAuth callback handler |

### Reports — `/api/reports`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List reports (filterable by `category`, `status`; paginated) |
| POST | `/` | Create a report *(protected — awards XP/coins)* |
| PUT | `/:id` | Update a report *(protected)* |
| DELETE | `/:id` | Delete a report *(protected)* |
| POST | `/:id/upvote` | Upvote a report *(protected)* |
| GET | `/:id/comments` | Get comments on a report |
| POST | `/:id/comments` | Add a comment *(protected)* |
| POST | `/analyze-image` | AI image analysis → category/severity/description *(protected, multipart)* |
| POST | `/transcribe-audio` | AI audio transcription → transcript/description *(protected, multipart)* |

### Users — `/api/users`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all users |
| GET | `/:id` | Get a user's public profile |
| PUT | `/:id` | Update avatar *(protected)* |
| POST | `/:id/redeem` | Redeem coins for a store item *(protected)* |
| DELETE | `/:id` | Delete account *(protected)* |

### Leaderboard — `/api/leaderboard`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Global XP leaderboard (includes current user's rank if authenticated) |

### Notices — `/api/notices`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List public notices |
| POST | `/` | Create a notice |
| PUT | `/:id` | Update a notice |
| DELETE | `/:id` | Delete a notice |

### Admin — `/api/admin` *(all protected by admin JWT)*
| Method | Endpoint | Description |
|---|---|---|
| POST | `/login` / `/logout` | Admin authentication |
| GET | `/stats` | Dashboard analytics |
| GET | `/complaints` | List all complaints |
| PUT | `/complaints/:id/status` | Update complaint status |
| GET | `/complaints/:id/comments` | View comments on a complaint |
| POST | `/complaints/:id/urgency-score` | AI-generated urgency score |
| GET | `/suggestions/:reportId` | AI resolution suggestions |
| POST | `/chat` | AI admin chatbot |
| GET | `/users` | List all users |
| DELETE | `/users/:id` | Delete a user |
| POST | `/users/:id/ban` | Ban a user |

### Misc
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/geocode` | Reverse-geocode coordinates (Google Maps → OpenStreetMap → raw fallback) |

---

## 🏆 Gamification System

| Action | Reward |
|---|---|
| Submitting a report | +10 XP, +10 coins |
| Reaching XP milestones | Level up (`level = floor(xp / 500) + 1`) |
| First report submitted | 🥇 "First Report" badge |
| 10 reports submitted | 🏆 "10 Reports" badge |
| Accumulating coins | Redeemable in the **Redeem Store** |
| Highest XP | Top of the **Leaderboard** |

---

## 🛡️ Resilience & Fallback Design

Community Hero is designed to **run anywhere, instantly**, even with zero configuration:

| Dependency | If configured | If missing/unreachable |
|---|---|---|
| MongoDB | Persists to a real database | Auto-switches to an in-memory store, pre-seeded with demo data |
| Redis | Real distributed cache | Auto-switches to an in-memory Map-based cache |
| Cloudinary | Uploads real images/audio | Returns curated placeholder media URLs |
| Gemini API | Real multimodal AI analysis | Falls back to filename-based heuristics for classification |
| Google Maps key | Real geocoding | Falls back to OpenStreetMap Nominatim, then raw coordinates |

The Gemini integration additionally implements **multi-model failover** (trying several Gemini model variants in sequence), **per-model cooldowns** on quota exhaustion, and **exponential backoff retries** on transient `503` errors — plus a resilient `safeJsonParse` that repairs malformed JSON before falling back to regex-based field extraction.

---

## ☁️ Deployment

The live instance is deployed on **Google Cloud Run**:
👉 [https://community-hero-76238719535.asia-southeast1.run.app](https://community-hero-76238719535.asia-southeast1.run.app/auth)

This project was originally built and iterated on using **[Google AI Studio](https://aistudio.google.com/)**, which auto-injects `GEMINI_API_KEY` and `APP_URL` at runtime via its Secrets panel and deploys directly to Cloud Run.

To deploy your own instance elsewhere:
1. Run `npm run build` to produce `dist/`.
2. Set all required environment variables on your host (see [Environment Variables](#-environment-variables)).
3. Start the server with `npm start` (or `node dist/server.cjs`).
4. Ensure your host listens on the port the app binds (`3000` by default) and forwards traffic accordingly.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please run `npm run lint` before submitting a PR to ensure type safety.

---

## 📄 License

This project is provided as-is for educational and community-benefit purposes. Add a `LICENSE` file to formally define usage terms.

---

<p align="center">Made with ❤️ for stronger, more responsive communities — powered by Google AI Studio & Gemini.</p>