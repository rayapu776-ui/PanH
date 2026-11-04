# panH AI Edition — UI/UX Design System & Specification

**Document Version:** 1.0  
**Date:** 04 November 2026  
**Status:** Approved Engineering Blueprint  
**Reference Document:** *panH AI Edition | Product & Engineering Blueprint v1.0* (Section 5)

---

## 1. Design Philosophy & Visual Direction

panH AI Edition balances security authority with high-clarity minimalism. The interface communicates threat protection, transparency, and system health without causing alarm fatigue or visual clutter.

### Core Principles
1. **Calm Authority**: Deep midnight and navy backgrounds convey technical resilience and stability. Bright, high-contrast accents focus attention precisely where action or verification is needed.
2. **Transparent Explainability**: Security metrics and blocked entities are never presented as mysterious black boxes. The UI provides direct, plain-English reasons ("Why was this blocked?").
3. **Zero Distraction**: The extension popup is optimized for 3-second glanceability. Complex drill-downs, charts, and configuration reside in the dedicated standalone Dashboard.
4. **Universal Accessibility**: Strict adherence to WCAG 2.1 Level AA color contrast, screen reader labels, and keyboard navigability across all views.

---

## 2. Design Tokens & Color Palette

All styling throughout the browser extension (Popup, Full Dashboard, Interstitial Warning, and Content Overlays) is derived from the unified design token system:

| Token Name | CSS Variable | Hex Code | Semantic Role & Usage |
| :--- | :--- | :---: | :--- |
| **Background Primary** | `--bg-primary` | `#0B1426` | Main application background (deep midnight navy). |
| **Background Secondary** | `--bg-secondary` | `#101C33` | Sidebar, navigation panels, and container backgrounds. |
| **Surface / Card** | `--bg-card` | `#17263D` | Content cards, metric tiles, and elevated surfaces. |
| **Surface Hover** | `--bg-card-hover` | `#1F3352` | Card hover states, selected list items. |
| **Card Border** | `--border-card` | `#233854` | Card outlines, dividers, and panel separators. |
| **Primary Accent** | `--accent-primary` | `#27B7D6` | Primary action buttons, active tabs, brand highlights (cyan). |
| **Primary Hover** | `--accent-primary-hover`| `#1FA2BF` | Hover and active states for primary interactive elements. |
| **Success Accent** | `--accent-success` | `#22C55E` | Protected status badges, safe ratings, allowed whitelists (emerald). |
| **Warning Accent** | `--accent-warning` | `#F59E0B` | Suspicious alerts, paused shields, medium-risk warnings (amber). |
| **Danger Accent** | `--accent-danger` | `#EF4444` | High-risk malicious alerts, blocked threat counts, danger badges (crimson). |
| **Info / Purple** | `--accent-info` | `#8B5CF6` | AI classifier badges, deep-scan indicator pills (violet). |
| **Text Primary** | `--text-primary` | `#F8FAFC` | Primary headings, prominent values, key labels (near-white). |
| **Text Secondary** | `--text-secondary` | `#A9B8CA` | Descriptive copy, subtitles, unselected tab items. |
| **Text Muted** | `--text-muted` | `#64748B` | Timestamps, table column headers, helper notes. |

---

## 3. Typography & Elevation Scale

### Typography Hierarchy
- **Font Family**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
- **Monospace Family**: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` (for URLs, IP addresses, hash fingerprints)
- **Scale**:
  - `Display / Hero Value`: $28\text{px} - 32\text{px}$ / Weight 700 / Line-height 1.2
  - `H1 / Page Title`: $22\text{px} - 24\text{px}$ / Weight 600 / Line-height 1.3
  - `H2 / Section Title`: $18\text{px} - 20\text{px}$ / Weight 600 / Line-height 1.35
  - `H3 / Card Header`: $14\text{px} - 16\text{px}$ / Weight 600 / Line-height 1.4
  - `Body / Standard`: $13\text{px} - 14\text{px}$ / Weight 400 / Line-height 1.5
  - `Caption / Microcopy`: $11\text{px} - 12\text{px}$ / Weight 500 / Line-height 1.4

### Elevation & Border Radii
- **Radii**:
  - Badge / Pill: `9999px` (Full pill)
  - Interactive Button: `8px`
  - Metric Tile / Card: `12px`
  - Modal / Interstitial Container: `16px`
- **Shadows**:
  - Low Elevation: `0 2px 4px rgba(0, 0, 0, 0.25)`
  - Card Elevation: `0 4px 12px rgba(0, 0, 0, 0.35)`
  - Danger Modal Glow: `0 0 24px rgba(239, 68, 68, 0.2)`

---

## 4. Browser Popup Specification

### Layout Constraints
- **Width**: $380\text{px}$ fixed
- **Height**: Dynamic, bounded between $480\text{px}$ and $580\text{px}$ (prevents vertical browser scrollbars)
- **Entry Point**: Extension action click on the browser toolbar

### Popup Wireframe
```
+-------------------------------------------------------------+
|  [🛡️ Logo]  panH AI Edition               [● Protected] [⚙️] |
+-------------------------------------------------------------+
|  CURRENT SITE                                               |
|  🔒 github.com                                [ Toggle: ON ]|
+-------------------------------------------------------------+
|  COUNTERS (ALL TIME)                                        |
|  +-----------------------+     +-----------------------+    |
|  |  ADS BLOCKED          |     |  TRACKERS STOPPED     |    |
|  |  1,429                |     |  842                  |    |
|  +-----------------------+     +-----------------------+    |
|  |  THREATS INTERCEPTED  |     |  FINGERPRINTERS       |    |
|  |  12                   |     |  94                   |    |
|  +-----------------------+     +-----------------------+    |
+-------------------------------------------------------------+
|  PROTECTION SHIELDS                                         |
|  [✓] Ad & Tracker Blocker                       [Active]    |
|  [✓] AI Malicious URL Guard                     [Active]    |
|  [✓] Query Tracker Stripper                     [Active]    |
+-------------------------------------------------------------+
|  WHY BLOCKED? (Recent Rationale)                            |
|  ▸ 2 tracking beacons blocked on current page (google-anal…)|
+-------------------------------------------------------------+
|  [  Open Full Security Dashboard  ↗  ]                      |
+-------------------------------------------------------------+
```

### Component Details
1. **Header Bar**:
   - Shield icon with glowing status badge (`Protected` in green dot `#22C55E` or `Paused` in yellow dot `#F59E0B`).
   - Quick settings button launching the dashboard settings directly.
2. **Current Site Card**:
   - Displays active domain derived from `webNavigation` / active tab query.
   - Shows connection protocol pill (`HTTPS` in emerald, `HTTP` in amber).
   - Prominent toggle switch: `Pause on this site` (temporarily whitelists the domain for 24 hours without turning off global shields).
3. **4-Tile Metric Grid**:
   - **Ads Blocked**: Accent cyan (`#27B7D6`).
   - **Trackers Blocked**: Accent info (`#8B5CF6`).
   - **Malicious URLs**: Accent danger (`#EF4444`).
   - **Fingerprinters**: Accent warning (`#F59E0B`).
4. **Why Blocked Drawer**:
   - Collapsible explanation area showing the last intercepted rule or AI rationale (e.g. *"Known tracking pixel blocked via EasyPrivacy rule 1002"*).
5. **Primary CTA**:
   - Full-width button linking to `dashboard/dashboard.html` in a new tab.

---

## 5. Full Security Dashboard Specification

The dashboard provides the command-center experience, structured as a two-column responsive desktop application rendered inside a standard browser tab.

### Dashboard Layout Architecture
```
+------------------+----------------------------------------------------------+
|  panH AI         |  Dashboard Header                     [Help] [Settings]  |
|  v1.0.0          +----------------------------------------------------------+
|                  |                                                          |
|  [1] Overview    |  [ACTIVE VIEW CONTENT CANVAS]                            |
|  [2] Trackers    |                                                          |
|  [3] Search      |  Renders 1 of 8 dedicated feature templates:             |
|  [4] Email Mask  |  1. Overview: Metrics, Privacy Dial, Quick Actions       |
|  [5] Link Scan   |  2. Trackers & AI: Dynamic DNR status, Rulesets table    |
|  [6] Activity    |  3. Secure Search: Default engine picker, Query cleaning |
|  [7] Settings    |  4. Email Privacy: Masked aliases generator & mock relays|
|  [8] About       |  5. Link Scanner: Real-time URL threat scoring input     |
|                  |  6. Activity Logs: 30-Day chart, searchable event audit  |
|  [Storage Info]  |  7. Settings: Whitelists, aggressive mode, reset DB      |
|  ● 1.2 MB Local  |  8. About & Help: Release manifesto, open-source notes   |
+------------------+----------------------------------------------------------+
```

### Screen-by-Screen Specifications (8 Views)

#### Screen 1: Overview
- **Privacy Score Gauge**: Radial dial from 0 to 100 calculating current privacy posture based on enabled shields, blocked trackers, and bypass frequency.
- **Lifetime Metric Row**: Four large metric cards (Ads, Trackers, Malicious URLs, Fingerprinters) with trend indicators.
- **Recent Interception Stream**: Chronological feed of the 5 most recent blocked requests with domain, timestamp, and category badges.

#### Screen 2: Trackers & AI Guard
- **DNR Engine Status**: Live indicator showing dynamic rules utilized vs. allowed quota ($30,000$ limit).
- **Rule Set Toggles**: Enable/disable sub-rulesets (EasyList Ads, EasyPrivacy Beacons, Cryptomining Scripts, Social Trackers).
- **Tracker Taxonomy Breakdown**: Categorical breakdown chart (Analytics 54%, Advertising 32%, Fingerprinting 10%, Social 4%).

#### Screen 3: Secure Search
- **Active Privacy Provider**: Radio selection between DuckDuckGo, Brave Search, Startpage, and Ecosia.
- **Search Hygiene Toggles**:
  - `Redirect unencrypted search queries`: Force SSL.
  - `Strip referral identifiers`: Strip tracking parameters (`utm_*`, `gclid`, `fbclid`) before search engine receives request.
- **Omnibox Redirect Preview**: Visual interactive demo showing cleaned URL output.

#### Screen 4: Email Privacy
- **On-Demand Alias Generator**: Single-click generation of disposable email aliases (e.g., `shop-x9a2@privmail.panh.internal`).
- **One-Click Clipboard**: Instant copy with transient success badge.
- **Active Alias Management Table**: List of generated aliases, destination forwarding email, created date, and active/disabled toggle.

#### Screen 5: Link Scanner
- **URL Inspection Input**: Large text field accepting any full URL.
- **Scan Trigger Button**: Initiates hybrid local + heuristic AI classifier check.
- **Risk Score Card**:
  - Gauge indicator ($0 - 100$ scale).
  - Verdict pill (`SAFE` in green, `SUSPICIOUS` in yellow, `MALICIOUS` in red).
  - Plain-English bulleted reasons (e.g. *"Punycode spoofing detected"*, *"Domain registered 3 days ago"*, *"High entropy parameter structure"*).

#### Screen 6: Activity & Audit Logs
- **Time Range Selector**: Today / 7 Days / 30 Days toggle pills.
- **Activity Visualization**: Daily blocking volume bar chart.
- **Event Audit Table**: Searchable, paginated log of intercepted requests including:
  - Timestamp (ISO localized)
  - Category (Ad, Tracker, Phishing, Fingerprinter)
  - Target Host / Path
  - Initiating Domain
  - Action Taken (Blocked, Redirected, Warned)
- **Export Control**: "Export CSV" button exporting local storage logs for user audit.

#### Screen 7: Settings & Whitelist Management
- **Shield Configurations**: Aggressive blocking mode toggle (blocks first-party trackers and suspicious iframes).
- **Site Whitelist Manager**: Table of user-whitelisted domains with 1-click removal.
- **Storage Management**: Display of `chrome.storage.local` consumption with "Clear Event Logs" and "Factory Reset" buttons (with confirmation modal).

#### Screen 8: About & Help
- **Version Manifest**: App version (`1.0.0`), Engine version, Ruleset compilation date.
- **Security Manifesto**: Statement on local processing and zero telemetry commitment.
- **Documentation Links**: Links to GitHub repository, issue reporting, and release notes.

---

## 6. Warning Interstitial Blueprint

When the Threat Engine detects a high-risk malicious or phishing navigation, the browser intercepts the navigation and directs the user to `interstitial/warning.html`.

### Interstitial Wireframe
```
+--------------------------------------------------------------------------+
|                                                                          |
|                                 [ 🛑 ]                                   |
|                                                                          |
|                      Deceptive Site Ahead Blocked                        |
|                                                                          |
|       panH AI Edition has blocked access to malicious-banking.xyz        |
|                                                                          |
|   +------------------------------------------------------------------+   |
|   |  Threat Category: Phishing & Credential Theft                    |   |
|   |  Confidence Score: 98% [CRITICAL RISK]                           |   |
|   |                                                                  |   |
|   |  Why this was blocked:                                           |   |
|   |  • Domain newly registered within the past 48 hours              |   |
|   |  • High Levenshtein similarity to legitimate banking portal      |   |
|   |  • Detected credential harvesting form patterns                  |   |
|   +------------------------------------------------------------------+   |
|                                                                          |
|         [  Back to Safety (Recommended)  ]                               |
|                                                                          |
|   ▸ Advanced (I understand the risks, proceed anyway)                     |
|                                                                          |
+--------------------------------------------------------------------------+
```

### UX & Behavioral Rules for Interstitial
1. **Safety First**: The primary action button is "Back to Safety" (`#22C55E` or `#27B7D6`), which immediately closes the tab or calls `history.back()`.
2. **Hidden Friction for Bypass**: The bypass link is de-emphasized inside a collapsed disclosure accordion labeled *"Advanced"*.
3. **Double Confirmation on Bypass**: Clicking "Proceed to unsafe site" prompts an explicit confirmation modal before adding the domain to the temporary 24-hour bypass whitelist.
4. **No External Assets**: The interstitial page contains zero remote CSS, zero remote fonts, and zero external analytics scripts.

---

## 7. Accessibility & Usability Standards (WCAG 2.1 AA)

- **Color Contrast**:
  - Normal text on `--bg-primary` (`#F8FAFC` on `#0B1426`): Contrast ratio $> 15:1$ (exceeds $4.5:1$ requirement).
  - Secondary text on `--bg-primary` (`#A9B8CA` on `#0B1426`): Contrast ratio $> 8:1$.
  - Muted text on `--bg-card` (`#64748B` on `#17263D`): Contrast ratio $> 4.6:1$.
- **Non-Color Indicators**:
  - All status badges combine color with an explicit icon (✓, ⚠️, 🛑) and plain-text label (`Safe`, `Warning`, `Critical`).
- **Keyboard Navigation**:
  - Logical `tabindex` ordering across all views.
  - Visible focus indicator on all interactive controls:
    ```css
    *:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }
    ```
- **Screen Reader Support**:
  - All icon-only buttons include descriptive `aria-label` and `title` attributes.
  - Live metric counter updates utilize `aria-live="polite"`.

