# VulnTracker
<div align="center">


![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth.js-v4-purple?style=for-the-badge&logo=auth0&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<br/>

> **A full-stack cybersecurity intelligence platform** that empowers students, developers, and security professionals to **detect threats, scan URLs, analyse compromises, and educate themselves** all in one unified dark-themed interface.

<br/>

[ Live Demo](#) &nbsp;·&nbsp; [📖 Documentation](#table-of-contents) &nbsp;·&nbsp; [🐛 Report Bug](#) &nbsp;·&nbsp; [💡 Request Feature](#)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Platform Modules](#-platform-modules)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [API Routes](#-api-routes)
- [Database Models](#-database-models)
- [External API Integrations](#-external-api-integrations)
- [Authentication System](#-authentication-system)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [Assignment Context](#-assignment-context)
- [Screenshots](#-screenshots)
- [Security Practices](#-security-practices)

---

## 🛡️ About the Project

**VulnTracker** (Vulnerability Tracker) is a comprehensive, full-stack cybersecurity web platform developed as the final milestone of a Web Application Development course. It was built across four assignments progressing from a static HTML/CSS prototype all the way to a fully functional, database-backed, API-integrated, authenticated web application.

The platform was built with a single mission: **to make professional-grade cybersecurity tools and knowledge accessible to everyone** whether you are a student learning about cyber threats for the first time, a developer checking a suspicious link, or a system administrator diagnosing a potential compromise.

VulnTracker combines:
- 📚 A **Threat Encyclopedia** a living knowledge base of documented attack types
- 🔗 A **URL Safety Scanner** real-time scanning powered by VirusTotal and Google Safe Browsing
- 🖥️ A **Hack Checker** a website compromise diagnostic tool powered by Shodan and symptom analysis
- 👤 A **User Authentication System** register, log in, and maintain a private session
- 📊 A **Personal Dashboard** track every scan you have ever run with full history, filters, and analytics

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔴 **Real Threat Scanning** | URLs scanned against 70+ antivirus engines via VirusTotal API |
| 🛡️ **Google Safe Browsing** | Every URL and website checked against Google's live blacklist database |
| 🌐 **URLScan.io Integration** | Full page behaviour analysis with screenshot capture |
| 🔌 **Shodan Port Analysis** | Open ports and known CVEs queried per domain |
| 🧠 **Weighted Symptom Scoring** | 12-symptom hack checker with individual risk weights |
| 📊 **Unified Threat Score** | 0–100 threat score aggregated from all engines |
| 👤 **JWT Authentication** | Secure login and registration with bcrypt password hashing |
| 📋 **Scan History Dashboard** | Personal dashboard with filters, stats, and delete functionality |
| 🗄️ **MongoDB Persistence** | All scan results and user data persisted in MongoDB Atlas |
| 🎨 **Dark Cyber Theme** | Full dark cybersecurity aesthetic with animated orbs, grid, and glows |
| 📱 **Responsive Design** | Mobile-friendly layout with hamburger navigation |
| ⚡ **Mock Fallbacks** | App functions even without API keys using intelligent mock responses |

---

## 🚀 Platform Modules

### 1. 📚 Threat Encyclopedia
A curated, searchable database of **9 documented cyberattack types** served live from MongoDB Atlas.

Each attack entry includes:
- **Description** what the attack is and how it works
- **Warning Indicators** signs that an attack may have occurred
- **Prevention Checklist** actionable steps to defend against it
- **Real-World Example** a famous breach or incident illustrating the attack
- **Affected Systems** what platforms and infrastructure are targeted
- **CVSS Score** industry-standard severity rating (0–10)
- **Clickable Tags** filter the encyclopedia instantly by tag

**Attacks covered:**

| Attack | Category | Severity | CVSS |
|---|---|---|---|
| SQL Injection | Injection Attack | 🔴 Critical | 9.8 |
| Ransomware | Malware | 🔴 Critical | 9.5 |
| Zero-Day Exploit | Exploit | 🔴 Critical | 9.3 |
| Cross-Site Scripting (XSS) | Injection Attack | 🟠 High | 8.2 |
| Man-in-the-Middle (MITM) | Network Attack | 🟠 High | 8.1 |
| DDoS Attack | Network Attack | 🟠 High | 7.8 |
| Phishing Attack | Social Engineering | 🟠 High | 7.5 |
| Credential Stuffing | Authentication Attack | 🟠 High | 7.3 |
| Social Engineering | Social Engineering | 🟡 Medium | 6.9 |

---

### 2. 🔗 URL Scanner
A real-time URL threat scanner that runs **three parallel security checks** using `Promise.all()` for speed.

**How it works:**
1. User submits a URL
2. The frontend shows a live **10-step animated scan log** while the API processes
3. The backend calls all three engines simultaneously:
   - **VirusTotal** submits the URL and polls for results across 79 antivirus engines
   - **Google Safe Browsing** checks against MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE, and POTENTIALLY_HARMFUL_APPLICATION threat lists
   - **URLScan.io** full page behaviour analysis including screenshot
4. Results are combined into a **unified threat score (0–100)**
5. A **circular SVG threat gauge** renders the score with colour coding
6. A verdict is returned: `Safe`, `Suspicious`, or `Dangerous`
7. Scan is **saved to MongoDB** if the user is logged in

**Threat score formula:**
```
score += (malicious / totalEngines) × 50     ← VirusTotal ratio
score += (suspicious / totalEngines) × 10    ← VirusTotal ratio
score += 30                                   ← if Google Safe Browsing flagged
score += 10                                   ← if URLScan verdict is Malicious
score += heuristic bonus                      ← HTTP-only, IP URLs, suspicious TLDs
score = Math.min(score, 100)
```

---

### 3. 🖥️ Hack Checker
A website compromise diagnostic tool that combines **external API data with a symptom-weighted scoring engine**.

**Symptom Weighting System:**

| Symptom | Risk Weight |
|---|---|
| Ransom note appeared | 80 pts (forces Compromised) |
| Antivirus disabled or spam sent | 40 pts |
| Data loss or passwords stopped working | 35 pts |
| Unknown background processes or new accounts | 30 pts |
| Unexplained redirects | 25 pts |
| Unexpected pop-ups or browser homepage changed | 20 pts |
| High CPU/RAM usage | 15 pts |
| Slow performance | 10 pts |

**Engines used:**
- **Google Safe Browsing** checks the website against Google's live blacklist
- **Shodan** queries open ports and known CVEs on the server (dangerous ports like 21, 23, 3306, 5432, 6379 flagged in red)

**Verdicts:** `Clean`, `Suspicious`, `Compromised`

---

### 4. 📊 Personal Dashboard
A **protected route** accessible only to logged-in users. Displays:

- **5 stat cards**: Total Scans, Safe/Clean, Suspicious, Dangerous, Average Threat Score
- **Filterable scan history table** filter by Type (URL / Website) and Verdict
- **Expandable rows** click any scan to see engine breakdown and recommendations
- **Delete functionality** remove individual scan records with ownership verification
- **Aggregation pipeline** stats computed with a single MongoDB `$group` aggregation

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.2.3 | Full-stack React framework (Pages Router) |
| React | 18.x | Component-based UI with hooks |
| Tailwind CSS | 3.3.0 | Utility-first dark cybersecurity styling |
| Orbitron Font | Google Fonts | Futuristic heading typography |
| JetBrains Mono | Google Fonts | Terminal and code text |
| Syne Font | Google Fonts | Label and badge typography |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Next.js API Routes | 14.2.3 | Serverless backend endpoints |
| Node.js | 18+ | Runtime environment |
| Axios | 1.7.2 | HTTP client for external API calls |

### Database
| Technology | Version | Purpose |
|---|---|---|
| MongoDB Atlas | Cloud | NoSQL document database |
| Mongoose | 8.3.4 | ODM schema validation and query helpers |

### Authentication
| Technology | Version | Purpose |
|---|---|---|
| NextAuth.js | 4.24.7 | JWT session management and Credentials provider |
| bcryptjs | 2.4.3 | Password hashing (12 salt rounds) |

### External APIs
| API | Type | Used In |
|---|---|---|
| VirusTotal v3 | Real API | `/api/scan-url` 79-engine URL analysis |
| Google Safe Browsing v4 | Real API | Both scan routes malware and phishing blacklist |
| URLScan.io v1 | Real + Mock | `/api/scan-url` page behaviour and screenshot |
| Shodan REST | Real + Mock | `/api/check-website` ports and CVEs |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                      │
│   index.js │ threats.js │ scanner.js │ checker.js │ dash   │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTP fetch / next-auth signIn
┌───────────────────────────▼─────────────────────────────────┐
│                  NEXT.JS API ROUTES (Backend)                │
│  /api/attacks  │  /api/scan-url  │  /api/check-website      │
│  /api/dashboard  │  /api/auth/[...nextauth]  │  /api/auth/  │
│                   register                                   │
└──────────┬────────────────┬────────────────────────────────-┘
           │                │
┌──────────▼───────┐   ┌────▼────────────────────────────────┐
│  MongoDB Atlas   │   │         External Security APIs       │
│  ─────────────── │   │  ──────────────────────────────────  │
│  User model      │   │  VirusTotal API (79 AV engines)      │
│  Attack model    │   │  Google Safe Browsing API v4         │
│  ScanResult      │   │  URLScan.io API v1                   │
│  model           │   │  Shodan REST API                     │
└──────────────────┘   └─────────────────────────────────────┘
```

**Request flow for a URL scan:**
```
User submits URL
      ↓
React component calls POST /api/scan-url
      ↓
API route validates URL format with new URL()
      ↓
Promise.all() fires 3 parallel requests:
  ├── VirusTotal: submit → poll → get stats
  ├── Google Safe Browsing: check threats
  └── URLScan.io: submit → wait → get verdict
      ↓
Threat score calculated (0–100)
      ↓
If user logged in → save ScanResult to MongoDB
      ↓
JSON response returned to frontend
      ↓
React renders gauge, engine cards, recommendations
```

---

## 📁 Project Structure

```
vulntracker/
│
├── 📄 package.json              ← Dependencies and npm scripts
├── 📄 tailwind.config.js        ← Custom design tokens and fonts
├── 📄 postcss.config.js         ← PostCSS setup for Tailwind
├── 📄 next.config.js            ← Next.js configuration
├── 📄 .env.local.example        ← Environment variable template
├── 📄 .gitignore                ← Excludes node_modules and .env.local
├── 📄 README.md                 ← This file
│
├── 📂 pages/                    ← Next.js Pages Router
│   ├── 📄 _app.js               ← SessionProvider + Layout wrapper
│   ├── 📄 _document.js          ← Global HTML, Google Fonts, meta tags
│   ├── 📄 index.js              ← Landing page (hero, stats, about, features)
│   ├── 📄 login.js              ← Login page (NextAuth signIn)
│   ├── 📄 register.js           ← Register page (password strength meter)
│   ├── 📄 dashboard.js          ← Protected scan history dashboard
│   │
│   ├── 📂 api/                  ← Backend API routes
│   │   ├── 📄 attacks.js        ← GET /api/attacks (MongoDB + search + filter)
│   │   ├── 📄 scan-url.js       ← POST /api/scan-url (VT + GSB + URLScan)
│   │   ├── 📄 check-website.js  ← POST /api/check-website (GSB + Shodan + symptoms)
│   │   ├── 📄 dashboard.js      ← GET/DELETE /api/dashboard (protected)
│   │   └── 📂 auth/
│   │       ├── 📄 [...nextauth].js ← NextAuth config + JWT + Credentials
│   │       └── 📄 register.js      ← POST /api/auth/register
│   │
│   └── 📂 catalog/
│       ├── 📄 threats.js        ← Threat Encyclopedia (fetches from /api/attacks)
│       ├── 📄 scanner.js        ← URL Scanner (calls /api/scan-url)
│       └── 📄 checker.js        ← Hack Checker (calls /api/check-website)
│
├── 📂 components/
│   ├── 📄 Navbar.jsx            ← Fixed navbar (dropdown, auth state, mobile menu)
│   ├── 📄 Footer.jsx            ← Site-wide footer with links
│   └── 📄 Layout.jsx            ← Shared page wrapper (orbs, grid, navbar, footer)
│
├── 📂 models/
│   ├── 📄 User.js               ← Mongoose schema (bcrypt pre-save hook, toJSON)
│   ├── 📄 Attack.js             ← Mongoose schema (full-text search index)
│   └── 📄 ScanResult.js         ← Mongoose schema (userId ref, Mixed details)
│
├── 📂 lib/
│   ├── 📄 mongodb.js            ← Cached MongoDB connection (serverless-safe)
│   ├── 📄 auth.js               ← requireAuth() and getSession() helpers
│   └── 📄 seed.js               ← Database seeder (9 attack entries)
│
├── 📂 styles/
│   └── 📄 globals.css           ← CSS variables, resets, fonts, animations
│
└── 📂 public/                   ← Static assets
```

---

## 🔌 API Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ Public | Create a new user account |
| `GET/POST` | `/api/auth/[...nextauth]` | ❌ Public | NextAuth login, session, signout |
| `GET` | `/api/attacks` | ❌ Public | Fetch all attacks with optional `?search=` and `?severity=` |
| `POST` | `/api/scan-url` | ⚡ Optional* | Scan URL via VirusTotal + Google Safe Browsing + URLScan.io |
| `POST` | `/api/check-website` | ⚡ Optional* | Check website via Google Safe Browsing + Shodan + symptoms |
| `GET` | `/api/dashboard` | ✅ Required | Fetch authenticated user's scan history with stats |
| `DELETE` | `/api/dashboard?id=xxx` | ✅ Required | Delete a specific scan record (ownership verified) |

> *Optional means scans run publicly but only save to MongoDB when a session exists.

---

## 🗄️ Database Models

### User
```javascript
{
  name:      String,   // min 2 chars, max 50 chars
  email:     String,   // unique, lowercase, regex validated
  password:  String,   // bcrypt hash plain text NEVER stored
  role:      String,   // 'user' | 'admin', default 'user'
  createdAt: Date,     // auto-added by Mongoose timestamps
  updatedAt: Date
}
```

### Attack
```javascript
{
  title:            String,    // e.g. "SQL Injection"
  category:         String,    // e.g. "Injection Attack"
  severity:         String,    // 'Critical' | 'High' | 'Medium' | 'Low'
  cvssScore:        Number,    // 0.0 – 10.0
  description:      String,
  howItWorks:       String,
  indicators:       [String],  // warning signs
  prevention:       [String],  // checklist items
  realWorldExample: String,    // famous breach
  affectedSystems:  [String],
  tags:             [String],  // indexed for full-text search
}
// Text index on: title (×10), tags (×5), category (×3), description (×1)
```

### ScanResult
```javascript
{
  userId:      ObjectId,  // ref: User (indexed)
  scanType:    String,    // 'url' | 'website'
  target:      String,    // the scanned URL
  threatScore: Number,    // 0–100
  verdict:     String,    // 'Safe'|'Suspicious'|'Dangerous'|'Compromised'|'Clean'
  details: {
    virusTotal:         { malicious, suspicious, harmless, undetected },
    googleSafeBrowsing: { isSafe, threats: [String] },
    urlScan:            { verdict, tags, screenshot },
    shodan:             { openPorts, vulnerabilities, country, org },
    symptoms:           { count, list: [String] }
  },
  recommendations: [String],
  createdAt: Date
}
```

---

## 🌐 External API Integrations

### VirusTotal API v3
- **Purpose:** Submit any URL for analysis across 79 antivirus and URL scanners simultaneously
- **Flow:** POST to `/api/v3/urls` → poll `/api/v3/analyses/{id}` every 3 seconds → extract `malicious`, `suspicious`, `harmless`, `undetected` counts
- **Fallback:** Heuristic mock based on URL characteristics (HTTP-only, suspicious TLDs, IP-based URLs)
- **Get your key:** https://www.virustotal.com/gui/join-us

### Google Safe Browsing API v4
- **Purpose:** Check URLs against Google's maintained blacklist of malware, phishing, and unwanted software
- **Threat types checked:** `MALWARE`, `SOCIAL_ENGINEERING`, `UNWANTED_SOFTWARE`, `POTENTIALLY_HARMFUL_APPLICATION`
- **Fallback:** Returns `isSafe: true` as the safe default
- **Get your key:** https://console.cloud.google.com → APIs → Safe Browsing

### URLScan.io API v1
- **Purpose:** Submit a URL for full page behaviour analysis including screenshot, redirect chain, and JavaScript analysis
- **Flow:** POST scan → wait 8 seconds → GET result
- **Fallback:** Heuristic verdict based on HTTPS presence and URL patterns
- **Get your key:** https://urlscan.io/user/signup

### Shodan REST API
- **Purpose:** Look up open ports and known CVEs for a given domain
- **Flow:** DNS resolve hostname → GET host details by IP → extract `ports` and `vulns`
- **Fallback:** Simulated open ports and CVEs based on hostname characteristics
- **Get your key:** https://account.shodan.io/register

---

## 🔐 Authentication System

VulnTracker uses **NextAuth.js** with the **Credentials provider** for a complete self-hosted authentication system.

### How it works:
1. User registers via `POST /api/auth/register` password hashed with **bcrypt (12 rounds)** before storage
2. User logs in NextAuth's `authorize()` function queries MongoDB, calls `bcrypt.compare()`
3. On success, a **JWT token** is created containing `{ id, name, email, role }`
4. Token stored as an **HTTP-only cookie** inaccessible to JavaScript (XSS protection)
5. All subsequent requests include the cookie automatically
6. `getServerSession()` in API routes decodes the session to identify the user
7. `requireAuth()` helper returns `401 Unauthorized` if no valid session exists

### Security features:
- ✅ bcrypt hashing with 12 salt rounds
- ✅ Plain text passwords never stored or logged
- ✅ `toJSON()` strips password from all API responses
- ✅ HTTP-only cookies for session tokens
- ✅ `NEXTAUTH_SECRET` signs and encrypts all JWTs
- ✅ 7-day session expiry
- ✅ Ownership verification on all DELETE operations
- ✅ Both client-side and server-side input validation

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js 18+](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/vulntracker.git
cd vulntracker
```

**2. Install all dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.local.example .env.local
```
Then open `.env.local` and fill in your values (see [Environment Variables](#-environment-variables) below).

**4. Seed the database**

This populates MongoDB with all 9 attack entries for the Threat Encyclopedia:
```bash
npm run seed
```

You should see:
```
✅ Connected to MongoDB
🗑️  Cleared existing attack entries
✅ Successfully seeded 9 attack entries
✅ Seeding complete!
```

**5. Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 🔑 Environment Variables

Create a `.env.local` file in the root of the project. **Never commit this file to GitHub** it is already excluded by `.gitignore`.

```env
# ─────────────────────────────────────────────────────
#  MongoDB Atlas REQUIRED
# ─────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/vulntracker?retryWrites=true&w=majority

# ─────────────────────────────────────────────────────
#  NextAuth REQUIRED
# ─────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-32-character-string-here

# ─────────────────────────────────────────────────────
#  VirusTotal Recommended (mock fallback if missing)
#  Get free key: https://www.virustotal.com/gui/join-us
# ─────────────────────────────────────────────────────
VIRUSTOTAL_API_KEY=your_virustotal_key_here

# ─────────────────────────────────────────────────────
#  Google Safe Browsing Recommended (mock fallback if missing)
#  Get key: https://console.cloud.google.com
# ─────────────────────────────────────────────────────
GOOGLE_SAFE_BROWSING_KEY=your_google_key_here

# ─────────────────────────────────────────────────────
#  URLScan.io Optional (mock fallback if missing)
#  Get free key: https://urlscan.io/user/signup
# ─────────────────────────────────────────────────────
URLSCAN_API_KEY=your_urlscan_key_here

# ─────────────────────────────────────────────────────
#  Shodan Optional (mock fallback if missing)
#  Get free key: https://account.shodan.io/register
# ─────────────────────────────────────────────────────
SHODAN_API_KEY=your_shodan_key_here
```

| Variable | Required | Default if missing |
|---|---|---|
| `MONGODB_URI` | ✅ Yes | App won't start |
| `NEXTAUTH_URL` | ✅ Yes | App won't start |
| `NEXTAUTH_SECRET` | ✅ Yes | App won't start |
| `VIRUSTOTAL_API_KEY` | ⚡ Recommended | Heuristic mock result |
| `GOOGLE_SAFE_BROWSING_KEY` | ⚡ Recommended | Returns `isSafe: true` |
| `URLSCAN_API_KEY` | 💡 Optional | HTTPS-based mock verdict |
| `SHODAN_API_KEY` | 💡 Optional | Simulated ports and CVEs |

---

## ▶️ Running the Project

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server (after build)
npm run start

# Seed the MongoDB database with attack entries
npm run seed

# Lint the codebase
npm run lint
```

---

## 📚 Assignment Context

This project was developed as part of the **Web Application Development** course at **COMSATS University Islamabad**.

| Detail | Info |
|---|---|
| **Student ID** | FA24-BCE-043 |
| **Course** | Web Application Development |
| **University** | COMSATS University Islamabad |
| **Programme** | BS Cybersecurity |

### Assignment Progression

| Assignment | What Was Built |
|---|---|
| **Assignment 1** | Static HTML/CSS prototype landing page, threat encyclopedia, hack checker, link scanner |
| **Assignment 2** | JavaScript interactivity live search, filters, animated progress bars, dynamic results |
| **Assignment 3** | Next.js + React conversion components, Tailwind CSS, useState/useEffect, routing |
| **Assignment 4** | Full-stack backend MongoDB, NextAuth, API routes, external API integrations, dashboard |

---

## 🔒 Security Practices

This project implements multiple layers of security:

- **Password Hashing** bcryptjs with 12 salt rounds; plain text never touches the database
- **HTTP-Only Cookies** JWT session tokens are inaccessible to JavaScript (XSS protection)
- **Input Validation** both client-side (React) and server-side (API routes)
- **URL Validation** `new URL()` constructor validates all submitted URLs before API calls
- **Ownership Checks** DELETE operations verify `userId` matches the session user
- **Method Validation** all API routes reject disallowed HTTP methods with `405`
- **Environment Variables** all secrets and keys stored in `.env.local`, never in code
- **Mongoose Type Casting** prevents NoSQL injection via schema-enforced types
- **OWASP Alignment** mitigations for A01 (Broken Access Control), A02 (Cryptographic Failures), A03 (Injection), A07 (Authentication Failures)

---

## 📜 License

Distributed under the MIT License.

---

<div align="center">

Built with ❤️ for the Web Application Development course

**VulnTracker** *Detect. Analyze. Protect. Recover.*

![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-black?style=flat-square&logo=next.js)
![Powered by MongoDB](https://img.shields.io/badge/Powered%20by-MongoDB-47A248?style=flat-square&logo=mongodb)
![Secured with bcrypt](https://img.shields.io/badge/Secured%20with-bcrypt-orange?style=flat-square)

</div>
