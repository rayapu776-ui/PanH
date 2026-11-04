/**
 * panH AI Edition - Fullstack Backend Gateway & Intelligence Service
 * Version: 1.0.0
 * 
 * Provides:
 * 1. AI Privacy & Security Advisor API with SQLite Audit (POST /api/v1/ai/advise, GET /api/v1/ai/history)
 * 2. Persistent SQLite Threat Database & Heuristic Scanner (POST /api/v1/threats/analyze, GET /api/v1/threats)
 * 3. Threat Submissions & Registry (POST /api/v1/threats/submit)
 * 4. Interception Event Telemetry Store (POST /api/v1/events, GET /api/v1/events/stats)
 * 5. Site Rules Allow/Block Exceptions (GET / POST / DELETE /api/v1/rules/sites)
 * 6. Ruleset Synchronization (GET /api/v1/rules)
 * 7. System Health & Database Diagnostics (GET /api/v1/health, GET /api/v1/db/diagnostics)
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  initDatabase,
  getThreatByDomain,
  upsertThreat,
  listThreats,
  logAIAdvice,
  getRecentAIAdvice,
  recordEvent,
  getEventStats,
  addSiteRule,
  removeSiteRule,
  getSiteRules,
  getDatabaseDiagnostics
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if present
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
      console.log('[panH Server] Loaded environment variables from server/.env');
    } catch (e) {
      console.warn('[panH Server] Could not read .env file:', e.message);
    }
  }
}
loadEnv();

// Initialize Persistent SQLite Database
initDatabase();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// CORS headers helper
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
}

// JSON responder helper
function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

// Request body parser helper
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Call External LLM (Gemini / OpenAI) for user privacy advice
 */
async function callExternalLLM({ question, siteDomain, privacyScore, trackersBlocked, adsBlocked, fingerprintCount, apiKey, provider }) {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;
  const openaiKey = apiKey || process.env.OPENAI_API_KEY;

  const targetDomain = siteDomain || 'this website';
  const score = privacyScore !== undefined ? privacyScore : 100;
  const trackers = trackersBlocked || 0;
  const ads = adsBlocked || 0;
  const fpCount = fingerprintCount || 0;

  // 1. Google Gemini Provider
  if (provider === 'gemini' || (!provider && geminiKey)) {
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server or in request');
    }

    const systemPrompt = `You are panH AI Privacy Advisor, a digital privacy and cybersecurity expert built into the panH privacy platform.
You analyze privacy telemetry, tracking vectors, and explain threats in plain, helpful language.
RULES:
1. Keep your answer concise (under 130 words), practical, and actionable.
2. Tell the user what the risk is and exactly what action they should take.
3. Strict privacy rule: NEVER ask for or reference private personal user data.`;

    const userPrompt = `Telemetry Context for ${targetDomain}:
- Privacy Score: ${score}/100
- Trackers Intercepted: ${trackers}
- Advertisements Blocked: ${ads}
- Fingerprint Probes Defeated: ${fpCount}

User's Question: "${question || `What is the privacy status of ${targetDomain} and what should I do?`}"

Provide a clear, authoritative explanation and recommended advice.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 250 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const adviceText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!adviceText) throw new Error('No response text generated by Gemini');

    return {
      advice: adviceText.trim(),
      provider: 'Google Gemini 1.5 Flash',
      confidence: 0.95,
      timestamp: new Date().toISOString()
    };
  }

  // 2. OpenAI Provider
  if (provider === 'openai' || (!provider && openaiKey)) {
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey.trim()}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are panH AI Privacy Advisor. Give concise, actionable cybersecurity guidance (under 120 words).' },
          { role: 'user', content: `Site: ${targetDomain}, Score: ${score}/100, Trackers: ${trackers}, Ads: ${ads}. Question: ${question}` }
        ],
        max_tokens: 250,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const adviceText = data.choices?.[0]?.message?.content;
    return {
      advice: adviceText.trim(),
      provider: 'OpenAI ' + (process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      confidence: 0.95,
      timestamp: new Date().toISOString()
    };
  }

  throw new Error('No AI API key configured. Provide an apiKey in request or set GEMINI_API_KEY / OPENAI_API_KEY in server/.env');
}

/**
 * Real Heuristic URL Threat Classifier backed by SQLite Database
 */
function evaluateUrlSecurity(rawUrl) {
  let hostname = '';
  let pathname = '';
  let search = '';

  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl);
    hostname = parsed.hostname.toLowerCase();
    pathname = parsed.pathname.toLowerCase();
    search = parsed.search.toLowerCase();
  } catch (e) {
    hostname = rawUrl.toLowerCase().split('/')[0];
  }

  // 1. Check SQLite Persistent Threat Database first
  const dbThreat = getThreatByDomain(hostname);
  if (dbThreat) {
    return {
      url: rawUrl,
      canonical_url: `https://${hostname}/`,
      verdict: dbThreat.verdict,
      risk_level: dbThreat.risk_level,
      confidence: dbThreat.confidence,
      threat_category: dbThreat.threat_category,
      reasons: dbThreat.reasons,
      recommended_action: 'BLOCK_AND_WARN',
      source: 'panH SQLite Threat Database',
      source_updated_at: dbThreat.updated_at
    };
  }

  const reasons = [];
  let riskScore = 0;

  // 1. High-risk TLDs
  const suspiciousTLDs = ['.xyz', '.top', '.buzz', '.work', '.click', '.fit', '.gq', '.cf', '.tk', '.ml'];
  for (const tld of suspiciousTLDs) {
    if (hostname.endsWith(tld)) {
      riskScore += 25;
      reasons.push(`Domain uses high-abuse top-level domain (${tld})`);
      break;
    }
  }

  // 2. Phishing keyword patterns
  const phishingKeywords = ['login', 'verify', 'account', 'banking', 'secure', 'update-password', 'wallet', 'crypto', 'support-apple', 'paypal-security'];
  for (const kw of phishingKeywords) {
    if (hostname.includes(kw) || pathname.includes(kw)) {
      riskScore += 35;
      reasons.push(`Target contains sensitive credential lure keyword: "${kw}"`);
      break;
    }
  }

  // 3. Brand impersonation / homoglyphs
  const targetBrands = ['paypal', 'netflix', 'amazon', 'google', 'microsoft', 'apple', 'chase', 'wellsfargo', 'coinbase', 'binance'];
  for (const brand of targetBrands) {
    if (hostname.includes(brand) && !hostname.endsWith(`.${brand}.com`) && hostname !== `${brand}.com`) {
      riskScore += 45;
      reasons.push(`High-probability brand impersonation targeting "${brand}"`);
      break;
    }
  }

  // 4. IP Address host navigation
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    riskScore += 40;
    reasons.push('Raw numeric IP address used instead of authenticated domain name');
  }

  // 5. Excessive subdomains
  const parts = hostname.split('.');
  if (parts.length > 4) {
    riskScore += 20;
    reasons.push(`Excessive subdomain nesting depth (${parts.length} levels)`);
  }

  let verdict = 'benign';
  let risk_level = 'minimal';
  let recommended_action = 'ALLOW';
  let confidence = 0.90;

  if (riskScore >= 60) {
    verdict = 'malicious';
    risk_level = 'critical';
    recommended_action = 'BLOCK_AND_WARN';
    confidence = Math.min(0.99, 0.75 + (riskScore / 200));
  } else if (riskScore >= 25) {
    verdict = 'suspicious';
    risk_level = 'medium';
    recommended_action = 'SHOW_ADVISORY';
    confidence = 0.80;
  } else {
    reasons.push('Clean domain structure with standard root naming convention');
    reasons.push('No known malicious signatures or credential harvest scripts flagged');
  }

  return {
    url: rawUrl,
    canonical_url: `https://${hostname}/`,
    verdict,
    risk_level,
    confidence: Number(confidence.toFixed(2)),
    threat_category: verdict === 'malicious' ? 'phishing' : 'none',
    reasons,
    recommended_action,
    source: 'panH Heuristic Threat Engine',
    source_updated_at: new Date().toISOString()
  };
}

// HTTP Server instance
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  try {
    // 1. Healthcheck / System Status & Database Diagnostics
    if (pathname === '/api/v1/health' && method === 'GET') {
      const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
      const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10);
      const dbDiag = getDatabaseDiagnostics();

      sendJson(res, 200, {
        status: 'online',
        service: 'panH AI Edition Fullstack Gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
        ai_providers: {
          gemini_configured: hasGemini,
          openai_configured: hasOpenAI,
          active_provider: hasGemini ? 'Google Gemini' : (hasOpenAI ? 'OpenAI' : 'Local Heuristic Engine')
        },
        database: dbDiag
      });
      return;
    }

    // 2. Database Diagnostics Detailed (GET /api/v1/db/diagnostics)
    if (pathname === '/api/v1/db/diagnostics' && method === 'GET') {
      sendJson(res, 200, getDatabaseDiagnostics());
      return;
    }

    // 3. AI Advisor Endpoint (POST /api/v1/ai/advise)
    if (pathname === '/api/v1/ai/advise' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { question, siteDomain, privacyScore, trackersBlocked, adsBlocked, fingerprintCount, apiKey, provider } = body;
      const targetDomain = siteDomain || 'this website';

      try {
        // Attempt external LLM if key is present on server or in request
        const result = await callExternalLLM({
          question,
          siteDomain: targetDomain,
          privacyScore,
          trackersBlocked,
          adsBlocked,
          fingerprintCount,
          apiKey,
          provider
        });

        // Log advice to SQLite audit table
        logAIAdvice({
          siteDomain: targetDomain,
          userQuestion: question || 'Site audit request',
          adviceText: result.advice,
          provider: result.provider,
          confidence: result.confidence
        });

        sendJson(res, 200, {
          success: true,
          ...result
        });
      } catch (aiErr) {
        // Clear fallback with actionable explanation
        const trackers = trackersBlocked || 0;
        const ads = adsBlocked || 0;
        const fpCount = fingerprintCount || 0;

        const fallbackAdvice = `[panH Security Advisor for ${targetDomain}] Shields intercepted ${trackers} tracking scripts and ${ads} ads on this session. ${fpCount > 0 ? `Neutralized ${fpCount} hardware fingerprint attempts.` : 'No fingerprint probes succeeded.'}\n\nTo enable live generative LLM advice, add your GEMINI_API_KEY or OPENAI_API_KEY in server/.env or in the panH Settings tab.`;

        // Log fallback advice to SQLite audit table
        logAIAdvice({
          siteDomain: targetDomain,
          userQuestion: question || 'Site audit request',
          adviceText: fallbackAdvice,
          provider: 'panH Local Security Engine',
          confidence: 0.90
        });

        sendJson(res, 200, {
          success: true,
          advice: fallbackAdvice,
          provider: 'panH Local Security Engine (Ready for AI API Key)',
          confidence: 0.90,
          keyRequired: true,
          notice: aiErr.message,
          timestamp: new Date().toISOString()
        });
      }
      return;
    }

    // 4. AI Advice Audit History (GET /api/v1/ai/history)
    if (pathname === '/api/v1/ai/history' && method === 'GET') {
      const limit = parseInt(parsedUrl.searchParams.get('limit') || '20', 10);
      const history = getRecentAIAdvice(limit);
      sendJson(res, 200, {
        total: history.length,
        history
      });
      return;
    }

    // 5. Threat Assessment Endpoint (POST /api/v1/threats/analyze)
    if (pathname === '/api/v1/threats/analyze' && method === 'POST') {
      const body = await parseJsonBody(req);
      const urlToAssess = body.url;
      if (!urlToAssess) {
        sendJson(res, 400, { error: 'Missing "url" in request payload' });
        return;
      }

      const assessment = evaluateUrlSecurity(urlToAssess);
      sendJson(res, 200, assessment);
      return;
    }

    // 6. Threat Submissions to SQLite (POST /api/v1/threats/submit)
    if (pathname === '/api/v1/threats/submit' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { domain, threat_type, reason, confidence, risk_level } = body;

      if (!domain) {
        sendJson(res, 400, { error: 'Missing "domain" field' });
        return;
      }

      const savedThreat = upsertThreat({
        domain,
        verdict: threat_type === 'phishing' || threat_type === 'malware' ? 'malicious' : 'suspicious',
        risk_level: risk_level || 'high',
        confidence: confidence || 0.95,
        threat_category: threat_type || 'phishing',
        reasons: reason ? [reason] : ['Reported threat domain via API'],
        reported_by: 'api_submission'
      });

      sendJson(res, 201, {
        message: `Threat for "${savedThreat.domain}" successfully committed to SQLite database`,
        threat: savedThreat
      });
      return;
    }

    // 7. List Threat Registry from SQLite (GET /api/v1/threats)
    if (pathname === '/api/v1/threats' && method === 'GET') {
      const limit = parseInt(parsedUrl.searchParams.get('limit') || '50', 10);
      const offset = parseInt(parsedUrl.searchParams.get('offset') || '0', 10);
      const threatsData = listThreats(limit, offset);
      sendJson(res, 200, threatsData);
      return;
    }

    // 8. Event Telemetry Store (POST /api/v1/events)
    if (pathname === '/api/v1/events' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { domain, siteDomain, category, action, reason } = body;

      if (!domain || !category || !action) {
        sendJson(res, 400, { error: 'Fields "domain", "category", and "action" are required' });
        return;
      }

      recordEvent({ domain, siteDomain, category, action, reason });
      sendJson(res, 201, { message: 'Event logged in SQLite database' });
      return;
    }

    // 9. Event Telemetry Aggregations (GET /api/v1/events/stats)
    if (pathname === '/api/v1/events/stats' && method === 'GET') {
      const stats = getEventStats();
      sendJson(res, 200, stats);
      return;
    }

    // 10. Site Rules (GET / POST / DELETE /api/v1/rules/sites)
    if (pathname === '/api/v1/rules/sites') {
      if (method === 'GET') {
        sendJson(res, 200, getSiteRules());
        return;
      }
      if (method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.domain) {
          sendJson(res, 400, { error: 'Missing "domain" field' });
          return;
        }
        const updated = addSiteRule(body.domain, body.rule_type || 'allow', body.notes || '');
        sendJson(res, 201, updated);
        return;
      }
      if (method === 'DELETE') {
        const body = await parseJsonBody(req);
        if (!body.domain) {
          sendJson(res, 400, { error: 'Missing "domain" field' });
          return;
        }
        const updated = removeSiteRule(body.domain);
        sendJson(res, 200, updated);
        return;
      }
    }

    // 11. Ruleset Synchronization (GET /api/v1/rules)
    if (pathname === '/api/v1/rules' && method === 'GET') {
      const dbDiag = getDatabaseDiagnostics();
      sendJson(res, 200, {
        version: '1.0.0',
        updated_at: new Date().toISOString(),
        active_rulesets: ['rules_ads.json', 'rules_trackers.json', 'rules_search.json'],
        sqlite_threats_cached: dbDiag.counts.threats
      });
      return;
    }

    // Root Welcome Endpoint
    if (pathname === '/' && method === 'GET') {
      const dbDiag = getDatabaseDiagnostics();
      sendJson(res, 200, {
        platform: 'panH AI Edition - Fullstack Security & Privacy Backend',
        version: '1.0.0',
        database: dbDiag,
        endpoints: [
          'GET    /api/v1/health',
          'GET    /api/v1/db/diagnostics',
          'POST   /api/v1/ai/advise',
          'GET    /api/v1/ai/history',
          'POST   /api/v1/threats/analyze',
          'POST   /api/v1/threats/submit',
          'GET    /api/v1/threats',
          'POST   /api/v1/events',
          'GET    /api/v1/events/stats',
          'GET    /api/v1/rules/sites',
          'POST   /api/v1/rules/sites',
          'DELETE /api/v1/rules/sites',
          'GET    /api/v1/rules'
        ]
      });
      return;
    }

    // 404 Not Found
    sendJson(res, 404, { error: `Endpoint ${method} ${pathname} not found` });
  } catch (err) {
    console.error('[panH Server Error]:', err);
    sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 panH AI Edition Fullstack Gateway (with SQLite Database)`);
  console.log(`📡 URL:          http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`💾 Database:     server/data/panh.db (node:sqlite WAL mode)`);
  console.log(`⚙️  Dev Mode:     nodemon (auto-reload on save)`);
  console.log(`🛡️  AI Advisor:   POST /api/v1/ai/advise`);
  console.log(`🔍 Threat Scan:  POST /api/v1/threats/analyze`);
  console.log(`=======================================================`);
});
