# panH AI Edition — Product Requirements Document (PRD)

> **Browser Privacy, Ad Blocking & Threat Protection Platform**  
> **Document Version:** 1.0 • 04 November 2026  
> **Status:** Approved Baseline Blueprint  
> **Platform Target:** Chromium (Chrome, Edge, Brave, Opera) & Mozilla Firefox (Manifest V3)

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**panH AI Edition** is a unified, privacy-first browser extension that combines high-speed native network request blocking, heuristic threat prevention, pre-navigation link inspection, and explainable AI assistance in one integrated platform.

The product must feel **fast, understandable, reliable, and respectful of user choice**.

### 1.2 Core Product Principle
> [!IMPORTANT]
> **Privacy by Design**: The extension must protect the user without secretly collecting or exfiltrating browsing data. Core blocking and threat detection must work **locally and offline**. Cloud and AI analysis must be optional, transparent, minimized, and clearly explained before any data is transmitted.

### 1.3 Problem Statement
Modern web users face multi-vector privacy and security hazards:
- **Intrusive advertising & ad bloat** that slows down page rendering and consumes bandwidth.
- **Ubiquitous third-party tracking** correlating cross-site profiles across publisher networks.
- **Evasive first-party techniques** including CNAME cloaking and high-entropy tracking cookies.
- **Deceptive links & phishing lures** that imitate popular brands to harvest credentials.
- **Hidden email spy pixels** logging read receipts, open times, and location data.
- **Silent, opaque blockers** that either break websites silently or provide technical logs that non-technical users cannot understand.

panH unifies these protections into a cohesive shield and tells users **what was blocked, why it was risky, and what they can do next in plain English**.

---

## 2. Product Goals & Non-Goals

### 2.1 Product Goals
1. **Local, Native Blocking**: Block known advertising, tracking, and malicious network requests using browser-native capabilities (`declarativeNetRequest`).
2. **Threat Guardian**: Warn users with an authoritative interstitial before continuing to known or suspected phishing, malware, scam, or homograph-spoofed destinations.
3. **Explainable AI Intelligence**: Translate technical detection facts, risk evidence, and rule matches into plain-language explanations with confidence scoring.
4. **Transparent User Controls**: Offer clear switches for individual protection modules, site-level pause controls, and personal allow/block lists.
5. **Offline Reliability**: Maintain core protection without requiring a user account, cloud service, or active internet connection.
6. **Data Minimization**: Collect only what is strictly necessary; keep all event telemetry on local storage by default.
7. **Polished Dual-Interface**: Provide an actionable, compact popup for current tab status and a full 8-tab dashboard for control and analytics.

### 2.2 Non-Goals and Honest Limitations
- **No False 100% Security Guarantees**: Do not claim "100% secure" or "all threats blocked." New domains, obfuscation, and browser API limitations make absolute protection impossible.
- **No Blanket Email Guarantees**: Email Privacy operates on supported webmail DOM structures (Gmail, Outlook, Yahoo, Proton); do not promise prevention of every server-side email telemetry technique.
- **No Silent Deep Content Inspection**: Do not inspect form fields, passwords, payment details, private chat messages, or attachments.
- **No Paywall / DRM Bypassing**: Do not attempt to bypass browser security boundaries, site paywalls, or tamper with other extensions.
- **No Antivirus Replacement Claims**: Do not claim antivirus-level file system scanning unless a dedicated native host scanner is integrated.

---

## 3. Target Users & Personas

| User Persona | Primary Needs & Expectations | Key panH Features |
| :--- | :--- | :--- |
| **Everyday Browser Users** | Silent background protection, fewer ads, clean web pages, clear warnings. | Ad blocker, cosmetic filter, 1-Click AI Fix, simple score gauge. |
| **Privacy-Conscious Users** | Tracker visibility, fingerprint mitigations, zero tracking parameter leaks. | Fingerprint Shield, First-Party CNAME detector, UTM stripper. |
| **Students & Professionals** | Phishing warnings, safe webmail, link verification before clicking. | Threat Guardian interstitial, Link Scanner, Email Privacy spy-pixel block. |
| **Advanced Users / Developers** | Granular controls, custom allow/block lists, raw JSON evidence, event audit logs. | Link Scanner JSON viewer, Site Exceptions manager, Activity timeline. |

---

## 4. Functional Requirements Catalogue

### 4.1 Priority Definitions
- **P0 (Must Have - MVP Core)**: Essential for launch; uncompromising privacy baseline.
- **P1 (Should Have - Primary Intelligence)**: Key product differentiators (AI Advisor, Secure Search, Fingerprint Shield).
- **P2 (Nice to Have - Enhanced Suite)**: Extended integrations (Webmail pixel unwrapping, optional account sync).

### 4.2 Feature Matrix

| ID | Feature Name | Priority | Description & Expected Behavior |
| :--- | :--- | :---: | :--- |
| **FR-01** | **Ad Blocker** | **P0** | Blocks requests matching maintained ad-domain filter lists via native DNR; applies cosmetic hiding to collapse empty ad slots. Supports site-level pause. |
| **FR-02** | **Tracker Blocker** | **P0** | Blocks known analytics, behavioral profiling, and social tracking endpoints; categorizes each block (ad, analytics, social, fingerprint). |
| **FR-03** | **Threat Guardian** | **P0** | Evaluates URL reputation and local heuristics; detects IDN/punycode homographs, disposable high-risk TLDs, and known phishing indicators. |
| **FR-04** | **Warning Interstitial** | **P0** | Intercepts navigation to confirmed or high-risk malicious URLs. Shows warning page with risk copy, reasons, confidence, and explicit override button. |
| **FR-05** | **Privacy Dashboard** | **P0** | Full 8-tab management center showing Privacy Health Index, observable telemetry metrics, activity graphs, and event tables. |
| **FR-06** | **AI Privacy Advisor** | **P1** | Translates detection evidence into plain English. Supports local neural heuristic reasoning (offline) and optional Google Gemini cloud LLM. |
| **FR-07** | **Secure Search** | **P1** | Safety overlay over search result pages (Google, Bing, DuckDuckGo, Brave, Startpage); annotates links with safety badges; purges UTM/click IDs. |
| **FR-08** | **Fingerprint Shield** | **P1** | Injects micro-noise into Canvas, WebGL shader vendor/renderer, and AudioContext APIs to randomize digital hardware fingerprints. |
| **FR-09** | **Manual Link Scanner** | **P1** | Dedicated interface to paste and assess any URL prior to navigation. Returns structured Section 8.2 JSON evidence, verdict, and safe browsing advice. |
| **FR-10** | **Site Exceptions Manager** | **P1** | User-managed Allow-List (exempts site from blocking) and Custom Block-List with domain addition, validation, and chip removal. |
| **FR-11** | **Email Privacy** | **P2** | On supported webmail pages, neutralizes 1x1 tracking pixels and unwraps redirect links. Includes Privacy Forwarding Alias generator. |
| **FR-12** | **Account & Settings Sync** | **P2** | Optional encrypted sync of custom exceptions and feature preferences; strictly excludes browsing history. |

---

## 5. Risk Assessment Schema (Section 8.2)

Every inspected link or threat detection must conform to the standardized panH Risk Result Schema:

```json
{
  "verdict": "suspicious",
  "risk_level": "medium",
  "confidence": 0.82,
  "reasons": [
    "Domain resembles a known brand in subdomain hierarchy",
    "Pairing sensitive security keyword with disposable TLD (.xyz)",
    "Redirect parameter observed in query string"
  ],
  "source_updated_at": "2026-11-04T00:00:00Z",
  "recommended_action": "review_before_proceeding"
}
```

### Risk Level & Product Behavior Mapping (Section 4.5)
- **Known Malicious / High Confidence**: Block or render the full Warning Interstitial. User override allowed only with explicit risk acknowledgment.
- **Suspicious / Medium Confidence**: Display caution badge and explain indicators; let user decide.
- **Unknown / Insufficient Evidence**: Do **not** label as safe. Show `"Not enough information"` and offer on-demand scan.
- **Known Safe / Allow-Listed**: Allow navigation while preserving independent protections (fingerprint shield, secure search).

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **Popup Responsiveness** | `< 250 ms` render time | Measured from toolbar click to DOM paint on reference hardware. |
| **Memory Overhead** | `< 45 MB` memory foot-print | Background service worker memory profiling in Chromium task manager. |
| **Blocking Accuracy** | `> 96%` precision on test corpus | Curated benchmark corpus of known trackers, ad networks, and phishing lures. |
| **False Positive Rate** | `< 0.8%` on top 1,000 domains | Monitored via broken page reports and regression tests. |
| **Privacy Compliance** | Zero history exfiltration | Outbound request auditing; zero network calls without explicit opt-in. |
| **Offline Resilience** | 100% operational offline | Complete feature verification with backend API severed and network disabled. |

