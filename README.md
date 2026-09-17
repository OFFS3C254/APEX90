# APEX90 | Sportsbook Intelligence & Football Predictions PWA

> **Production-grade Progressive Web App (PWA) with Admin Control Terminal, automated sports API grading, and PayHero M-Pesa VIP monetization.**

---

## ⚡ Overview

**APEX90** is built from the ground up to eliminate default "AI-generated" aesthetics in favor of an authentic, high-density **sportsbook / odds-intelligence platform** (reminiscent of Pinnacle, Bet365, and SofaScore). It delivers daily curated football tips, an isolated **Banker of the Day**, verified transparent history, an auto-grading results engine, and an M-Pesa STK push subscription tier via PayHero.

---

## 🎨 Design System & Visual Architecture

- **Color Tokens**:
  - Base Dark Canvas: Deep graphite & obsidian (`#08090D`, `#11131A`, `#181B26`).
  - Primary Accent: Purposeful electric purple (`#7C3AED`, `#8B5CF6`) used exclusively for active states, CTAs, and brand marks.
  - Outcome Signaling:
    - **WON**: Vibrant emerald (`#10B981` / text `#34D399` / badge bg `rgba(16, 185, 129, 0.15)`).
    - **LOST**: Crisp crimson (`#EF4444` / text `#F87171` / badge bg `rgba(239, 68, 68, 0.15)`).
    - **PENDING**: Golden amber (`#F59E0B` / text `#FBBF24`).
    - **VOID**: Slate muted grey (`#64748B`).
- **Typography Pairing**:
  - **Display / Odds Font**: `Barlow Condensed` (tight letter-spacing, confident sports betting typography for odds boards and scores).
  - **Body / Analytics Font**: `Plus Jakarta Sans` for crisp data clarity.
  - **Data / Stats Font**: `JetBrains Mono` for tabular numerals and odds counters.
- **Asymmetric Layout**:
  - Hero Spotlight for the single **Banker of the Day** (high-conviction pick with tactical memo).
  - Dense match odds grid categorized by betting markets:
    - `1X2 (Full Time Result)`
    - `Double Chance`
    - `Over / Under Goals`
    - `Both Teams to Score (BTTS)`
    - `VIP Exclusives` (with locked blur state and M-Pesa STK unlock).

---

## 📱 Progressive Web App (PWA) Capabilities

- **Android & iOS Home Screen Install**:
  - Full `manifest.webmanifest` with standalone display, dark status bar, and app shortcuts.
  - Custom branded vector and PNG icons (`192x192`, `512x512`, maskable).
  - Automated detection of `beforeinstallprompt` with floating install banner.
  - Interactive modal guide tailored for iOS Safari users (*"Tap Share -> Add to Home Screen"*).
- **Offline Reliability & Service Worker**:
  - `public/sw.js` caches the application shell, team crests, and predictions API responses.
  - Network-first with cache-fallback for real-time odds data.
  - Dedicated `/offline` fallback screen with connection retry handler.

---

## 🤖 Automatic Results Sync & Deterministic Auto-Grading

Located in `src/lib/grading.ts` and `src/lib/sportsApi.ts`:
- **Deterministic Rules Engine**:
  - `1X2`: Evaluates final home/away score (`1` if Home > Away, `X` if Home == Away, `2` if Away > Home).
  - `Double Chance`: Evaluates combinations `1X`, `12`, and `X2`.
  - `Over/Under`: Dynamically parses goal lines (`Over 1.5`, `Under 2.5`, `Over 3.5`, etc.) against total goals.
  - `BTTS`: Evaluates whether both teams scored > 0 (`Yes`) or at least one kept a clean sheet (`No`).
  - `Postponed / Cancelled`: Safely transitions match status to `VOID`.
- **Sync & Trigger**:
  - Triggerable via Admin Dashboard button or scheduled cron job (`POST /api/admin/sync`).
  - Accompanied by manual score and status override tools in the admin terminal.

---

## 💳 PayHero M-Pesa VIP Monetization

- **Gateway**: Integrated with Kenya's PayHero API (`https://backend.payhero.co.ke/api/v2/payments`).
- **Flow**:
  1. User selects VIP pass (Daily at KES 350, Weekly at KES 1,500, Monthly at KES 4,500).
  2. Enters Safaricom/Airtel phone number (`07XXXXXXXX` or `2547XXXXXXXX`).
  3. Receives automated M-Pesa STK Push prompt on their mobile device.
  4. Webhook (`/api/webhooks/payhero`) verifies callback and unlocks VIP access instantly.
  5. Built-in **Sandbox Simulation Mode** allows immediate 1-click test confirmation without deducting real money.

---

## 🔒 Admin Control Terminal (`/admin`)

- **Route Guard**: Middleware (`src/middleware.ts`) protects all `/admin/*` routes with signed HTTP-only JWT cookies (`jose`).
- **Super-Admin Default Credentials**:
  - Email: `admin@apex90.com`
  - Password: `Admin12345!`
- **Capabilities**:
  - Live Fixture Browser: Browse scheduled fixtures for any date across top leagues (Premier League, UCL, La Liga, Serie A, Bundesliga).
  - 1-Click Prediction Creator: Pre-populates real team names, crests, and kickoff times into the Prediction Studio.
  - Live Score Sync & Auto-Grading: Run instant grading across all pending tips.
  - Manual Score Override: Enter custom scores or force-grade won/lost outcomes.
  - VIP Subscriber Manager: View M-Pesa transactions and grant manual VIP access.
  - API Key Settings: Update Football-Data.org and PayHero credentials in runtime.

---

## 🚀 Getting Started

### 1. Install & Build
```bash
npm install
npm run build
```

### 2. Start Application
```bash
# Production server (e.g. port 3001)
npx next start -p 3001
```

### 3. Environment Variables (Optional)
Create `.env` or set via Admin Settings:
```env
FOOTBALL_DATA_API_KEY=your_api_token
PAYHERO_CHANNEL_ID=your_channel_id
PAYHERO_API_KEY=your_api_key
ADMIN_JWT_SECRET=your_custom_secret
CRON_SECRET=apex90-cron-secret
```
*Note: Even without external API keys, the application is pre-seeded with top European fixtures, official crests, and sandbox payment simulation so it is 100% operational immediately.*
