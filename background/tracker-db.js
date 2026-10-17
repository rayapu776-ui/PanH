/**
 * panH - Privacy & Anonymity Network Hub
 * Known Trackers & Explanations Knowledge Base
 */

export const KNOWN_TRACKERS = {
  'doubleclick.net': {
    name: 'Google DoubleClick',
    company: 'Alphabet Inc.',
    category: 'ad',
    risk: 'high',
    reason: 'Follows browsing activity across millions of websites to construct a personalized advertising dossier.'
  },
  'google-analytics.com': {
    name: 'Google Analytics',
    company: 'Alphabet Inc.',
    category: 'analytics',
    risk: 'medium',
    reason: 'Transmits session events, scroll behavior, device specifications, and page interaction times.'
  },
  'googletagmanager.com': {
    name: 'Google Tag Manager',
    company: 'Alphabet Inc.',
    category: 'analytics',
    risk: 'medium',
    reason: 'Container tag loader used to dynamically inject marketing scripts and third-party tracking pixels.'
  },
  'adnxs.com': {
    name: 'AppNexus / Xandr',
    company: 'Microsoft Corp.',
    category: 'ad',
    risk: 'high',
    reason: 'Real-time programmatic ad bidder syncing cross-site cookie IDs with multiple advertising exchanges.'
  },
  'criteo.com': {
    name: 'Criteo Retargeting',
    company: 'Criteo S.A.',
    category: 'ad',
    risk: 'high',
    reason: 'Tracks products you browse and retargets you with tailored ads on other websites you visit.'
  },
  'criteo.net': {
    name: 'Criteo Network',
    company: 'Criteo S.A.',
    category: 'ad',
    risk: 'high',
    reason: 'Serves behavioral retargeting assets and tracks viewability across publisher networks.'
  },
  'rubiconproject.com': {
    name: 'Magnite / Rubicon',
    company: 'Magnite Inc.',
    category: 'ad',
    risk: 'high',
    reason: 'Executes programmatic ad auctions and shares cross-site consumer profile identifiers.'
  },
  'taboola.com': {
    name: 'Taboola Content Recommendation',
    company: 'Taboola Inc.',
    category: 'ad',
    risk: 'medium',
    reason: 'Monitors reading interests and injects sponsored clickbait content feeds.'
  },
  'outbrain.com': {
    name: 'Outbrain Amplify',
    company: 'Outbrain Inc.',
    category: 'ad',
    risk: 'medium',
    reason: 'Tracks article reading history to profile user interests for sponsored content placement.'
  },
  'hotjar.com': {
    name: 'Hotjar Behavioral Analytics',
    company: 'Hotjar Ltd.',
    category: 'analytics',
    risk: 'high',
    reason: 'Records mouse movements, click heatmaps, and session screen replays of your interactions.'
  },
  'mixpanel.com': {
    name: 'Mixpanel',
    company: 'Mixpanel Inc.',
    category: 'analytics',
    risk: 'medium',
    reason: 'Logs granular in-app and website user events linked to persistent user identity tokens.'
  },
  'segment.io': {
    name: 'Twilio Segment',
    company: 'Twilio Inc.',
    category: 'analytics',
    risk: 'medium',
    reason: 'Customer data hub consolidating your interactions across multiple websites and marketing channels.'
  },
  'amplitude.com': {
    name: 'Amplitude Analytics',
    company: 'Amplitude Inc.',
    category: 'analytics',
    risk: 'medium',
    reason: 'Aggregates behavioral telemetry, retention funnels, and feature usage habits.'
  },
  'fullstory.com': {
    name: 'FullStory Digital Experience',
    company: 'FullStory Inc.',
    category: 'analytics',
    risk: 'high',
    reason: 'Reconstructs video-like session playbacks of every interaction, form click, and page movement.'
  },
  'clarity.ms': {
    name: 'Microsoft Clarity',
    company: 'Microsoft Corp.',
    category: 'analytics',
    risk: 'high',
    reason: 'Performs session recordings, scroll tracking, and rage-click telemetry.'
  },
  'facebook.net': {
    name: 'Meta Pixel',
    company: 'Meta Platforms',
    category: 'social',
    risk: 'high',
    reason: 'Links web visits to your Facebook/Instagram profile for conversion tracking and ad audience matching.'
  },
  'connect.facebook.net': {
    name: 'Meta Social SDK',
    company: 'Meta Platforms',
    category: 'social',
    risk: 'high',
    reason: 'Loads social graph connectors and passes browsing context to Meta advertising servers.'
  },
  'scorecardresearch.com': {
    name: 'Comscore ScorecardResearch',
    company: 'Comscore Inc.',
    category: 'analytics',
    risk: 'medium',
    reason: 'Surveys web traffic volume and sells syndicated consumer digital behavior reports.'
  },
  'adnet-x.com': {
    name: 'AdNet-X Behavioral Exchange',
    company: 'AdNet Technologies',
    category: 'ad',
    risk: 'high',
    reason: 'Tried to follow you across sites to correlate your reading habits with commercial intent.'
  },
  'pixel.tracker-a.io': {
    name: 'Tracker-A Sync Beacon',
    company: 'Tracker-A Global',
    category: 'analytics',
    risk: 'high',
    reason: 'Transmitted a cross-site persistent tracking ID via a transparent 1x1 image beacon.'
  },
  'cdn-metrics.net': {
    name: 'CDN Metrics Probe',
    company: 'Unknown Data Harvester',
    category: 'analytics',
    risk: 'high',
    reason: 'Disguised telemetry provider observed gathering user fingerprint signals across multiple domains.'
  }
};

/**
 * Categorize and provide plain-language explanation for any domain.
 */
export function explainDomainAction(domain, action = 'blocked', context = {}) {
  const cleanDomain = (domain || '').toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  // 1. Direct match in known database
  for (const [knownKey, data] of Object.entries(KNOWN_TRACKERS)) {
    if (cleanDomain === knownKey || cleanDomain.endsWith('.' + knownKey)) {
      return {
        matched: true,
        domain: cleanDomain,
        name: data.name,
        company: data.company,
        category: data.category,
        risk: data.risk,
        reason: data.reason
      };
    }
  }

  // 2. Heuristic classification based on subdomains or keywords
  if (/ad(s|service|server|network|click|banner|vert)?\./i.test(cleanDomain) || cleanDomain.includes('adnxs') || cleanDomain.includes('criteo') || cleanDomain.includes('adroll')) {
    return {
      matched: false,
      domain: cleanDomain,
      name: `${cleanDomain} (Ad Network)`,
      company: 'Third-party Ad Network',
      category: 'ad',
      risk: 'high',
      reason: 'Delivers behavioral display advertising and monitors impression conversion rates.'
    };
  }

  if (/analytics|telemetry|metrics|track|stats|log|ping|beacon/i.test(cleanDomain)) {
    return {
      matched: false,
      domain: cleanDomain,
      name: `${cleanDomain} (Telemetry)`,
      company: 'Third-party Analytics',
      category: 'analytics',
      risk: 'medium',
      reason: 'Collects background telemetry, event interactions, and user navigation telemetry.'
    };
  }

  if (cleanDomain.includes('fingerprint') || context.type === 'fingerprint') {
    return {
      matched: false,
      domain: cleanDomain,
      name: 'Browser Fingerprint Probe',
      company: 'Hardware Fingerprinter',
      category: 'fingerprinting',
      risk: 'high',
      reason: 'Probed Canvas, WebGL, or Audio APIs to construct a persistent hardware identity hash.'
    };
  }

  // 3. Fallback generic explanation
  return {
    matched: false,
    domain: cleanDomain,
    name: cleanDomain,
    company: 'Third-Party Service',
    category: 'analytics',
    risk: 'medium',
    reason: 'External script attempting to run background communications and track user sessions.'
  };
}

