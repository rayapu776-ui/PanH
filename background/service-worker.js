/**
 * panH - Privacy & Anonymity Network Hub
 * Background Service Worker: Core Privacy Engine & Threat Guardian
 * Implements Blueprint v1.0 (04 November 2026)
 */

import { explainDomainAction, KNOWN_TRACKERS } from './tracker-db.js';
import { evaluateRequestThreat } from './ai-classifier.js';
import { generateSiteAuditSummary, generateRuleBasedTips, queryAIAdvisor } from './ai-engine.js';
import { assessUrl, normalizeUrl } from './threat-engine.js';

// Cross-browser API bridge
const api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

const DEFAULT_SETTINGS = {
  masterEnabled: true,
  adsBlocker: true,
  trackerBlocker: true,
  fingerprintShield: true,
  secureSearch: true,
  searchBadges: true,
  emailPrivacy: true,
  cosmeticFilter: true,
  searchEngine: 'duckduckgo',
  stripTrackingParams: true,
  stripReferrer: true,
  aiThreatDetection: true,
  aiModelPreference: 'auto', // 'auto' | 'local_only' | 'gemini' | 'server'
  geminiApiKey: '',
  serverUrl: 'http://localhost:3000',
  whitelistedDomains: [],
  customBlockedDomains: []
};

// Clean zero baseline telemetry (no demo/mock numbers)
const INITIAL_STATS = {
  totalTrackersBlocked: 0,
  totalAdsBlocked: 0,
  newSuspectsCount: 0,
  totalEvents: 0,
  timeframe: {
    today: { ads: 0, trackers: 0 },
    week: { ads: 0, trackers: 0 }
  }
};

const INITIAL_LOGS = [];
const INITIAL_SUSPECTS = {};

// In-memory session overrides to prevent warning infinite redirect loops (Section 4.5 & 4.6)
const sessionOverrides = new Set();

/**
 * Extension Installation & Storage Initialization
 */
api.runtime?.onInstalled?.addListener(async (details) => {
  console.log('[panH Engine] Initializing storage, reason:', details.reason);

  const existing = await api.storage.local.get(['settings', 'stats', 'logs', 'suspects', 'siteStats']);

  if (!existing.settings) {
    await api.storage.local.set({ settings: DEFAULT_SETTINGS });
  } else {
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
    await api.storage.local.set({ siteStats: {} });
  }

  try {
    api.contextMenus?.create({
      id: 'panh-open-dashboard',
      title: 'panH: Open Privacy Dashboard',
      contexts: ['action', 'page']
    });
  } catch (e) {}
});

api.contextMenus?.onClicked?.addListener((info) => {
  if (info.menuItemId === 'panh-open-dashboard') {
    api.tabs?.create({ url: api.runtime.getURL('dashboard/dashboard.html') });
  }
});

/**
 * Record a Privacy Event and Update Telemetry
 */
async function recordPrivacyEvent({ domain, siteDomain, category, action, reason, context = {} }) {
  const store = await api.storage.local.get(['stats', 'logs', 'siteStats', 'suspects', 'settings']);
  const stats = store.stats || { ...INITIAL_STATS };
  const logs = store.logs || [];
  const siteStats = store.siteStats || {};
  const suspects = store.suspects || {};
  const settings = store.settings || DEFAULT_SETTINGS;

  if (!settings.masterEnabled) return;

  // Check if site is in allow-list (Section 2.2)
  if (siteDomain && settings.whitelistedDomains?.includes(siteDomain)) {
    return; // Excluded from blocking
  }

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
        suspiciousCount: 0,
        score: 100,
        recentDomains: []
      };
    }

    const currentSite = siteStats[siteDomain];
    if (category === 'ad') currentSite.adsBlocked += 1;
    if (category === 'analytics' || category === 'social' || category === 'tracker') currentSite.trackersBlocked += 1;
    if (category === 'first-party' || category === 'cname') currentSite.firstPartyCount += 1;
    if (category === 'fingerprinting') currentSite.fingerprintCount += 1;
    if (action === 'suspected') currentSite.suspiciousCount = (currentSite.suspiciousCount || 0) + 1;

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
 * Threat Guardian Navigation Interceptor & Tracking Stripper
 * Implements Section 2.3, 2.5, 4.4, 4.5
 */
api.webNavigation?.onBeforeNavigate?.addListener(async (details) => {
  if (details.frameId !== 0) return; // Top-level navigation only
  const navUrl = details.url;
  if (!navUrl || navUrl.startsWith('chrome:') || navUrl.startsWith('about:') || navUrl.startsWith('edge:') || navUrl.includes(api.runtime.id)) {
    return;
  }

  const store = await api.storage.local.get(['settings']);
  const settings = store.settings || DEFAULT_SETTINGS;
  if (!settings.masterEnabled) return;

  let norm = null;
  try {
    norm = new URL(navUrl);
  } catch (e) {
    return;
  }

  const hostname = norm.hostname;

  // 1. Check Threat Guardian & Interstitial Warnings (Section 2.3 & 4.5)
  if (settings.aiThreatDetection && !sessionOverrides.has(hostname)) {
    const allowList = settings.whitelistedDomains || [];
    const blockList = settings.customBlockedDomains || [];
    const threatAssessment = assessUrl(navUrl, allowList, blockList);

    if (threatAssessment.risk_level === 'high' || threatAssessment.verdict === 'malicious') {
      console.warn('[panH Threat Guardian] Intercepting dangerous navigation:', navUrl, threatAssessment);
      const interstitialUrl = api.runtime.getURL(
        `interstitial/warning.html?url=${encodeURIComponent(navUrl)}&risk=high&confidence=${threatAssessment.confidence}&reasons=${encodeURIComponent(JSON.stringify(threatAssessment.reasons))}`
      );
      api.tabs?.update(details.tabId, { url: interstitialUrl });
      return;
    }
  }

  // 2. Secure Search: Tracking Parameter Stripper (Section 2.5)
  if (settings.stripTrackingParams) {
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
      'gclid', 'fbclid', 'msclkid', 'mc_eid', 'dclid', '_hsenc', '_hsmi', 'vero_id', 'yclid', 'ttclid'
    ];
    let strippedAny = false;

    for (const p of trackingParams) {
      if (norm.searchParams.has(p)) {
        norm.searchParams.delete(p);
        strippedAny = true;
      }
    }

    if (strippedAny) {
      recordPrivacyEvent({
        domain: hostname,
        siteDomain: hostname,
        category: 'analytics',
        action: 'stripped',
        reason: 'Stripped outbound advertising tracking tags (utm/gclid/fbclid) from navigation URL'
      });
      api.tabs?.update(details.tabId, { url: norm.toString() });
    }
  }
});

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
 * Central Message Router for Content Scripts, Popup, Dashboard, and Link Scanner
 */
api.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const tabDomain = sender.tab?.url ? new URL(sender.tab.url).hostname : '';

      switch (message.type) {
        case 'ASSESS_URL': {
          const store = await api.storage.local.get(['settings']);
          const settings = store.settings || DEFAULT_SETTINGS;
          const assessment = assessUrl(
            message.url,
            settings.whitelistedDomains || [],
            settings.customBlockedDomains || []
          );
          sendResponse(assessment);
          break;
        }

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
              suspiciousCount: 0,
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

        case 'ADD_SITE_ALLOWLIST': {
          const store = await api.storage.local.get(['settings']);
          const settings = store.settings || DEFAULT_SETTINGS;
          const currentList = settings.whitelistedDomains || [];
          if (!currentList.includes(message.domain)) {
            currentList.push(message.domain);
            settings.whitelistedDomains = currentList;
            await api.storage.local.set({ settings });
          }
          sendResponse({ success: true, whitelistedDomains: currentList });
          break;
        }

        case 'REMOVE_SITE_ALLOWLIST': {
          const store = await api.storage.local.get(['settings']);
          const settings = store.settings || DEFAULT_SETTINGS;
          settings.whitelistedDomains = (settings.whitelistedDomains || []).filter(d => d !== message.domain);
          await api.storage.local.set({ settings });
          sendResponse({ success: true, whitelistedDomains: settings.whitelistedDomains });
          break;
        }

        case 'ADD_SITE_BLOCKLIST': {
          const store = await api.storage.local.get(['settings']);
          const settings = store.settings || DEFAULT_SETTINGS;
          const currentList = settings.customBlockedDomains || [];
          if (!currentList.includes(message.domain)) {
            currentList.push(message.domain);
            settings.customBlockedDomains = currentList;
            await api.storage.local.set({ settings });

            // Add dynamic DNR rule
            if (api.declarativeNetRequest?.updateDynamicRules) {
              try {
                await api.declarativeNetRequest.updateDynamicRules({
                  addRules: [{
                    id: Math.floor(Math.random() * 90000) + 10000,
                    priority: 2,
                    action: { type: 'block' },
                    condition: { urlFilter: `||${message.domain}^` }
                  }]
                });
              } catch (e) {}
            }
          }
          sendResponse({ success: true, customBlockedDomains: currentList });
          break;
        }

        case 'REMOVE_SITE_BLOCKLIST': {
          const store = await api.storage.local.get(['settings']);
          const settings = store.settings || DEFAULT_SETTINGS;
          settings.customBlockedDomains = (settings.customBlockedDomains || []).filter(d => d !== message.domain);
          await api.storage.local.set({ settings });
          sendResponse({ success: true, customBlockedDomains: settings.customBlockedDomains });
          break;
        }

        case 'ALLOW_SESSION_OVERRIDE': {
          if (message.domain) {
            sessionOverrides.add(message.domain);
          }
          sendResponse({ success: true });
          break;
        }

        case 'RESET_SESSION_OVERRIDES': {
          sessionOverrides.clear();
          sendResponse({ success: true });
          break;
        }

        case 'REPORT_BROKEN_PAGE': {
          console.log('[panH Feedback] Broken page reported for:', message.domain);
          sendResponse({ success: true });
          break;
        }

        case 'UPDATE_SUSPECT_ACTION': {
          const store = await api.storage.local.get(['suspects', 'stats']);
          const suspects = store.suspects || {};
          const stats = store.stats || { ...INITIAL_STATS };
          const { domain, action } = message;

          if (suspects[domain]) {
            suspects[domain].status = action;

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
          const serverUrl = store.settings?.serverUrl || 'http://localhost:3000';

          const result = await queryAIAdvisor({
            question: message.question,
            siteReport: message.siteReport || {},
            apiKey,
            modelPreference: modelPref,
            serverUrl
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
            settings.aiThreatDetection = true;
            await api.storage.local.set({ settings });
            sendResponse({ success: true, message: 'Strict Fingerprint Shield and Threat Guardian activated.' });
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

  return true;
});
