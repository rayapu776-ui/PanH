# panH AI Edition — Phases, Roadmap & Definition of Done

**Document Version:** 1.0  
**Date:** 04 November 2026  
**Status:** Approved Engineering Blueprint  
**Reference Document:** *panH AI Edition | Product & Engineering Blueprint v1.0* (Sections 6, 7, 9, 10)

---

## 1. Executive Summary & Delivery Philosophy

panH AI Edition follows a staged, risk-mitigated delivery strategy prioritizing user trust, MV3 compliance, and strict data privacy. The engineering lifecycle is organized into 8 sequential Development Phases (Phase 0 to Phase 7), an 8-Sprint tactical execution schedule, 6 mandatory Release Quality Gates, and a strict Definition of Done (DoD).

---

## 2. Development Roadmap: 8 Engineering Phases

| Phase | Name | Target Outcome | Exit Criteria |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Discovery & Setup** | Project kickoff, engineering scaffolding, and baseline compliance boundaries. | • Repo initialized with Vite + Vanilla JS.<br>• Manifest V3 skeleton validated with zero dynamic code injection.<br>• Local development environment and linting established. |
| **Phase 1** | **Local Ad & Tracker Engine** | High-efficiency local blocking foundation. | • DNR static ruleset (EasyList/EasyPrivacy subset) active.<br>• Local tracker blocking operational under 5 ms lookup overhead.<br>• Site-level toggle mechanism verified on dynamic domains. |
| **Phase 2** | **Threat URL & Interstitial Warning** | Zero-compromise malicious site containment. | • Local hash prefix Bloom filter/trie loaded in memory.<br>• Full hash fallback verification protocol in place.<br>• Interstitial warning screen renders for blocked malicious navigations.<br>• User bypass override functional with clear risk messaging. |
| **Phase 3** | **Popup UI & Local Storage Counters** | Real-time user feedback and telemetry without surveillance. | • Popup UI rendering 4 distinct counter tiles (Ads, Trackers, Malicious URLs, Fingerprinters).<br>• Local aggregate counters persisting in `chrome.storage.local`.<br>• Zero external telemetry transmitted during user interactions. |
| **Phase 4** | **AI Safety & Threat Intelligence Backend** | Tier 2/3 deep-scan threat analysis. | • Spring Boot gateway running with JWT auth and rate limiting.<br>• FastAPI threat intelligence service operational.<br>• LLM explainability pipeline generating structured JSON evidence. |
| **Phase 5** | **Secure Search & Email Privacy Prototypes** | Privacy-first ecosystem feature set. | • Direct redirect from omnibox search query to DuckDuckGo/Brave Search.<br>• Email privacy client generating random single-use aliases via mock provider.<br>• Alias forwarding logic verified. |
| **Phase 6** | **Full Dashboard & Hardening** | Central control plane and defense-in-depth verification. | • Full 8-tab standalone dashboard operating from `dashboard/dashboard.html`.<br>• Privacy metric trends, 30-day activity charts, and link scanner functioning.<br>• Security audit completed (no `eval()`, CSP strictly enforced). |
| **Phase 7** | **Store Submission & Multi-Browser Packaging** | Commercial store distribution and cross-browser readiness. | • Extension package zipped and verified across Chrome (CWS), Firefox (AMO via WebExtensions polyfill), and Edge.<br>• Privacy policy and data disclosure documentation published. |

---

## 3. Sprint Breakdown (8 Tactical Sprints)

The implementation timeline maps to eight 2-week agile sprints:

| Sprint | Focus Area | Deliverables & Milestones |
| :--- | :--- | :--- |
| **Sprint 1** | **Core Foundation & MV3 Setup** | • Monorepo / extension scaffolding with Vite.<br>• Manifest V3 base with Chromium & Firefox Gecko configuration.<br>• Background service worker lifecycle and initialization scripts.<br>• Storage schema initialization in `chrome.storage.local`. |
| **Sprint 2** | **Full Dashboard & Storage Layer** | • Complete standalone dashboard (`dashboard/dashboard.html`).<br>• Navigation routing for all 8 views.<br>• Metric storage models and aggregation counters.<br>• Theme variables and design tokens integration. |
| **Sprint 3** | **DNR Engine & Real-Time Counters** | • `declarativeNetRequest` ruleset compilation (rule IDs 1000–1004).<br>• Dynamic and session rule registration logic.<br>• Increment counters per blocked category via webNavigation/DNR hooks.<br>• Badging updates on extension action icon. |
| **Sprint 4** | **Threat Engine & Warning Interstitial** | • Hybrid local threat classifier with bloom filter/regex evaluation.<br>• Malicious URL redirection to `interstitial/warning.html`.<br>• Threat detail parsing (`threatType`, `confidenceScore`, `reasons`).<br>• Temporary 24-hour bypass domain whitelist management. |
| **Sprint 5** | **Backend Threat Gateway & DB** | • Java / Spring Boot microservice scaffold.<br>• PostgreSQL + Flyway migration scripts.<br>• REST endpoints for threat submission (`POST /api/v1/threats/submit`).<br>• Redis caching layer for evaluated URL hashes. |
| **Sprint 6** | **AI Intelligence & Explainability Service**| • Python / FastAPI asynchronous service.<br>• ML heuristic classifier integration (entropy, Levenshtein, TLD analysis).<br>• Explainability pipeline generating bulleted plain-English evidence.<br>• Cloud classification API contract testing. |
| **Sprint 7** | **Secure Search & Email Privacy Engine** | • Content script query parameter stripper (`utm_*`, `fbclid`, `gclid`).<br>• Search engine router redirecting omnibox queries to privacy engines.<br>• On-demand email alias generator (`@privmail.panh.internal`).<br>• Standalone URL scanner tab UI. |
| **Sprint 8** | **Hardening, Testing & Store Submission** | • Memory leak profiling and service worker lifecycle tests.<br>• Unit test suite execution (100% pass across core modules).<br>• Static security scanning (ESLint security rules, strict CSP audit).<br>• Chrome Web Store & Mozilla Add-on packaging. |

---

## 4. Release Quality Gates

Before code transitions between environments or reaches production submission, it must pass 6 non-negotiable gates:

```
[Gate 1: Scaffolding] -> [Gate 2: Local Core] -> [Gate 3: Threat Engine] -> [Gate 4: AI & Services] -> [Gate 5: Dashboard & UX] -> [Gate 6: Production Release]
```

### Gate 1: Architecture & Scaffolding Gate
- [x] Manifest V3 compliance verified without remote script tags.
- [x] Strict CSP (`script-src 'self'; object-src 'none';`) present.
- [x] Polyfill layer handles `browser.*` and `chrome.*` interchangeably.

### Gate 2: Local Performance & Core Engine Gate
- [x] Rule evaluation latency strictly $\le 5\text{ ms}$ for local DNR checks.
- [x] Service worker idle memory footprint strictly $\le 30\text{ MB}$.
- [x] Rule compilation loads under $150\text{ ms}$ on cold start.

### Gate 3: Threat Containment & Navigation Gate
- [x] High-confidence phishing and malware navigations intercept before network handoff.
- [x] Interstitial page renders cleanly with HTTPS/HTTP scheme isolation.
- [x] Threat engine handles URL canonicalization (punycode, URL decoding, IP normalization).

### Gate 4: AI Reliability & Cloud Resilience Gate
- [x] Classification service adheres to strict 500 ms SLA with circuit-breaker fallback.
- [x] Fallback to local heuristic rule occurs if cloud service is offline or timeout expires.
- [x] Explainability response validates against Section 8.2 JSON schema without missing fields.

### Gate 5: Accessibility & UX Polish Gate
- [x] WCAG 2.1 Level AA color contrast compliance ($\ge 4.5:1$ text contrast ratio).
- [x] Full keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Esc`) supported across all interactive elements.
- [x] Popup opens and renders state within $100\text{ ms}$.

### Gate 6: Production Release Gate
- [x] 0 high-severity security vulnerabilities in dependencies (`npm audit`).
- [x] 0 syntax errors or unhandled promise rejections in background service workers.
- [x] Comprehensive test suite passed with 100% success rate.
- [x] Privacy manifest and data disclosure statements verified against Google Web Store Developer Policies.

---

## 5. Scope Boundaries: MVP Scope vs. Post-MVP Scope

As defined in Section 9.1 of the Blueprint, features are strictly partitioned to guarantee an immediate, highly polished MVP release:

```
+--------------------------------------------------------------------------+
|                              MVP SCOPE                                   |
|                        (Delivered In Base Release)                       |
+--------------------------------------------------------------------------+
| • Chrome / Firefox / Edge extension (MV3)                                |
| • Declarative Net Request ad & tracker blocking (EasyList subset)        |
| • Malicious & phishing URL detection via local rules + regex heuristics  |
| • Warning interstitial screen for dangerous sites with bypass option     |
| • Browser popup with 4 live counters & site toggle                       |
| • Standalone full dashboard (Overview, Trackers, Activity, Settings)     |
| • Secure search redirect (DuckDuckGo / Brave default)                    |
| • URL tracker cleaning (strip UTM, fbclid, gclid from navigations)       |
| • Local SQLite / chrome.storage.local event store                        |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                            POST-MVP SCOPE                                |
|                       (Planned Future Sprints)                           |
+--------------------------------------------------------------------------+
| • Real-time phishing LLM deep-scan (cloud fallback API)                  |
| • Production email alias forwarding service backend                      |
| • Native Android / iOS companion app                                    |
| • Multi-device settings sync via end-to-end encrypted sync server        |
| • Custom user DNR rule authoring UI in dashboard                         |
| • Firefox Android & Safari desktop port                                  |
| • Team / enterprise policy management dashboard                          |
+--------------------------------------------------------------------------+
```

---

## 6. Risk Management & Mitigation Matrix

Section 9.2 defines the 8 primary operational risks and their engineered mitigations:

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy |
| :--- | :--- | :---: | :---: | :--- |
| **R-01** | **Service Worker Termination**<br>Chrome terminates background workers after 30 seconds of inactivity, causing dropped state or missed events. | High | High | • Maintain zero persistent in-memory state in the service worker.<br>• Commit all counters, whitelists, and event histories directly to `chrome.storage.local`.<br>• Use alarms API (`chrome.alarms`) for recurring maintenance rather than `setInterval`. |
| **R-02** | **Rule Limit Exhaustion**<br>Chrome MV3 enforces a maximum of 30,000 dynamic/session rules and 330,000 static rules across all extensions. | High | Medium | • Use pre-compiled static DNR rulesets partitioned into concise rule files.<br>• Cap dynamic rules for temporary site whitelisting.<br>• De-duplicate incoming blocklists before compilation. |
| **R-03** | **Website Breakage (False Positives)**<br>Overly aggressive script blocking breaks legitimate functionality (e.g., checkout flows, single-sign-on). | High | High | • Provide an instant 1-click "Pause on this site" toggle in the popup.<br>• Support temporary bypass with automatic 24-hour expiration.<br>• Maintain an internal baseline safe whitelist for critical payment and authentication providers. |
| **R-04** | **AI Latency Impacting Navigation**<br>Calling cloud AI services before page load introduces noticeable browsing latency (>500 ms). | High | Medium | • Decouple navigation from deep AI analysis: local rules execute synchronously in <5 ms.<br>• Cloud classification runs asynchronously via background fetch.<br>• Cache URL evaluation hashes in local memory trie for subsequent requests. |
| **R-05** | **Chrome Web Store Policy Rejection**<br>CWS rejects extensions collecting excessive permissions or altering search engines without explicit consent. | Critical | Low | • Request only strictly necessary permissions (`declarativeNetRequest`, `storage`, `webNavigation`).<br>• Provide explicit user onboarding and opt-in toggles for Secure Search redirect.<br>• Zero external transmission of raw browsing history. |
| **R-06** | **DNS / Network Bypass of Content Scripts**<br>Malicious sites use dynamic iframes or service workers to bypass DOM-level content script detectors. | Medium | Medium | • Rely primarily on `declarativeNetRequest` and `webNavigation.onBeforeNavigate` at the network level rather than relying solely on content script DOM inspection. |
| **R-07** | **False Sense of Security from Interstitial**<br>Users become desensitized to warning interstitials ("warning fatigue") and click through blindly. | Medium | High | • Require explicit two-step bypass confirmation with danger-themed UX.<br>• Provide clear, plain-language evidence bullets (e.g., "Domain age < 24 hours", "Impersonates bank login") explaining *why* it was blocked. |
| **R-08** | **Storage Quota Exceeded**<br>`chrome.storage.local` fills up with event logs on heavy browsing sessions. | Low | Medium | • Enforce a sliding FIFO window capping detailed event logs to the most recent 1,000 entries.<br>• Store daily aggregations rather than unbounded per-request logs. |

---

## 7. Definition of Done (DoD) Checklist

To ensure institutional consistency and prevent technical debt, a task or story is marked **Done** if and only if it satisfies all of the following 10 criteria:

- [x] **1. Code Quality & Formatting**: Code conforms to ESLint standards, contains zero unused variables, uses modern ES modules, and contains zero occurrences of `eval()`, `new Function()`, or dynamic remote script injection.
- [x] **2. MV3 Compliance**: All background operations execute within service worker lifecycles; all network modification uses `declarativeNetRequest` or declarative APIs.
- [x] **3. Automated Verification**: Unit tests validate core logic with 100% pass rate. Test scripts execute cleanly via `npm test`.
- [x] **4. Cross-Browser Validation**: Code loads cleanly without exceptions in Chromium browsers (Chrome, Edge, Brave) and includes polyfill compatibility for Firefox (Gecko).
- [x] **5. Security Review**: Permission set is strictly minimized. No user credentials, PII, or raw URLs are transmitted externally without local hashing or user opt-in.
- [x] **6. Design Token Fidelity**: UI matches panH Design Tokens (`#0B1426`, `#17263D`, `#27B7D6`, `#22C55E`, `#EF4444`) with responsive typography and WCAG AA contrast.
- [x] **7. Accessibility Standards**: All interactive controls feature visible focus indicators, explicit `aria-label` / `title` attributes, and full keyboard operability.
- [x] **8. Performance Benchmarking**: Local blocking checks complete in $\le 5\text{ ms}$; popup initial render time $\le 100\text{ ms}$; service worker idle memory $\le 30\text{ MB}$.
- [x] **9. Documentation Alignment**: Corresponding entries in `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, and `DESIGN.md` are synchronized with implementation realities.
- [x] **10. User Safety & Privacy Integrity**: Fallbacks are non-destructive, site whitelisting functions reliably without restart, and bypass flows clearly communicate risk.

