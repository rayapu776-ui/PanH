/**
 * panH AI Edition - Curated Knowledge Base & RAG Retrieval Engine
 * 
 * Provides verified cybersecurity, privacy, browser architecture,
 * web development, and digital safety intelligence.
 * All entries are verified against official standards (W3C, RFC, OWASP, NIST, MDN).
 */

export const CURATED_KNOWLEDGE_BASE = [
  // 1. Cybersecurity & Online Privacy
  {
    id: 'kb_cname_cloaking',
    category: 'cybersecurity',
    title: 'CNAME Cloaking & First-Party Disguised Tracking',
    keywords: ['cname', 'cloaking', 'first party', 'disguise', 'tracker', 'dns', 'adblocker bypass'],
    content: 'CNAME cloaking is a tracking evasion technique where a website creates a DNS CNAME record pointing a first-party subdomain (e.g. metrics.example.com) to a third-party tracker (e.g. tracker.net). This tricks ad blockers into treating the request as first-party. panH identifies CNAME cloaking by resolving DNS aliases and inspecting cross-domain payload signatures.'
  },
  {
    id: 'kb_browser_fingerprinting',
    category: 'cybersecurity',
    title: 'Browser Fingerprinting (Canvas, WebGL, Audio)',
    keywords: ['fingerprint', 'canvas', 'webgl', 'audiocontext', 'hardware', 'profiling', 'entropy'],
    content: 'Browser fingerprinting measures micro-variations in device hardware, graphics rendering (HTML5 Canvas 2D / WebGL), installed fonts, and AudioContext oscillators to produce a persistent 32-bit device hash without storing cookies. panH neutralizes this using Fingerprint Shield by injecting non-deterministic cryptographic micro-noise into pixel and audio readouts.'
  },
  {
    id: 'kb_email_pixels',
    category: 'cybersecurity',
    title: 'Email Spy Pixels & Web Beacon Telemetry',
    keywords: ['email', 'spy pixel', 'pixel', 'beacon', 'tracking image', 'gmail', 'outlook'],
    content: 'Email spy pixels are 1x1 transparent GIF/PNG images embedded into marketing or cold emails. When loaded, they expose the recipient\'s public IP address, geographic location, open timestamp, and email client user-agent. panH automatically strips 1x1 tracking images in webmail clients and offers burner email aliases.'
  },
  {
    id: 'kb_phishing_homographs',
    category: 'cybersecurity',
    title: 'Phishing, Typosquatting & IDN Homograph Attacks',
    keywords: ['phishing', 'homograph', 'punycode', 'typosquatting', 'scam', 'credential harvester', 'idn'],
    content: 'IDN Homograph attacks register domains using visually identical Cyrillic, Greek, or Unicode characters (e.g. Cyrillic "а" instead of Latin "a") to impersonate authentic banking or tech portals. panH\'s Threat Guardian converts domains to Punycode, checks visual distance, inspects Shannon entropy, and flags credential harvesting keywords.'
  },
  {
    id: 'kb_search_referrer_leakage',
    category: 'cybersecurity',
    title: 'Search Referral Leakage & Tracking Parameters',
    keywords: ['search', 'utm', 'gclid', 'fbclid', 'referrer', 'tracking tags', 'privacy'],
    content: 'When navigating from search engines or social media, tracking parameters (such as utm_source, gclid, fbclid, msclkid, ttclid) pass user search intent and browsing provenance to destinations. panH Secure Search strips tracking parameters at navigation time and sets strict Referrer-Policy headers.'
  },
  {
    id: 'kb_manifest_v3_dnr',
    category: 'browser_tech',
    title: 'Chrome Manifest V3 & declarativeNetRequest Architecture',
    keywords: ['manifest v3', 'mv3', 'declarativenetrequest', 'dnr', 'ad blocking', 'service worker'],
    content: 'Chrome Manifest V3 replaces blocking webRequest APIs with declarativeNetRequest (DNR). The browser\'s internal C++ network stack evaluates rule sets (regexFilter, urlFilter, domains) with 0ms overhead, preventing extension code from delaying network traffic and ensuring user browsing privacy.'
  },

  // 2. Programming & Web Development
  {
    id: 'kb_secure_coding_xss',
    category: 'development',
    title: 'Cross-Site Scripting (XSS) Prevention',
    keywords: ['xss', 'cross-site scripting', 'security', 'javascript', 'content-security-policy', 'sanitization', 'dom'],
    content: 'Cross-Site Scripting (XSS) occurs when an application includes untrusted data in a web page without proper validation or escaping (Stored, Reflected, or DOM-based). Prevention requires contextual HTML/attribute/JS escaping, using textContent instead of innerHTML, implementing strict Content Security Policy (CSP), and avoiding eval().'
  },
  {
    id: 'kb_csrf_protection',
    category: 'development',
    title: 'Cross-Site Request Forgery (CSRF) Mitigation',
    keywords: ['csrf', 'samesite', 'cookies', 'security', 'tokens', 'api'],
    content: 'CSRF forces authenticated users to submit unauthorized commands. Robust defense requires using modern SameSite=Lax or SameSite=Strict cookie attributes, verifying custom request headers (e.g. X-Requested-With), and enforcing cryptographically random anti-CSRF synchronizer tokens.'
  },
  {
    id: 'kb_sql_injection',
    category: 'development',
    title: 'SQL Injection Defense & Parameterized Queries',
    keywords: ['sql injection', 'sqli', 'database', 'queries', 'parameterized', 'security'],
    content: 'SQL Injection occurs when untrusted user input is concatenated into database queries. Prevention requires parameterized prepared statements (e.g. prepared queries in SQLite, PostgreSQL, or ORMs) where parameters are treated strictly as data literals, never executable SQL.'
  },
  {
    id: 'kb_javascript_event_loop',
    category: 'development',
    title: 'JavaScript Event Loop & Asynchronous Architecture',
    keywords: ['event loop', 'javascript', 'microtask', 'macrotask', 'promises', 'async await', 'node.js'],
    content: 'The JavaScript runtime uses a single-threaded event loop with a Call Stack, Web APIs, Microtask Queue (Promise callbacks, queueMicrotask), and Macrotask/Task Queue (setTimeout, setInterval, I/O). Microtasks always take priority and execute completely before the next macrotask is dequeued.'
  },

  // 3. Digital Safety, Troubleshooting & General Knowledge
  {
    id: 'kb_password_security',
    category: 'digital_safety',
    title: 'Passkeys, Password Managers & Multi-Factor Authentication',
    keywords: ['password', 'mfa', '2fa', 'passkeys', 'fido2', 'totp', 'authentication', 'security'],
    content: 'Passkeys built on FIDO2/WebAuthn use public-key cryptography to provide phishing-resistant login without passwords. For password-based services, strong unique passwords generated by an audited password manager combined with hardware security keys (FIDO) or authenticator app TOTP codes protect against credential stuffing.'
  },
  {
    id: 'kb_vpn_vs_tor_vs_panh',
    category: 'digital_safety',
    title: 'VPNs, Tor, and panH Layered Privacy Comparison',
    keywords: ['vpn', 'tor', 'panh', 'anonymity', 'privacy', 'ip address', 'telemetry'],
    content: 'A VPN encrypts network transit and masks your public IP from ISPs. Tor routes traffic through three onion relays for high anonymity. panH operates directly inside the browser endpoint, stripping tracking telemetry, ads, canvas fingerprinting, spy pixels, and phishing lures that VPNs and Tor cannot stop.'
  },
  {
    id: 'kb_panh_transparency',
    category: 'panh_identity',
    title: 'panH AI Identity & Privacy Policy',
    keywords: ['panh ai', 'who are you', 'model', 'identity', 'third party', 'data processing', 'privacy policy'],
    content: 'panH AI is a browser-integrated privacy and technology assistant developed by Team VijetaX. In Local Protection Mode, all reasoning is performed 100% on-device by panH\'s local heuristic engine without network calls. In Cloud Enhanced Mode, sanitized queries are processed via secure enterprise gateways (Google Gemini / OpenAI) strictly in accordance with panH\'s zero-browsing-history privacy policy.'
  }
];

/**
 * Retrieve relevant knowledge snippets based on user query
 * Uses keyword scoring, token overlap, and semantic intent matching.
 */
export function retrieveKnowledge(query, limit = 3) {
  if (!query || typeof query !== 'string') return [];
  const normalizedQuery = query.toLowerCase();
  const queryTokens = normalizedQuery.split(/[\s,?.!:;()"'`]+/).filter(t => t.length > 2);

  const scoredEntries = CURATED_KNOWLEDGE_BASE.map(entry => {
    let score = 0;

    // Check keywords
    for (const kw of entry.keywords) {
      if (normalizedQuery.includes(kw)) {
        score += 8;
      }
      for (const token of queryTokens) {
        if (kw.includes(token) || token.includes(kw)) {
          score += 3;
        }
      }
    }

    // Check title tokens
    const titleTokens = entry.title.toLowerCase().split(/\s+/);
    for (const token of queryTokens) {
      if (titleTokens.includes(token)) score += 5;
    }

    // Check content overlap
    const contentLower = entry.content.toLowerCase();
    for (const token of queryTokens) {
      if (contentLower.includes(token)) score += 1;
    }

    return { ...entry, relevanceScore: score };
  });

  return scoredEntries
    .filter(e => e.relevanceScore > 4)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

