/**
 * panH - Privacy & Anonymity Network Hub
 * Background Service Worker: Core Privacy Engine
 */

import { explainDomainAction, KNOWN_TRACKERS } from './tracker-db.js';
import { generateRuleBasedTips, generateAISummary, handleAIAdvisorQuery } from './advisor-ai.js';

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
  geminiApiKey: '',
  whitelistedDomains: []
};

// Seed realistic initial stats & logs matching the project document v0.1 specs
const INITIAL_STATS = {
  totalTrackersBlocked: 1284,
  totalAdsBlocked: 3902,
  newSuspectsCount: 7,
  totalEvents: 5193
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
    status: 'suspected',
    reasons: ['Seen across 18 unrelated domains', 'Sends recurring beacon payloads', 'Sets UUID tracking cookie']
  },
  'collector-edge.io': {
    domain: 'collector-edge.io',
    seenCount: 9,
    sitesSeen: ['media-hub.net', 'buyonline.org'],
    score: 72,
    status: 'suspected',
    reasons: ['High frequency third-party beacons', 'Unregistered analytics endpoint']
  },
  'audience-sync.xyz': {
    domain: 'audience-sync.xyz',
    seenCount: 12,
    sitesSeen: ['deals.com', 'reviewdaily.net'],
    score: 79,
    status: 'suspected',
    reasons: ['Queries localStorage and canvas data', 'Exchanges cross-domain URL tokens']
  }
};

// Initialize Extension Storage
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[panH] Extension installed or updated:', details.reason);
  
  const existing = await chrome.storage.local.get(['settings', 'stats', 'logs', 'suspects', 'siteStats']);
  
  if (!existing.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  if (!existing.stats) {
    await chrome.storage.local.set({ stats: INITIAL_STATS });
  }
  if (!existing.logs) {
    await chrome.storage.local.set({ logs: INITIAL_LOGS });
  }
  if (!existing.suspects) {
    await chrome.storage.local.set({ suspects: INITIAL_SUSPECTS });
  }
  if (!existing.siteStats) {
    // Seed default sample for news-site.com matching design
    await chrome.storage.local.set({
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

  // Create context menus
  try {
    chrome.contextMenus.create({
      id: 'panh-open-dashboard',
      title: 'panH: Open Privacy Dashboard',
      contexts: ['action', 'page']
    });
  } catch (e) {
    // Ignore duplicate menu error
  }
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'panh-open-dashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  }
});

/**
 * Log a privacy event and update real-time statistics
 */
async function recordPrivacyEvent({ domain, siteDomain, category, action, reason, context = {} }) {
  const store = await chrome.storage.local.get(['stats', 'logs', 'siteStats', 'suspects']);
  const stats = store.stats || { ...INITIAL_STATS };
  const logs = store.logs || [];
  const siteStats = store.siteStats || {};
  const suspects = store.suspects || {};

  // Update counters
  if (action === 'blocked' && category === 'ad') {
    stats.totalAdsBlocked = (stats.totalAdsBlocked || 0) + 1;
  } else if (action === 'blocked' && (category === 'analytics' || category === 'social' || category === 'tracker')) {
    stats.totalTrackersBlocked = (stats.totalTrackersBlocked || 0) + 1;
  }
  stats.totalEvents = (stats.totalEvents || 0) + 1;

  // Append to recent live logs (keep last 500)
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

  // Update Site Stats
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
    const penalties = (currentSite.trackersBlocked * 3) + (currentSite.adsBlocked * 2) + (currentSite.firstPartyCount * 5) + (currentSite.fingerprintCount * 6);
    currentSite.score = Math.max(15, Math.min(99, 100 - penalties));
    currentSite.lastUpdated = Date.now();

    // Store recent domain
    if (!currentSite.recentDomains.some(d => d.domain === domain)) {
      currentSite.recentDomains.unshift({ domain, category, reason });
      if (currentSite.recentDomains.length > 10) currentSite.recentDomains.pop();
    }
  }

  // Check for Behavioral Pattern Scoring on unknown domains
  if (domain && !KNOWN_TRACKERS[domain] && !domain.includes('fingerprint') && siteDomain) {
    if (!suspects[domain]) {
      suspects[domain] = {
        domain,
        seenCount: 1,
        sitesSeen: [siteDomain],
        score: 20,
        status: 'evaluating',
        reasons: ['Observed third-party script loading']
      };
    } else {
      const suspect = suspects[domain];
      if (!suspect.sitesSeen.includes(siteDomain)) {
        suspect.sitesSeen.push(siteDomain);
        suspect.seenCount += 1;
        suspect.score += 25; // High cross-site repetition
        suspect.reasons.push(`Seen on unrelated site: ${siteDomain}`);
      }

      if (suspect.seenCount >= 3 && suspect.score >= 50 && suspect.status !== 'blocked') {
        suspect.status = 'suspected';
        stats.newSuspectsCount = Object.values(suspects).filter(s => s.status === 'suspected').length;
      }
    }
  }

  await chrome.storage.local.set({ stats, logs, siteStats, suspects });
}

/**
 * Handle Debug Rule Matching for declarativeNetRequest (Development / Unpacked mode)
 */
if (chrome.declarativeNetRequest?.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
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
 * Secure Search & Tracking Parameter Stripping via webNavigation
 */
chrome.webNavigation?.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only process main frame navigations
  
  const store = await chrome.storage.local.get(['settings']);
  const settings = store.settings || DEFAULT_SETTINGS;
  if (!settings.masterEnabled || !settings.stripTrackingParams) return;

  try {
    const url = new URL(details.url);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'fbclid', 'msclkid', 'mc_eid', 'dclid', '_hsenc', '_hsmi', 'vero_id', 'yclid'];
    let strippedAny = false;

    for (const p of trackingParams) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        strippedAny = true;
      }
    }

    if (strippedAny) {
      console.log('[panH Secure Search] Stripped tracking parameters from:', details.url);
      recordPrivacyEvent({
        domain: url.hostname,
        siteDomain: url.hostname,
        category: 'analytics',
        action: 'stripped',
        reason: `Stripped campaign tracking tags (utm/gclid/fbclid) from navigation URL`
      });
      chrome.tabs.update(details.tabId, { url: url.toString() });
    }
  } catch (err) {
    // Ignore malformed URL
  }
});

/**
 * Central Message Router for Content Scripts, Popup, and Dashboard
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const tabDomain = sender.tab?.url ? new URL(sender.tab.url).hostname : '';

      switch (message.type) {
        case 'REPORT_FINGERPRINT_PROBE': {
          recordPrivacyEvent({
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
          recordPrivacyEvent({
            domain: message.cookieName || 'cookie_tracker',
            siteDomain: tabDomain || message.siteDomain,
            category: 'first-party',
            action: 'blocked',
            reason: `Discovered long-lived tracker cookie '${message.cookieName}' (${message.details || 'ID-like value'})`
          });
          sendResponse({ success: true });
          break;
        }

        case 'REPORT_EMAIL_TRACKER': {
          recordPrivacyEvent({
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
          const store = await chrome.storage.local.get(['siteStats', 'settings']);
          const targetDomain = message.domain || tabDomain || 'news-site.com';
          let siteData = store.siteStats?.[targetDomain];

          if (!siteData) {
            // Default active baseline for unvisited domain
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
          const aiSummary = generateAISummary(siteData);

          sendResponse({
            siteData,
            settings: store.settings || DEFAULT_SETTINGS,
            tips,
            aiSummary
          });
          break;
        }

        case 'GET_DASHBOARD_DATA': {
          const store = await chrome.storage.local.get(['stats', 'logs', 'suspects', 'settings', 'siteStats']);
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
          const store = await chrome.storage.local.get(['settings']);
          const updated = { ...(store.settings || DEFAULT_SETTINGS), ...message.settings };
          await chrome.storage.local.set({ settings: updated });
          sendResponse({ success: true, settings: updated });
          break;
        }

        case 'UPDATE_SUSPECT_ACTION': {
          const store = await chrome.storage.local.get(['suspects', 'stats']);
          const suspects = store.suspects || {};
          const stats = store.stats || { ...INITIAL_STATS };
          const { domain, action } = message;

          if (suspects[domain]) {
            suspects[domain].status = action; // 'blocked' | 'allowed' | 'dismissed'
            
            // If user decided to block, add a dynamic declarativeNetRequest rule
            if (action === 'blocked' && chrome.declarativeNetRequest?.updateDynamicRules) {
              try {
                await chrome.declarativeNetRequest.updateDynamicRules({
                  addRules: [{
                    id: Math.floor(Math.random() * 100000) + 10000,
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
            await chrome.storage.local.set({ suspects, stats });
          }
          sendResponse({ success: true, suspects });
          break;
        }

        case 'ASK_AI_ADVISOR': {
          const store = await chrome.storage.local.get(['settings']);
          const apiKey = store.settings?.geminiApiKey || '';
          const response = await handleAIAdvisorQuery(message.question, message.siteReport || {}, apiKey);
          sendResponse({ answer: response });
          break;
        }

        case 'CLEAR_ALL_LOGS': {
          await chrome.storage.local.set({ logs: [] });
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

  return true; // Keep channel open for async response
});
