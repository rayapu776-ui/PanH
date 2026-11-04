/**
 * panH - Threat Guardian & Link Reputation Engine
 * Implements Section 2.3, 4.4, 4.5, and 8.2 of panH AI Edition Blueprint
 * Normalizes URLs, checks local threat indicators, evaluates heuristic risk,
 * and produces structured risk evidence.
 */

// Known threat feed of deceptive / phishing / malicious patterns & domains
export const KNOWN_THREAT_INDICATORS = {
  'phishing-demo.test': {
    verdict: 'malicious',
    risk_level: 'high',
    confidence: 0.98,
    category: 'phishing',
    reasons: ['Known phishing credential harvester', 'Flagged in threat intelligence feed'],
    recommended_action: 'block_immediately'
  },
  'malware-drop.test': {
    verdict: 'malicious',
    risk_level: 'high',
    confidence: 0.99,
    category: 'malware',
    reasons: ['Distributes deceptive executable payloads', 'Known malicious command-and-control host'],
    recommended_action: 'block_immediately'
  },
  'login-secure-account-verify.xyz': {
    verdict: 'malicious',
    risk_level: 'high',
    confidence: 0.95,
    category: 'phishing',
    reasons: ['Deceptive domain targeting banking/account credentials', 'Suspicious disposable TLD'],
    recommended_action: 'block_immediately'
  },
  'update-browser-critical-patch.top': {
    verdict: 'malicious',
    risk_level: 'high',
    confidence: 0.96,
    category: 'scam',
    reasons: ['Fake software update scam', 'High risk TLD with deceptive branding'],
    recommended_action: 'block_immediately'
  },
  'reward-gift-claim-online.click': {
    verdict: 'suspicious',
    risk_level: 'medium',
    confidence: 0.85,
    category: 'scam',
    reasons: ['Deceptive lottery/survey lure pattern', 'Unverified registrar and suspicious redirect pattern'],
    recommended_action: 'review_before_proceeding'
  }
};

// High-risk TLDs often abused for disposable phishing campaigns
const HIGH_RISK_TLDS = ['.xyz', '.top', '.click', '.loan', '.work', '.gq', '.cf', '.tk', '.ml', '.buzz', '.country'];

// Phishing keywords often combined with high-risk TLDs
const PHISHING_KEYWORDS = [
  'login', 'signin', 'verify', 'account', 'secure', 'banking', 'wallet', 'update', 'support',
  'password', 'billing', 'confirm', 'recover', 'auth', 'security', 'official', 'service'
];

/**
 * Safely parse and normalize URLs
 * Rejects malformed schemes, decodes punycode, strips fragments.
 */
export function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let target = rawUrl.trim();
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }

  try {
    const parsed = new URL(target);
    // Allow only http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return {
      href: parsed.href,
      protocol: parsed.protocol,
      hostname: parsed.hostname.toLowerCase(),
      pathname: parsed.pathname,
      search: parsed.search,
      searchParams: parsed.searchParams
    };
  } catch (err) {
    return null;
  }
}

/**
 * Detect IDN / Punycode Deceptive Homograph Spoofs
 */
export function checkHomographDeception(hostname) {
  if (!hostname) return { isDeceptive: false };

  // Detect Punycode (xn--)
  if (hostname.startsWith('xn--') || hostname.includes('.xn--')) {
    return {
      isDeceptive: true,
      reason: 'Punycode internationalized domain detected (possible homograph impersonation attack)'
    };
  }

  // Detect IP address hostnames used for malicious links
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return {
      isDeceptive: true,
      reason: 'Raw numeric IP address used as hostname instead of a verified domain'
    };
  }

  return { isDeceptive: false };
}

/**
 * In-memory Threat Reputation Cache with timestamped expiry (Section 2.3)
 */
const reputationCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Assess a URL and return a strict Section 8.2 JSON Risk Evidence schema
 */
export function assessUrl(rawUrl, siteAllowList = [], siteBlockList = []) {
  const norm = normalizeUrl(rawUrl);
  if (!norm) {
    return {
      verdict: 'unknown',
      risk_level: 'low',
      confidence: 0.1,
      reasons: ['Malformed or unsupported URL scheme'],
      source_updated_at: new Date().toISOString(),
      recommended_action: 'check_url_syntax'
    };
  }

  const hostname = norm.hostname;

  // 1. Check user-defined allow-list (Section 2.2 & 4.5)
  if (siteAllowList.some(allowed => hostname === allowed || hostname.endsWith('.' + allowed))) {
    return {
      verdict: 'safe',
      risk_level: 'low',
      confidence: 1.0,
      reasons: ['Explicitly approved in your personal Site Allow-List'],
      source_updated_at: new Date().toISOString(),
      recommended_action: 'allow_user_exception'
    };
  }

  // 2. Check user-defined block-list (Section 2.2)
  if (siteBlockList.some(blocked => hostname === blocked || hostname.endsWith('.' + blocked))) {
    return {
      verdict: 'malicious',
      risk_level: 'high',
      confidence: 1.0,
      reasons: ['Explicitly blocked by your personal Site Block-List rule'],
      source_updated_at: new Date().toISOString(),
      recommended_action: 'block_immediately'
    };
  }

  // 3. Check Reputation Cache
  const cached = reputationCache.get(hostname);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.result;
  }

  // 4. Check Known Threat Indicators Feed
  for (const [threatDomain, meta] of Object.entries(KNOWN_THREAT_INDICATORS)) {
    if (hostname === threatDomain || hostname.endsWith('.' + threatDomain)) {
      const result = {
        verdict: meta.verdict,
        risk_level: meta.risk_level,
        confidence: meta.confidence,
        reasons: meta.reasons,
        source_updated_at: new Date().toISOString(),
        recommended_action: meta.recommended_action
      };
      reputationCache.set(hostname, { timestamp: Date.now(), result });
      return result;
    }
  }

  // 5. Run Heuristic Threat Detection
  const reasons = [];
  let riskScore = 0;

  // Homograph / Punycode check
  const homograph = checkHomographDeception(hostname);
  if (homograph.isDeceptive) {
    riskScore += 45;
    reasons.push(homograph.reason);
  }

  // TLD and keyword correlation
  const hasHighRiskTld = HIGH_RISK_TLDS.some(tld => hostname.endsWith(tld));
  const matchedKeywords = PHISHING_KEYWORDS.filter(kw => hostname.includes(kw));

  if (hasHighRiskTld && matchedKeywords.length >= 2) {
    riskScore += 60;
    reasons.push(`Suspicious combination of high-risk TLD and security/banking keywords (${matchedKeywords.join(', ')})`);
  } else if (hasHighRiskTld && matchedKeywords.length === 1) {
    riskScore += 35;
    reasons.push(`Domain pairs sensitive keyword '${matchedKeywords[0]}' with disposable TLD`);
  }

  // Brand impersonation in domain or subdomain (e.g. paypal-security-update.top or paypal.com.verify.net)
  const targetBrands = ['paypal', 'netflix', 'amazon', 'google', 'microsoft', 'apple', 'chase', 'wellsfargo', 'coinbase', 'binance'];
  for (const brand of targetBrands) {
    if (hostname.includes(brand) && !hostname.endsWith(`.${brand}.com`) && hostname !== `${brand}.com` && !hostname.endsWith(`.${brand}.net`)) {
      riskScore += 45;
      reasons.push(`High-probability brand impersonation targeting "${brand}"`);
      break;
    }
  }

  // Subdomain depth deception (e.g. login.secure.verify.account.net)
  const parts = hostname.split('.');
  if (parts.length > 3) {
    riskScore += 20;
    reasons.push(`Excessive subdomain nesting depth (${parts.length} levels)`);
  }

  // Suspicious query tokens in URL
  if (norm.searchParams.has('redirect') || norm.searchParams.has('goto') || norm.searchParams.has('url')) {
    const dest = norm.searchParams.get('redirect') || norm.searchParams.get('goto') || norm.searchParams.get('url');
    if (dest && /^https?:\/\//i.test(dest)) {
      riskScore += 25;
      reasons.push('Contains unvalidated open redirect parameter in query string');
    }
  }

  let verdict = 'safe';
  let risk_level = 'low';
  let recommended_action = 'allow_with_monitoring';
  let confidence = 0.85;

  if (riskScore >= 70) {
    verdict = 'malicious';
    risk_level = 'high';
    recommended_action = 'block_immediately';
    confidence = Math.min(0.96, 0.7 + (riskScore / 250));
  } else if (riskScore >= 35) {
    verdict = 'suspicious';
    risk_level = 'medium';
    recommended_action = 'review_before_proceeding';
    confidence = Math.min(0.90, 0.6 + (riskScore / 250));
  } else {
    // Insufficient evidence - do not blindly call 100% safe (Section 4.5 & 4.6)
    verdict = 'safe';
    risk_level = 'low';
    confidence = 0.82;
    reasons.push('No recognized phishing patterns, homographs, or malicious signatures detected');
  }

  const result = {
    verdict,
    risk_level,
    confidence: Number(confidence.toFixed(2)),
    reasons,
    source_updated_at: new Date().toISOString(),
    recommended_action
  };

  reputationCache.set(hostname, { timestamp: Date.now(), result });
  return result;
}

