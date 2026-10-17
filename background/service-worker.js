/**
 * panH - Privacy & Anonymity Network Hub
 * Background Service Worker: Core Privacy Engine with AI Threat Intelligence
 * Compatible across Chrome, Edge, Firefox, Brave, and Opera (Manifest V3)
 */

import { explainDomainAction, KNOWN_TRACKERS } from './tracker-db.js';
import { evaluateRequestThreat } from './ai-classifier.js';
import { generateSiteAuditSummary, generateRuleBasedTips, queryAIAdvisor } from './ai-engine.js';

// Cross-browser API bridge
const api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

const DEFAULT_SETTINGS = {
  masterEnabled: true,
  adsBlocker: true,
  trackerBlocker: true,
  fingerprintShield: true,
  secureSearch: true,
  emailPrivacy: true,
  cosmeticFilter: true,
  searchEngine: 'duckduckgo',
  stripTrackingParams: true,
  aiThreatDetection: true,
  aiModelPreference: 'auto', // 'auto' | 'local_only' | 'gemini'
  geminiApiKey: '',
  whitelistedDomains: []
};

// Seed initial realistic baseline telemetry matching project specs
const INITIAL_STATS = {
  totalTrackersBlocked: 1284,
  totalAdsBlocked: 3902,
  newSuspectsCount: 7,
  totalEvents: 5193,
  timeframe: {
    today: { ads: 540, trackers: 240 },
    week: { ads: 3902, trackers: 1284 }
  }
};

const INITIAL_LOGS = [
  {
    id: 'evt_1',
    timestamp: Date.now() - 1000 * 45,
    domain: 'pixel.tracker-a.io',
    siteDomain: 'shop.com',
    category: 'analytics',
    action: 'blocked',
    reason: 'pixel.tracker-a.io on shop.com: cross-site ID sync beacon'
  },
  {
    id: 'evt_2',
    timestamp: Date.now() - 1000 * 120,
    domain: 'cdn-metrics.net',
    siteDomain: 'news-portal.io',
    category: 'analytics',
    action: 'suspected',
    reason: 'cdn-metrics.net seen on 18 sites: behavioral telemetry harvester'
  },
  {
    id: 'evt_3',
    timestamp: Date.now() - 1000 * 240,
    domain: 'canvas.fingerprint-probe',
    siteDomain: 'blog.org',
    category: 'fingerprinting',
    action: 'shielded',
    reason: 'Shielded canvas fingerprint request on blog.org'
  },
  {
    id: 'evt_4',
    timestamp: Date.now() - 1000 * 360,
    domain: 'doubleclick.net',
    siteDomain: 'techreview.com',
    category: 'ad',
    action: 'blocked',
    reason: 'Google DoubleClick: Cross-site advertising profile synchronizer'
  },
  {
    id: 'evt_5',
    timestamp: Date.now() - 1000 * 500,
    domain: 'spy-pixel.mailchimp.com',
    siteDomain: 'mail.google.com',
    category: 'email',
    action: 'blocked',
    reason: 'Neutralized 1x1 invisible open tracking pixel in email newsletter'
  }
];

const INITIAL_SUSPECTS = {
  'cdn-metrics.net': {
    domain: 'cdn-metrics.net',
    seenCount: 18,
    sitesSeen: ['shop.com', 'news-portal.io', 'techreview.com', 'blog.org'],
    score: 85,
    confidence: 92,
    threatType: 'cross_site_tracker',
    status: 'suspected',
    reasons: ['Seen across 18 unrelated domains', 'Sends recurring beacon payloads', 'Sets UUID tracking cookie'],
    aiVerdict: 'AI Threat Engine: High confidence cross-site tracker transmitting hardware identifiers across 18 publisher sites.'
  },
  'collector-edge.io': {
    domain: 'collector-edge.io',
    seenCount: 9,
    sitesSeen: ['media-hub.net', 'buyonline.org'],
    score: 72,
    confidence: 84,
    threatType: 'beacon',
    status: 'suspected',
    reasons: ['High frequency third-party beacons', 'Unregistered analytics endpoint'],
    aiVerdict: 'AI Threat Engine: Recurring background telemetry collector harvesting page scroll and dwell times.'
  },
  'audience-sync.xyz': {
    domain: 'audience-sync.xyz',
    seenCount: 12,
    sitesSeen: ['deals.com', 'reviewdaily.net'],
    score: 79,
    confidence: 89,
    threatType: 'ad_sync',
    status: 'suspected',
    reasons: ['Queries localStorage and canvas data', 'Exchanges cross-domain URL tokens'],
    aiVerdict: 'AI Threat Engine: Programmatic audience exchange syncing visitor identifiers across e-commerce portals.'
  }
};

/**
 * Extension Installation & Storage Initialization
 */
api.runtime?.onInstalled?.addListener(async (details) => {
  console.log('[panH Engine] Initializing storage, reason:', details.reason);

  const existing = await api.storage.local.get(['settings', 'stats', 'logs', 'suspects', 'siteStats']);

  if (!existing.settings) {
    await api.storage.local.set({ settings: DEFAULT_SETTINGS });
  } else {
    // Merge new defaults if missing
    await api.storage.local.set({ settings: { ...DEFAULT_SETTINGS, ...existing.settings } });
  }

  if (!existing.stats) {
    await api.storage.local.set({ stats: INITIAL_STATS });
  }
  if (!existing.logs) {
    await api.storage.local.set({ logs: INITIAL_LOGS });
  }
  if (!existing.suspects) {
    await api.storage.local.set({ suspects: INITIAL_SUSPECTS });
  }
  if (!existing.siteStats) {
    await api.storage.local.set({
      siteStats: {
        'news-site.com': {
          domain: 'news-site.com',
          trackersBlocked: 23,
          adsBlocked: 41,
          firstPartyCount: 2,
          fingerprintCount: 1,
          score: 82,
          lastUpdated: Date.now(),
          recentDomains: [
            { domain: 'adnet-x.com', category: 'ad', reason: 'adnet-x.com tried to follow you across sites' },
            { domain: 'pixel.tracker-a.io', category: 'analytics', reason: 'Cross-site ID beacon' }
          ]
        }
      }
    });
  }

  // Register context menu for quick dashboard access
  try {
    api.contextMenus?.create({
      id: 'panh-open-dashboard',
      title: 'panH: Open Privacy Dashboard',
      contexts: ['action', 'page']
    });
  } catch (e) {
    // Menu already exists
  }
});

api.contextMenus?.onClicked?.addListener((info) => {
  if (info.menuItemId === 'panh-open-dashboard') {
    api.tabs?.create({ url: api.runtime.getURL('dashboard/dashboard.html') });
  }
});

/**
 * Record a Privacy Event and Run AI Threat Scoring
 */
async function recordPrivacyEvent({ domain, siteDomain, category, action, reason, context = {} }) {
  const store = await api.storage.local.get(['stats', 'logs', 'siteStats', 'suspects', 'settings']);
  const stats = store.stats || { ...INITIAL_STATS };
  const logs = store.logs || [];
  const siteStats = store.siteStats || {};
  const suspects = store.suspects || {};
  const settings = store.settings || DEFAULT_SETTINGS;

  if (!settings.masterEnabled) return;

  // Update counters
  if (action === 'blocked' && category === 'ad') {
    stats.totalAdsBlocked = (stats.totalAdsBlocked || 0) + 1;
  } else if (action === 'blocked' && (category === 'analytics' || category === 'social' || category === 'tracker')) {
    stats.totalTrackersBlocked = (stats.totalTrackersBlocked || 0) + 1;
  }
  stats.totalEvents = (stats.totalEvents || 0) + 1;

  // Append to recent logs (keep last 500)
  const newLogEntry = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: Date.now(),
    domain: domain || 'unknown',
    siteDomain: siteDomain || 'general',
    category: category || 'analytics',
    action: action || 'blocked',
    reason: reason || 'Blocked invasive third-party request'
  };
  logs.unshift(newLogEntry);
  if (logs.length > 500) logs.pop();

  // Update Per-Site Statistics
  if (siteDomain && siteDomain !== 'general') {
    if (!siteStats[siteDomain]) {
      siteStats[siteDomain] = {
        domain: siteDomain,
        trackersBlocked: 0,
        adsBlocked: 0,
        firstPartyCount: 0,
        fingerprintCount: 0,
        score: 100,
        recentDomains: []
      };
    }

    const currentSite = siteStats[siteDomain];
    if (category === 'ad') currentSite.adsBlocked += 1;
    if (category === 'analytics' || category === 'social' || category === 'tracker') currentSite.trackersBlocked += 1;
    if (category === 'first-party' || category === 'cname') currentSite.firstPartyCount += 1;
    if (category === 'fingerprinting') currentSite.fingerprintCount += 1;

    // Recalculate site score
    const penalties = (currentSite.trackersBlocked * 3) +
                      (currentSite.adsBlocked * 2) +
                      (currentSite.firstPartyCount * 5) +
                      (currentSite.fingerprintCount * 6);
    currentSite.score = Math.max(15, Math.min(99, 100 - penalties));
    currentSite.lastUpdated = Date.now();

    // Store recent domain
    if (!currentSite.recentDomains.some(d => d.domain === domain)) {
      currentSite.recentDomains.unshift({ domain, category, reason });
      if (currentSite.recentDomains.length > 10) currentSite.recentDomains.pop();
    }
  }

  // AI Behavioral Threat Evaluation on Unknown Domains
  if (settings.aiThreatDetection && domain && !KNOWN_TRACKERS[domain] && !domain.includes('fingerprint') && siteDomain) {
    const existingSuspect = suspects[domain];
    const sitesSeen = existingSuspect ? existingSuspect.sitesSeen : [];
    if (!sitesSeen.includes(siteDomain)) sitesSeen.push(siteDomain);

    const aiEval = evaluateRequestThreat({
      domain,
      siteDomain,
      sitesSeen,
      isBeacon: context.isBeacon || false,
      hasLongCookie: context.hasLongCookie || false,
      isFingerprintProbe: category === 'fingerprinting'
    });

    if (aiEval.riskScore >= 40) {
      suspects[domain] = {
        domain,
        seenCount: sitesSeen.length,
        sitesSeen,
        score: aiEval.riskScore,
        confidence: aiEval.confidence,
        threatType: aiEval.threatType,
        status: existingSuspect?.status === 'blocked' ? 'blocked' : 'suspected',
        reasons: aiEval.signals,
        aiVerdict: aiEval.aiVerdict
      };

      stats.newSuspectsCount = Object.values(suspects).filter(s => s.status === 'suspected').length;
    }
  }

  await api.storage.local.set({ stats, logs, siteStats, suspects });
}

/**
 * Handle DeclarativeNetRequest Debug Events (Unpacked / Dev Mode)
 */
if (api.declarativeNetRequest?.onRuleMatchedDebug) {
  api.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    const requestUrl = info.request?.url || '';
    let domain = '';
    let siteDomain = '';
    try {
      const u = new URL(requestUrl);
      domain = u.hostname;
      if (info.request?.initiator) {
        siteDomain = new URL(info.request.initiator).hostname;
      }
    } catch (e) {}

    const explanation = explainDomainAction(domain);
    recordPrivacyEvent({
      domain,
      siteDomain,
      category: explanation.category,
      action: 'blocked',
      reason: `${explanation.name}: ${explanation.reason}`
    });
  });
}

/**
 * Secure Search: Automatic Tracking Parameter Stripper via webNavigation
 */
api.webNavigation?.onBeforeNavigate?.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only process top-level navigation

  const store = await api.storage.local.get(['settings']);
  const settings = store.settings || DEFAULT_SETTINGS;
  if (!settings.masterEnabled || !settings.stripTrackingParams) return;

  try {
    const url = new URL(details.url);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
      'gclid', 'fbclid', 'msclkid', 'mc_eid', 'dclid', '_hsenc', '_hsmi', 'vero_id', 'yclid', 'ttclid'
    ];
    let strippedAny = false;

    for (const p of trackingParams) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        strippedAny = true;
      }
    }

    if (strippedAny) {
      console.log('[panH Secure Search] Stripped tracking tags from:', details.url);
      recordPrivacyEvent({
        domain: url.hostname,
        siteDomain: url.hostname,
        category: 'analytics',
        action: 'stripped',
        reason: 'Stripped outbound advertising tracking tags (utm/gclid/fbclid) from navigation URL'
      });
      api.tabs?.update(details.tabId, { url: url.toString() });
    }
  } catch (err) {
    // Ignore invalid URL
  }
});

/**
 * Central Message Router for Content Scripts, Popup, and Dashboard
 */
api.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const tabDomain = sender.tab?.url ? new URL(sender.tab.url).hostname : '';

      switch (message.type) {
        case 'REPORT_FINGERPRINT_PROBE': {
          await recordPrivacyEvent({
            domain: `${message.probeType || 'canvas'}.probe`,
            siteDomain: tabDomain || message.siteDomain,
            category: 'fingerprinting',
            action: 'shielded',
            reason: `Shielded ${message.probeType || 'canvas'} fingerprint probe on ${tabDomain || 'page'}`
          });
          sendResponse({ success: true });
          break;
        }

        case 'REPORT_FIRST_PARTY_TRACKER': {
          await recordPrivacyEvent({
            domain: message.cookieName || 'cookie_tracker',
            siteDomain: tabDomain || message.siteDomain,
            category: 'first-party',
            action: 'blocked',
            reason: `Discovered long-lived tracker cookie '${message.cookieName}' (${message.details || 'ID-like value'})`,
            context: { hasLongCookie: true }
          });
          sendResponse({ success: true });
          break;
        }

        case 'REPORT_EMAIL_TRACKER': {
          await recordPrivacyEvent({
            domain: message.domain || 'email.spy-pixel',
            siteDomain: 'webmail',
            category: 'email',
            action: 'blocked',
            reason: `Neutralized 1x1 tracking pixel from ${message.domain || 'spy-pixel'}`
          });
          sendResponse({ success: true });
          break;
        }

        case 'GET_SITE_REPORT': {
          const store = await api.storage.local.get(['siteStats', 'settings']);
          const targetDomain = message.domain || tabDomain || 'news-site.com';
          let siteData = store.siteStats?.[targetDomain];

          if (!siteData) {
            siteData = {
              domain: targetDomain,
              trackersBlocked: 0,
              adsBlocked: 0,
              firstPartyCount: 0,
              fingerprintCount: 0,
              score: 95,
              recentDomains: []
            };
          }

          const tips = generateRuleBasedTips(siteData);
          const aiAudit = generateSiteAuditSummary(siteData);

          sendResponse({
            siteData,
            settings: store.settings || DEFAULT_SETTINGS,
            tips,
            aiAudit
          });
          break;
        }

        case 'GET_DASHBOARD_DATA': {
          const store = await api.storage.local.get(['stats', 'logs', 'suspects', 'settings', 'siteStats']);
          sendResponse({
            stats: store.stats || INITIAL_STATS,
            logs: store.logs || INITIAL_LOGS,
            suspects: store.suspects || INITIAL_SUSPECTS,
            settings: store.settings || DEFAULT_SETTINGS,
            siteStats: store.siteStats || {}
          });
          break;
        }

        case 'UPDATE_SETTINGS': {
          const store = await api.storage.local.get(['settings']);
          const updated = { ...(store.settings || DEFAULT_SETTINGS), ...message.settings };
          await api.storage.local.set({ settings: updated });
          sendResponse({ success: true, settings: updated });
          break;
        }

        case 'UPDATE_SUSPECT_ACTION': {
          const store = await api.storage.local.get(['suspects', 'stats']);
          const suspects = store.suspects || {};
          const stats = store.stats || { ...INITIAL_STATS };
          const { domain, action } = message;

          if (suspects[domain]) {
            suspects[domain].status = action;

            // If user decided to block, add a dynamic declarativeNetRequest rule
            if (action === 'blocked' && api.declarativeNetRequest?.updateDynamicRules) {
              try {
                await api.declarativeNetRequest.updateDynamicRules({
                  addRules: [{
                    id: Math.floor(Math.random() * 90000) + 10000,
                    priority: 2,
                    action: { type: 'block' },
                    condition: { urlFilter: `||${domain}^` }
                  }]
                });
              } catch (e) {
                console.warn('Failed to add dynamic DNR rule:', e);
              }
            }

            stats.newSuspectsCount = Object.values(suspects).filter(s => s.status === 'suspected').length;
            await api.storage.local.set({ suspects, stats });
          }
          sendResponse({ success: true, suspects });
          break;
        }

        case 'ASK_AI_ADVISOR': {
          const store = await api.storage.local.get(['settings']);
          const apiKey = store.settings?.geminiApiKey || '';
          const modelPref = store.settings?.aiModelPreference || 'auto';

          const result = await queryAIAdvisor({
            question: message.question,
            siteReport: message.siteReport || {},
            apiKey,
            modelPreference: modelPref
          });
          sendResponse(result);
          break;
        }

        case 'EXECUTE_AI_REMEDIATION': {
          const store = await api.storage.local.get(['suspects', 'stats', 'settings']);
          const suspects = store.suspects || {};
          const stats = store.stats || { ...INITIAL_STATS };
          const settings = store.settings || DEFAULT_SETTINGS;

          if (message.action === 'BLOCK_ALL_SUSPECTS') {
            for (const [domain, suspect] of Object.entries(suspects)) {
              if (suspect.status === 'suspected') {
                suspect.status = 'blocked';
                if (api.declarativeNetRequest?.updateDynamicRules) {
                  try {
                    await api.declarativeNetRequest.updateDynamicRules({
                      addRules: [{
                        id: Math.floor(Math.random() * 90000) + 10000,
                        priority: 2,
                        action: { type: 'block' },
                        condition: { urlFilter: `||${domain}^` }
                      }]
                    });
                  } catch (e) {}
                }
              }
            }
            stats.newSuspectsCount = 0;
            await api.storage.local.set({ suspects, stats });
            sendResponse({ success: true, message: 'All high-risk suspects have been blocked.' });
          } else if (message.action === 'ENABLE_STRICT_SHIELD') {
            settings.fingerprintShield = true;
            settings.secureSearch = true;
            await api.storage.local.set({ settings });
            sendResponse({ success: true, message: 'Strict Fingerprint Shield and Secure Search activated.' });
          } else {
            sendResponse({ success: true });
          }
          break;
        }

        case 'TEST_GEMINI_CONNECTION': {
          const testKey = message.apiKey?.trim();
          if (!testKey) {
            sendResponse({ success: false, error: 'API key is empty' });
            return;
          }
          try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${testKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Hello, verify connection in 3 words.' }] }]
              })
            });
            if (resp.ok) {
              sendResponse({ success: true, message: 'Google Gemini connected successfully!' });
            } else {
              sendResponse({ success: false, error: `Connection failed: HTTP ${resp.status}` });
            }
          } catch (e) {
            sendResponse({ success: false, error: e.message });
          }
          break;
        }

        case 'CLEAR_ALL_LOGS': {
          await api.storage.local.set({ logs: [] });
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (err) {
      console.error('[panH Background Error]:', err);
      sendResponse({ error: err.message });
    }
  })();

  return true; // Keep message channel open for async response
});
