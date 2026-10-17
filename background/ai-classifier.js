/**
 * panH - AI Behavioral Threat & Risk Classifier
 * Real-time heuristic and machine-learning feature scoring engine for unlisted trackers.
 */

// Common tracking query signatures
const TRACKING_QUERY_PATTERNS = [
  /(^|[?&])(u|v|c|s|g|d)?uid=/i,
  /(^|[?&])(visitor|device|client|anon|user|profile)_id=/i,
  /(^|[?&])(fingerprint|fp|canvas|hash|guid|uuid)=/i,
  /(^|[?&])(beacon|track|event|telemetry|analytics)=/i,
  /(^|[?&])(gclid|fbclid|msclkid|ttclid|mc_eid)=/i
];

// Telemetry endpoint signatures
const BEACON_PATH_PATTERNS = [
  /\/collect(\.|\/|\?|$)/i,
  /\/pixel(\.|\/|\?|$)/i,
  /\/beacon(\.|\/|\?|$)/i,
  /\/tr(\.|\/|\?|$)/i,
  /\/sync(\.|\/|\?|$)/i,
  /\/telemetry(\.|\/|\?|$)/i,
  /\/analytics(\.|\/|\?|$)/i,
  /\/track(ing)?(\.|\/|\?|$)/i,
  /\/events?(\.|\/|\?|$)/i
];

/**
 * Calculate Shannon Entropy of a string to detect machine-generated / randomized identifiers
 */
export function calculateShannonEntropy(str) {
  if (!str || str.length === 0) return 0;
  const frequencies = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Multi-vector AI Behavioral Evaluation
 */
export function evaluateRequestThreat({
  url = '',
  domain = '',
  siteDomain = '',
  sitesSeen = [],
  resourceType = 'other',
  hasLongCookie = false,
  isBeacon = false,
  isFingerprintProbe = false
}) {
  let score = 0;
  const signals = [];
  const confidenceFactors = [];

  const cleanDomain = (domain || '').toLowerCase();
  const urlLower = (url || '').toLowerCase();

  // 1. Cross-Site Dissemination Analysis
  const distinctSitesCount = sitesSeen.length || (siteDomain ? 1 : 0);
  if (distinctSitesCount >= 6) {
    score += 40;
    signals.push(`Observed harvesting telemetry across ${distinctSitesCount} distinct websites`);
    confidenceFactors.push(0.95);
  } else if (distinctSitesCount >= 3) {
    score += 25;
    signals.push(`Repeated cross-site presence across ${distinctSitesCount} independent domains`);
    confidenceFactors.push(0.8);
  } else if (distinctSitesCount >= 2) {
    score += 10;
    confidenceFactors.push(0.6);
  }

  // 2. Query Fingerprint Signature Analysis
  let matchedQueries = 0;
  for (const pattern of TRACKING_QUERY_PATTERNS) {
    if (pattern.test(urlLower)) {
      matchedQueries++;
    }
  }
  if (matchedQueries >= 2) {
    score += 25;
    signals.push('URL transmits cross-site persistent tracking tokens (UID/GUID/FP)');
    confidenceFactors.push(0.9);
  } else if (matchedQueries === 1) {
    score += 15;
    signals.push('Query contains visitor tracking parameters');
    confidenceFactors.push(0.75);
  }

  // 3. Telemetry Endpoint Pattern Matching
  let matchedPath = false;
  for (const pathRegex of BEACON_PATH_PATTERNS) {
    if (pathRegex.test(urlLower)) {
      matchedPath = true;
      break;
    }
  }
  if (matchedPath) {
    score += 20;
    signals.push('Matches known background telemetry & pixel collection endpoints');
    confidenceFactors.push(0.85);
  }

  // 4. Entropy Analysis (Randomized / DGA Subdomain or ID)
  const domainParts = cleanDomain.split('.');
  const subDomain = domainParts.length > 2 ? domainParts[0] : '';
  const entropy = calculateShannonEntropy(subDomain);
  if (entropy > 3.4 && subDomain.length > 8) {
    score += 15;
    signals.push('High Shannon entropy detected in subdomain (generated machine identifier)');
    confidenceFactors.push(0.8);
  }

  // 5. Hardware Fingerprint Probe Association
  if (isFingerprintProbe) {
    score += 35;
    signals.push('Correlated with Canvas or WebGL hardware fingerprinting readback');
    confidenceFactors.push(0.95);
  }

  // 6. Persistent Cookie State
  if (hasLongCookie) {
    score += 15;
    signals.push('Attempts to read/write persistent high-entropy identifiers');
    confidenceFactors.push(0.75);
  }

  // 7. Beacon / Ping Request Type
  if (isBeacon || resourceType === 'ping') {
    score += 15;
    signals.push('Initiated as an asynchronous background beacon / ping payload');
    confidenceFactors.push(0.8);
  }

  // Final score clamping
  const finalScore = Math.min(100, Math.max(0, score));

  // Compute confidence level
  const avgConfidence = confidenceFactors.length > 0
    ? confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length
    : 0.5;

  // Determine AI classification category
  let threatType = 'benign';
  let recommendedAction = 'Allow';

  if (finalScore >= 65) {
    threatType = isFingerprintProbe ? 'fingerprinting' : (distinctSitesCount >= 3 ? 'cross_site_tracker' : 'beacon');
    recommendedAction = 'Block';
  } else if (finalScore >= 40) {
    threatType = 'suspected_telemetry';
    recommendedAction = 'Review';
  }

  // Generate plain-language AI explanation
  let aiVerdict = '';
  if (finalScore >= 65) {
    aiVerdict = `AI Threat Engine flagged ${cleanDomain} (${finalScore}/100 Risk). ${signals.join('. ')}.`;
  } else if (finalScore >= 40) {
    aiVerdict = `${cleanDomain} demonstrates suspicious telemetry indicators (${finalScore}/100 Risk). ${signals.slice(0, 2).join('. ')}.`;
  } else {
    aiVerdict = `${cleanDomain} exhibits standard third-party utility behavior with low tracking risk (${finalScore}/100).`;
  }

  return {
    domain: cleanDomain,
    riskScore: finalScore,
    confidence: Math.round(avgConfidence * 100),
    threatType,
    signals,
    recommendedAction,
    aiVerdict
  };
}

