# 𝓟𝓪𝓷𝓗 — Privacy & Anonymity Network Hub

> **"One privacy layer for your browser. See who tracks you. Stop them. Know why."**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Privacy by Design](https://img.shields.io/badge/Privacy-By%20Design-emerald.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Firefox-informational.svg)]()

**Team Name:** VijetaX  
**Problem Track:** AI & Intelligent Systems  
**Authors:** Apu Ray, Nancy, Prottoy Sarker, Hasontika Roy (BTech. CSE, Sharda University)  
**Project Document Version:** v0.1

---

## 🛡️ Overview

Most people are tracked by dozens of third-party scripts on every website. Existing blockers either work silently without explaining what happened, or require deep technical knowledge. Furthermore, new trackers appear faster than static blocklists can update.

**panH** is a unified browser extension that blocks trackers and ads, shields your browser fingerprint, secures your searches and email, and tells you **what it did and what to do next in plain English**.

```
                ┌────────────────────────────────────────────────────────┐
                │             panH UNIFIED PRIVACY ENGINE                │
                └──────────────────────────┬─────────────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴─────┬──────────────────┐
         ▼                  ▼                    ▼                  ▼
    ┌─────────┐       ┌───────────┐        ┌───────────┐      ┌───────────┐
    │  BLOCK  │       │  DETECT   │        │  PROTECT  │      │   GUIDE   │
    │  LAYER  │       │ & EXPLAIN │        │ IDENTITY  │      │  & SPEED  │
    └────┬────┘       └─────┬─────┘        └─────┬─────┘      └─────┬─────┘
         │                  │                    │                  │
   • Ads blocker       • Plain-language     • Canvas & WebGL   • Unified
     (DNR + Cosmetic)    reasons for          noise injection    dashboard
   • Third-party         every block        • Secure search    • Rule-based
     cross-site        • Behavioral           (strip UTM/gclid)  advice
     tracker blocker     scoring for        • Email spy pixel  • AI Privacy
   • First-party CNAME   new unknown          neutralization     Advisor (chat)
     cloaking detect     trackers           • Privacy aliases  • Faster search
```

---

## 🚀 Key Features Grouped into Four Modules

### 1. Block
- **Ad Blocker**: Native Chrome `declarativeNetRequest` rulesets blocking major ad exchanges (DoubleClick, Criteo, AppNexus, Rubicon, Taboola, Outbrain) paired with cosmetic CSS hiding to eliminate blank ad gaps and sponsored widgets.
- **Third-Party Tracker Blocker**: Stops telemetry beacons, cross-site identity synchronizers, and session recorders (Hotjar, FullStory, Meta Pixel).
- **First-Party Tracking & CNAME Cloaking**: Inspects first-party storage to flag high-entropy persistent UUIDs disguised as essential cookies, and identifies subdomains masking third-party telemetry.

### 2. Detect & Explain
- **Transparent Explanations**: Every single blocked request is categorized (`ad`, `analytics`, `fingerprinting`, `social`, `email`) and provided with an actionable, plain-English explanation (e.g., *"pixel.tracker-a.io on shop.com: Sent cross-site persistent tracking ID via 1x1 image"*).
- **Behavioral Scoring for New Trackers**: When an unlisted domain is observed across 3+ unrelated websites sending background beacons or receiving UUID queries, it is scored dynamically (0–100) and flagged in the **New Suspects** list for 1-click user review and blocking.

### 3. Protect Identity
- **Fingerprint Shield**: Injects cryptographic micro-noise into Canvas readouts (`toDataURL`, `getImageData`), randomizes WebGL GPU vendor/renderer parameters (`UNMASKED_RENDERER_WEBGL`), and defeats AudioContext and font enumeration probes.
- **Secure Search**: Purges tracking parameters (`utm_*`, `gclid`, `fbclid`, `msclkid`, `mc_eid`) upon navigation and offers 1-click private search through DuckDuckGo, Brave, or Startpage with zero referrer leakage (`Referrer-Policy: no-referrer`).
- **Email Privacy**: Neutralizes hidden 1x1 tracking pixels ("spy pixels") in webmail (Gmail, Outlook, Yahoo) and includes a built-in **Email Privacy Alias Generator**.

### 4. Guide & Speed
- **Unified Privacy Dashboard**: A full-tab control center displaying real-time metrics (Trackers blocked, Ads blocked, New suspects), an interactive interception activity chart, and searchable live logs.
- **Site Score & Rule-Based Tips**: Instant circular score (0–100) indicating protection status (e.g. *82 Good protection on news-site.com*) with tailored actionable advice.
- **AI Privacy Advisor**: Interactive assistant answering privacy questions in plain English.
  - **Privacy by Design**: Strictly analyzes only domain names and tracker categories—**never page content, search text, or browsing history**.
  - **Offline Intelligence Engine**: Operates immediately out-of-the-box without requiring API keys.
  - **Google Gemini API Support**: Optionally plug in your Gemini API key in Settings for cloud reasoning.

---

## 📂 Project Architecture

```
PanH/
├── manifest.json               # Manifest V3 Extension specification
├── package.json                # Project metadata & npm validation scripts
├── README.md                   # Complete documentation & usage guide
├── icons/                      # Extension icons (16, 32, 48, 128 px + SVG)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
├── rules/                      # Declarative Net Request rulesets
│   ├── rules_ads.json          # Ad network blocking rules
│   ├── rules_trackers.json     # Behavioral tracker blocking rules
│   └── rules_search.json       # URL tracking parameter stripping rules
├── background/                 # Background Service Worker Engine
│   ├── service-worker.js       # Central Privacy Engine & message router
│   ├── tracker-db.js           # Database of known trackers & plain-language explainers
│   └── advisor-ai.js           # AI & Rule-Based Privacy Advisor logic
├── content_scripts/            # Page-level protection modules
│   ├── fingerprint-shield.js   # Canvas, WebGL & AudioContext noise injector (MAIN world)
│   ├── cosmetic-ad-blocker.js  # Cosmetic CSS & DOM element remover
│   ├── first-party-tracker.js  # Long-lived cookie & CNAME detector
│   └── email-privacy.js        # Webmail 1x1 spy pixel neutralizing script
├── popup/                      # Popup UI (shown on extension icon click)
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── dashboard/                  # Full-Tab Privacy Control Center
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboard.js
└── test/                       # Automated test verification
    └── validate.js
```

---

## 🔧 Installation & How to Run

### Step 1: Open Chrome / Edge Extension Settings
1. Open Google Chrome (or Microsoft Edge / Brave).
2. Navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`

### Step 2: Enable Developer Mode
- In the top-right corner of the Extensions page, toggle **Developer mode** to **ON**.

### Step 3: Load the Extension
1. Click the **Load unpacked** button (top-left).
2. Select the **`PanH`** folder:
   ```
   c:\Users\rayap\OneDrive\Desktop\PanH
   ```
3. The extension **panH - Privacy & Anonymity Network Hub** will appear in your installed list!

### Step 4: Pin panH to Your Toolbar
- Click the puzzle piece icon (Extensions) in your browser toolbar and click the pin icon next to **panH**.

---

## 🧪 Testing the Extension Features

### 1. Testing the Popup UI
- Click the **panH** icon in the toolbar.
- You will see:
  - Circular Protection Score gauge (e.g. `82 Good protection`)
  - Metrics: Trackers blocked, Ads blocked, First-party tracking
  - Live toggles for **Fingerprint shield** and **Secure search**
  - **"Why blocked?"** reason banner
  - Click **"Ask AI Advisor &rarr;"** to expand the intelligent assistant drawer!

### 2. Testing the Full Dashboard
- Click **"Open Full Dashboard"** in the popup or right-click the extension icon and select **"panH: Open Privacy Dashboard"**.
- Explore the 6 tabs:
  - **Overview**: View the 3 stat cards (`1,284 Trackers blocked`, `3,902 Ads blocked`, `7 New suspects`), the interactive Activity Chart, and filter the live log feed.
  - **Trackers**: Review the Behavioral Pattern scoring list, and test blocking suspected domains with 1-click.
  - **Search**: Perform a private search using DuckDuckGo, Brave, or Startpage with zero referrer leakage.
  - **Email**: Test generating a privacy alias tag (`user+shield_8f2a@hub.panh.net`) and copy it to your clipboard.
  - **Advisor**: Chat with the AI Advisor or click any prompt chip (e.g., *"Why was pixel.tracker-a.io blocked?"*).
  - **Settings**: Toggle individual modules, export logs as JSON, or configure an optional Google Gemini API key.

### 3. Automated Code Integrity Test
Run the built-in validation script:
```powershell
npm test
```
All 18 validation criteria will execute and verify manifest parameters, rulesets, scripts, icons, and HTML views.

---

## 🔒 Privacy by Design Guarantee

- **Local-First Processing**: Logs and behavioral pattern analyses are stored exclusively in your local browser (`chrome.storage.local`).
- **No Private Data Exfiltration**: When consulting AI advisors or external models, panH sends **only domain names and categorization metrics**—never your webpage contents, search history, or personal identifiers.
