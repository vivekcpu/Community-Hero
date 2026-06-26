# 🏅 Community Hero — Civic Issue-Reporting & Gamification Platform

Welcome to **Community Hero**, a state-of-the-art, full-stack civic engagement and issue-reporting platform. Engineered with **React**, **Express**, and **Gemini Multimodal AI**, Community Hero transforms the chore of community reporting into an engaging, gamified social experience.

Residents can snap photographs of infrastructure damage or record voice complaints, watch as **Gemini 3.5 Flash** instantly transcribes, classifies, and evaluates the reports, upvote neighbors' posts, view issues on a vector neighborhood grid, and earn gold coins, levels, and milestone achievements.

---

## 🗺️ Interactive System Architecture & Workflow

Here is how data flows through **Community Hero** when a civic report is submitted:

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           USER / CLIENT SIDE                           │
 └───────────────────┬────────────────────────────────┬───────────────────┘
                     │ (Image Upload / Voice Audio)   │ (Upvotes / Chat)
                     ▼                                ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                   EXPRESS BACKEND ENGINE (PORT 3000)                   │
 └───────────────────┬────────────────────────────────┬───────────────────┘
                     │                                │
                     │ If Assets Uploaded             │ Analyze Payload
                     ▼                                ▼
 ┌───────────────────────────────┐        ┌───────────────────────────────┐
 │   CLOUDINARY MEDIA STORAGE    │        │      GEMINI AI PROTOCOL       │
 │   (Secure storage fallback)   │        │     (SDK Call via Node)       │
 └───────────────┬───────────────┘        └───────────────┬───────────────┘
                 │                                        │
                 ▼ URL Reference                          ▼ Structured JSON
 ┌────────────────────────────────────────────────────────────────────────┐
 │                       DATA PERSISTENCE CONTROLLER                      │
 ├────────────────────────────────────────────────────────────────────────┤
 │  Primary Mode: MongoDB + Redis Cache                                   │
 │  Resilient Mode: High-Performance, Self-Seeding In-Memory Database    │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼ Saves State
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         ADMIN CONTROL STATION                         │
 │     - Urgency Assessment  - AI Remediation Chat  - Moderation Engine    │
 └────────────────────────────────────────────────────────────────────────┘
```

1. **Multimodal Capture**: The user snaps a photo or records a verbal grievance.
2. **Buffer Streaming**: The server streams files to Cloudinary (or switches to resilient base64/placeholder formats if Cloudinary credentials are absent).
3. **Gemini Inspection**:
   - **Image Analysis**: Analyzes visual cues, auto-categories the issue (e.g. `Infrastructure`, `Waste`), assigns a priority score (1-10), and generates a description.
   - **Voice Transcription**: Transcribes voice recordings verbatim, cleans up grammatical slips, and produces a professional, actionable summary.
4. **Gamification Processing**: The reporting engine awards the user **+10 XP** and **+10 Coins**, updating their global level, streaks, and auditing eligibility for custom milestone badges.
5. **Admin Intervention**: City officials access the Admin Dashboard to trigger the **AI Urgency Pipeline** (providing deep risk analysis), request AI-generated remediation tips, and converse with the **Admin Assist chatbot** for strategic resolution.

---

## 🛠️ The Tech Stack

| Layer | Technologies & Libraries | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Tailwind CSS, Redux Toolkit, Lucide React, Framer Motion | High-performance client, Duolingo-style bouncy navigation, real-time feedback loops, customizable state streams. |
| **Backend API** | Node.js, Express, TSX | Robust RESTful endpoint network, JWT auth verification, Vite dev middleware. |
| **AI Intelligence**| Google `@google/genai` (Gemini SDK) | Image feature recognition, speech-to-text translation, risk/urgency evaluation, AI-led chatbot assistance. |
| **Database & Cache**| Mongoose (MongoDB) & Redis Client | Hard-durable storage schema, high-speed user caching. |
| **Resilient Failovers**| Custom Memory DB & Fallback Vectors | Fully self-sufficient local simulation mode which launches with sample reports, comments, and profile nodes if MongoDB/Redis are offline. |

---

## 🌟 Core Features & Modules

### 👩‍💻 User Experience
- **Snap & Assess (AI Vision)**: Snap a picture of trash accumulation, potholes, or structural damage. Gemini instantly reads the visual evidence to structure the data, removing manual classification chores.
- **Hero Voice (Speech Processing)**: Verbalize your complaint! Built-in audio recorder plots real-time wave visuals and passes the voice packet to Gemini to transcribe, grammar-correct, and outline.
- **Duolingo Gamification Engine**:
  - **Dynamic Level Progress**: Earn XP to fill up progress bars; Level Up events fire automatically on exceeding the 500 XP step-threshold.
  - **Golden Coins**: Earn coins to redeem actual rewards or cosmetic title enhancements in the community store.
  - **Badge Wall**: Unlock achievements like *First Report*, *Pothole Patrol*, *Trash Tamer*, and *Civic Champion* based on active contributions.
- **Interactive Neighborhood Map**: An elegant vector coordinate layout representing local district grids, placing custom visual pins for unresolved community issues with quick categorization filter tags.
- **Social Interaction**: Community social boards with real-time text searching, category toggles, detailed upvote counts, and interactive discussion panels.

### 👮‍♂️ Administrative & Moderation Center (Credentials: `admin` / `hero`)
- **Global Overview Stats**: Track aggregate reports, resolution progress ratios, total registered users, and system integrity status.
- **AI Urgency Pipeline**: One-click AI triage. Evaluates combined parameters (severity, upvotes, description, user profile history) to output an advanced risk score with deep qualitative safety justifications.
- **AI Remediation Suggestions**: Instructs Gemini to parse report parameters and output discrete, actionable steps for city engineers to resolve the issue safely and efficiently.
- **Admin Assist Chatbot**: An embedded, contextual AI assistant programmed with civic ordinance guidelines to help administrators draft notifications, evaluate priority tickets, and design community responses.
- **Moderation Tools**: Direct controls to update report resolution phases (e.g., `Pending` ➡️ `In Progress` ➡️ `Resolved`), delete reports, or ban users from community interaction.

---

## 📂 Project Structure & Directories

```text
community-hero/
├── server.ts                       # Entrypoint Express Server & Development Vite Integrator
├── server/                         # Main Backend Service Layer
│   ├── config/
│   │   └── cloudinary.ts           # Media uploads handler (Cloudinary API integration)
│   ├── controllers/
│   │   ├── adminController.ts      # Admin dashboard operations (stats, AI urgency, remediation, chatbot)
│   │   ├── authController.ts       # Authentication workflows (JWT creation, session stores)
│   │   ├── leaderboardController.ts# High-score user list caching
│   │   ├── reportController.ts     # Core reporting logic (Gemini vision, voice transcription, rewards)
│   │   └── userController.ts       # User profiles, avatar updates, and shop redemption
│   ├── db.ts                       # Primary MongoDB + Redis connection handlers with resilient In-Memory fallbacks
│   ├── middleware/
│   │   ├── authMiddleware.ts       # Express security shields & session checkers
│   │   ├── errorMiddleware.ts      # Standardized unified exception filters
│   │   └── multerMiddleware.ts     # Upload buffer interface for incoming files
│   ├── models/
│   │   ├── Comment.ts              # Report Comment Schema & models
│   │   ├── Notice.ts               # Admin Bulletin board announcement schemas
│   │   ├── Report.ts               # Civic Report Schema, coordinate metrics & state indicators
│   │   └── User.ts                 # User Gamification profiles, coin counters, and unlockable badges
│   └── routes/
│       ├── adminRoutes.ts          # Admin protected route list
│       ├── authRoutes.ts           # User authentication routes
│       ├── leaderboardRoutes.ts    # Ranked user board routes
│       ├── noticeRoutes.ts         # Announcement board routes
│       ├── reportRoutes.ts         # Report collection & submission routes
│       └── userRoutes.ts           # Profile fetch, edit, and reward routes
├── src/                            # Frontend Application Layer (Vite + React)
│   ├── api/
│   │   └── axiosInstance.ts        # Modular HTTP network client (with token interceptors & auto-auth redirects)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminChatModal.tsx  # Contextual admin assistant conversational panel
│   │   │   ├── AdminUsersModal.tsx # Moderator user lists, deletion, and ban control switches
│   │   │   └── NoticeForm.tsx      # Multi-field news bulletin form
│   │   ├── feed/
│   │   │   ├── CommentSection.tsx  # Scrollable comment rows, additions, and time logs
│   │   │   ├── FeedPage.tsx        # Dashboard, search bars, category tags, map togglers
│   │   │   └── ReportCard.tsx      # Elegant cards displaying badges, upvotes, images, and audio controls
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx       # Standard modern bottom navigation dock
│   │   │   └── TopBar.tsx          # Dynamic top header mapping XP progress and Golden Coins
│   │   ├── leaderboard/
│   │   │   └── LeaderboardPage.tsx # Gamified rank podiums and list tracking
│   │   ├── notices/
│   │   │   └── NoticesPage.tsx     # Clean admin news feed lists
│   │   ├── profile/
│   │   │   └── ProfilePage.tsx     # Custom user summaries, progress metrics, and unlocked badge arrays
│   │   ├── report/
│   │   │   ├── ImageReport.tsx     # Visual camera/upload input and Gemini analyzer
│   │   │   ├── ReportPage.tsx      # Main wizard interface for new reports
│   │   │   └── VoiceReport.tsx     # Custom microphone audio visualizer & transcription processor
│   │   ├── store/
│   │   │   └── RedeemStore.tsx     # Storefront allowing users to trade golden coins for rewards
│   │   └── ui/                     # Beautiful, reusable design components
│   │       ├── Badge.tsx           # Category colored pills
│   │       ├── CoinDisplay.tsx     # Glowing gold coin trackers
│   │       ├── GlassCard.tsx       # Frosted glass overlay component
│   │       ├── NeoCard.tsx         # Responsive flat bounce borders
│   │       ├── SeverityBar.tsx     # Color-coded urgency scale indicators (1-10)
│   │       └── XpBar.tsx           # High-precision custom level loaders
│   ├── pages/
│   │   ├── AdminPage.tsx           # Fully featured admin control hub and metrics graphs
│   │   ├── AuthPage.tsx            # Animated Auth entry with custom error feedback
│   │   └── HomePage.tsx            # Authenticated application manager & toast systems
│   ├── store/
│   │   ├── index.ts                # Redux store configurations
│   │   └── slices/                 # State management slices (auth, report feeds, leaderboards)
│   ├── types.ts                    # Centralized TypeScript interfaces and declarations
│   ├── main.tsx                    # Web build entry point
│   └── index.css                   # Global font schemes, custom variables, and active keyframes
└── package.json                    # Application metadata, scripts, and package listings
```

---

