# 𝓟𝓪𝓷𝓗 — Privacy & Anonymity Network Hub (AI & Universal Edition)

> **"One privacy layer for your browser. See who tracks you. Stop them. Know why."**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![AI Threat Guardian](https://img.shields.io/badge/AI-Heuristic%20Classifier-purple.svg)]()
[![Privacy by Design](https://img.shields.io/badge/Privacy-By%20Design-emerald.svg)]()
[![Platform](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Edge%20%7C%20Firefox%20%7C%20Brave%20%7C%20Opera-informational.svg)]()
[![OS](https://img.shields.io/badge/OS-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

**Team Name:** VijetaX  
**Problem Track:** AI & Intelligent Systems  
**Authors:** Apu Ray, Nancy, Prottoy Sarker, Hasontika Roy (BTech. CSE, Sharda University)  
**Version:** v1.1.0 (AI Perfect Edition)

---

## 🛡️ Overview

Most people are tracked by dozens of third-party scripts on every website. Existing blockers either work silently without explaining what happened, or require deep technical knowledge. Furthermore, new trackers appear faster than static blocklists can update.

**panH** is a unified, cross-browser privacy extension featuring an **AI Behavioral Threat Engine** that blocks trackers and ads, shields your browser fingerprint, secures your searches and email, and tells you **what it did and what to do next in plain English**.

```
                ┌────────────────────────────────────────────────────────┐
                │          panH UNIVERSAL PRIVACY ENGINE                 │
                │        (Cross-Browser & Multi-OS Architecture)         │
                └──────────────────────────┬─────────────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴─────┬──────────────────┐
         ▼                  ▼                    ▼                  ▼
    ┌─────────┐       ┌───────────┐        ┌───────────┐      ┌───────────┐
    │  BLOCK  │       │ AI DETECT │        │  PROTECT  │      │   GUIDE   │
    │  LAYER  │       │ & EXPLAIN │        │ IDENTITY  │      │  & SPEED  │
    └────┬────┘       └─────┬─────┘        └─────┬─────┘      └─────┬─────┘
         │                  │                    │                  │
   • Ads blocker       • AI Behavioral      • Canvas, WebGL,   • Unified
     (DNR + Cosmetic)    Threat Classifier    & Audio jitter     dashboard
   • Third-party       • Plain-language     • Secure search    • AI Executive
     cross-site          explanations for     (strip UTM/gclid)  Briefing
     tracker blocker     every block        • Email spy pixel  • AI Privacy
   • First-party CNAME • Confidence &         neutralization     Advisor (chat)
     cloaking detect     entropy scoring    • Privacy aliases  • Faster search
```

---

## 🧠 The AI Perfect System Architecture

### 1. Real-Time AI Behavioral Threat Classifier (`background/ai-classifier.js`)
- **Multi-Vector Feature Scoring**: Analyzes 7 threat vectors on unlisted domains:
  1. **Shannon Entropy Analysis**: Detects machine-generated or randomized tracking subdomains.
  2. **Query Fingerprint Signatures**: Scans for persistent tracking tokens (`uid`, `visitor_id`, `device_fp`, `canvas_hash`).
  3. **Telemetry Endpoint Detection**: Matches telemetry collection paths (`/collect`, `/pixel`, `/tr`, `/beacon`, `/sync`).
  4. **Cross-Site Dissemination Index**: Tracks cross-domain frequency across unrelated websites.
  5. **Hardware Correlation**: Flags domains reading Canvas or WebGL shaders.
  6. **First-Party Disguised Identifiers**: Inspects cookie lifespans and CNAME subdomains.
  7. **Asynchronous Beacon Payloads**: Intercepts background beacon and ping telemetry.
- **AI Output**: Generates an **AI Risk Score** (0–100), **Confidence Percentage** (e.g., 92%), and transparent human-readable reasoning.

### 2. Dual-Engine AI Privacy Advisor (`background/ai-engine.js`)
- **Engine 1: Built-in Local Neural/Knowledge Engine (Default)**:
  - 100% offline, zero latency, zero API keys required.
  - Multi-turn conversational memory explaining trackers, fingerprinting, cookies, privacy laws, and site risks.
  - **1-Click AI Remediation**: Generates instant action triggers (e.g., *[Block 3 High-Risk Domains]*, *[Enable Strict Shielding]*).
- **Engine 2: Cloud LLM Integration (Google Gemini 1.5/2.0 Flash / Pro)**:
  - Users can optionally save their Gemini API key in Settings with a live **"Test Connection"** validator.
  - **Strict Privacy by Design**: All prompts are sanitized—**never sends web page text, search content, or browsing history**; only sends domain tokens and telemetry counts.

### 3. AI Executive Site Auditor
- Auto-generates a live 3-point briefing for every website:
  1. What happened behind the scenes (who was blocked, what data they wanted).
  2. Potential identity exposure risk posture.
  3. 1-Click AI privacy optimization.

---

## 🌐 Universal Cross-Browser & Cross-OS Support

The extension includes a universal browser polyfill layer (`shared/panh-polyfill.js`) and cross-browser Manifest V3 configuration supporting:

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
