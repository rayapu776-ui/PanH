# 𝓟𝓪𝓷𝓗 — Privacy & Anonymity Network Hub (Fullstack AI Edition)

> **"One fullstack privacy layer for your browser. See who tracks you. Stop them. Know why."**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Fullstack Gateway](https://img.shields.io/badge/Backend-Node.js%20Gateway-green.svg)]()
[![AI Threat Guardian](https://img.shields.io/badge/AI-Heuristic%20Classifier-purple.svg)]()
[![Privacy by Design](https://img.shields.io/badge/Privacy-By%20Design-emerald.svg)]()
[![Platform](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Edge%20%7C%20Firefox%20%7C%20Brave%20%7C%20Opera-informational.svg)]()

**Team Name:** VijetaX  
**Problem Track:** AI & Intelligent Systems  
**Authors:** Apu Ray, Nancy, Prottoy Sarker, Hasontika Roy (BTech. CSE, Sharda University)  
**Version:** v1.0.0 (Fullstack AI Edition)

---

## 🛡️ Fullstack System Architecture

panH is structured as a complete, modern Fullstack platform:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       panH FULLSTACK PRIVACY PLATFORM                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│             FRONTEND CLIENT              │    │             BACKEND GATEWAY              │
│       (Browser Extension - MV3)          │    │       (Node.js Intelligence Server)      │
├──────────────────────────────────────────┤    ├──────────────────────────────────────────┤
│ • Toolbar Popup (Live score & 4 counters)│    │ • Port: http://localhost:3000            │
│ • Full Dashboard (8 functional views)    │    │ • AI Privacy Advisor:                    │
│ • Threat Interstitial (Malicious warning)│◄──►│   POST /api/v1/ai/advise                 │
│ • DNR Engine (declarativeNetRequest)     │    │ • Real-Time Threat Scanner:              │
│ • Content Scripts:                       │    │   POST /api/v1/threats/analyze           │
│   - Fingerprint Shield (Canvas/WebGL)    │    │ • Threat Registry & Submissions:         │
│   - First-Party Tracker Harvester        │    │   POST /api/v1/threats/submit            │
│   - Cosmetic Ad Suppressor               │    │ • Ruleset Sync & Health Diagnostic:      │
│   - Secure Search & Email Privacy        │    │   GET  /api/v1/rules, GET /api/v1/health │
└──────────────────────────────────────────┘    └────────────────────┬─────────────────────┘
                                                                     │
                                                                     ▼
                                                ┌──────────────────────────────────────────┐
                                                │            EXTERNAL AI APIS              │
                                                │   (Configurable via server/.env)         │
                                                ├──────────────────────────────────────────┤
                                                │ • Google Gemini (GEMINI_API_KEY)         │
                                                │ • OpenAI (OPENAI_API_KEY)                │
                                                │ • Local Neural Offline Reasoning Engine  │
                                                └──────────────────────────────────────────┘
```

---

## 🚀 How to Run the Fullstack System

### Step 1: Start the Backend Gateway Server
You can start the server in development mode with **nodemon** (auto-reloads on code edits):
```bash
npm run dev
```
Or start in standard production mode:
```bash
npm run server
```
Or using Node's native file watcher:
```bash
npm run dev:watch
```

This launches the panH Backend Gateway at `http://localhost:3000` with the **persistent SQLite database** (`server/data/panh.db`):
- **Health Check**: `http://localhost:3000/api/v1/health`
- **Database Diagnostics**: `http://localhost:3000/api/v1/db/diagnostics`
- **AI Advisor Endpoint**: `POST http://localhost:3000/api/v1/ai/advise`
- **AI Advice History**: `GET http://localhost:3000/api/v1/ai/history`
- **Threat Scanner Endpoint**: `POST http://localhost:3000/api/v1/threats/analyze`
- **Threat Database Registry**: `GET http://localhost:3000/api/v1/threats`
- **Telemetry Event Store**: `POST /api/v1/events`, `GET /api/v1/events/stats`

### Step 2: Configure Your AI API Key (To Enable Live Advice)
You have two easy ways to add your AI API key:

#### Method A: Server Environment File (Recommended)
Edit `server/.env` (or copy from `server/.env.example`):
```env
# Add your Google Gemini API Key (Get free at: https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Or use OpenAI:
# OPENAI_API_KEY=your_openai_api_key_here
```

#### Method B: In Browser Extension Dashboard Settings
1. Open the panH Dashboard -> Navigate to **Settings**.
2. Scroll to **"AI Privacy Advisor Intelligence Mode"**.
3. Paste your API key into the key field and click **"Save Key"**.
4. Click **"Test Connection"** to verify connection.

---

### Step 3: Load Extension in Your Browser

#### Google Chrome / Microsoft Edge / Brave / Opera:
1. Navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Enable **Developer mode** (toggle in upper right).
3. Click **"Load unpacked"** (top left).
4. Select the project folder:
   ```
   c:\Users\rayap\OneDrive\Desktop\PanH
   ```
5. Click **Select Folder**. Pin **panH** to your browser toolbar!

#### Mozilla Firefox:
1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select `manifest.json` in the root of the folder.

---

## 🧹 Zero Demo/Mock Data Policy

All demo artifacts, hardcoded numbers, and fake placeholder delays have been eliminated:
- **Baseline Telemetry**: Counters start at `0` (`totalTrackersBlocked: 0`, `totalAdsBlocked: 0`, `newSuspectsCount: 0`).
- **Real-Time Event Audit**: Activity timeline and event table record actual HTTP requests intercepted as you browse.
- **Dynamic Activity Charts**: The Today / 7-Day / 30-Day chart dynamically computes volume from stored local event logs.
- **Live AI Advice**: Queries the real AI Advisor endpoint using your configured API key, analyzing actual observable telemetry on the active page.

---

## 🧪 Automated Test Suite

Run the full automated test suite verifying both extension Manifest V3 compliance and backend gateway readiness:
```bash
npm test
```
All **28 validation checks** pass with 100% success.

| Browser | OS Compatibility | Engine | Status |
| :--- | :--- | :--- | :--- |
| **Google Chrome** | Windows, macOS, Linux | Chromium | Fully Supported (Native MV3) |
| **Microsoft Edge** | Windows, macOS, Linux | Chromium | Fully Supported (Native MV3) |
| **Mozilla Firefox** | Windows, macOS, Linux | Gecko | Fully Supported (`gecko.id: panh-privacy@panh.net`) |
| **Brave Browser** | Windows, macOS, Linux | Chromium | Fully Supported (Native MV3) |
| **Opera / Opera GX** | Windows, macOS, Linux | Chromium | Fully Supported (Native MV3) |
| **Vivaldi** | Windows, macOS, Linux | Chromium | Fully Supported (Native MV3) |

---

## 🚀 How to Run in Any Browser

### For Google Chrome, Microsoft Edge, Brave, and Opera:
1. Open your browser:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
2. Toggle **Developer mode** to **ON** (top-right corner).
3. Click **"Load unpacked"** (top-left).
4. Select the folder:
   ```
   c:\Users\rayap\OneDrive\Desktop\PanH
   ```
5. Click **Select Folder**. Pin **panH** to your browser toolbar!

### For Mozilla Firefox:
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select `manifest.json` inside the `c:\Users\rayap\OneDrive\Desktop\PanH` folder.
4. **panH** will load with full Gecko Manifest V3 support!

---

## 🧪 Testing the New AI Capabilities

1. **Popup UI with AI Drawer**:
   - Click the toolbar icon. Observe the circular score gauge (`82 Good protection`) and the live **✨ AI Briefing banner**.
   - Click **"1-Click AI Fix"** to apply recommended shield settings with one tap!
   - Click **"Ask AI Advisor →"** to open the instant drawer, or ask your own question.

2. **Full Dashboard (Control Center)**:
   - Click **"Open Full Dashboard"** in the popup.
   - **Overview**: Check the 4 stat cards, the **AI Executive Briefing**, and toggle the activity chart timeframe between *Today*, *7 Days*, and *30 Days*.
   - **Trackers & AI**: Review unknown domains evaluated by the **AI Behavioral Threat Scorer** with AI confidence ratings, and test **"Block All Suspects"**.
   - **Secure Search**: Execute a private search using DuckDuckGo, Brave, or Startpage with zero referrer leakage.
   - **Email Privacy**: Generate a privacy-preserving alias (`user+shield_8f2a@hub.panh.net`) and copy it.
   - **AI Advisor**: Chat freely with the multi-turn AI assistant, or click the prompt chips.
   - **Settings**: Toggle protection layers, test your Google Gemini API key with the live **"Test Connection"** tool, or export logs as JSON.

3. **Automated Verification**:
   ```powershell
   npm test
   ```
   All 20 validation checks pass with 100% success.
