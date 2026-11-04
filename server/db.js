/**
 * panH AI Edition - Fullstack SQLite Database Layer
 * Built with native node:sqlite (Node.js 22/24+)
 * 
 * Persistent SQLite Database storing:
 * 1. Threats Registry & Threat Intelligence Cache
 * 2. AI Advice Logs & Explainability Audit Trail
 * 3. Interception Telemetry & Real-Time Event Store
 * 4. User Site Rules (Allow-list & Custom Block-list)
 * 5. System Configuration & Synchronization Metadata
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.PANH_DB_PATH || path.join(DATA_DIR, 'panh.db');

// Initialize SQLite database instance
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode (Write-Ahead Logging) and foreign keys for high concurrency & performance
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  console.warn('[panH Database] PRAGMA config warning:', e.message);
}

/**
 * Initialize Tables, Indexes and Migrations
 */
export function initDatabase() {
  db.exec(`
    -- 1. Threat Registry Table
    CREATE TABLE IF NOT EXISTS threats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      verdict TEXT NOT NULL CHECK(verdict IN ('malicious', 'suspicious', 'benign')),
      risk_level TEXT NOT NULL CHECK(risk_level IN ('critical', 'high', 'medium', 'minimal')),
      confidence REAL NOT NULL DEFAULT 0.90,
      threat_category TEXT NOT NULL DEFAULT 'phishing',
      reasons TEXT NOT NULL DEFAULT '[]',
      reported_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_threats_domain ON threats(domain);
    CREATE INDEX IF NOT EXISTS idx_threats_verdict ON threats(verdict);

    -- 2. AI Advice Audit Table (Log all questions and AI responses)
    CREATE TABLE IF NOT EXISTS ai_advice_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_domain TEXT NOT NULL,
      user_question TEXT NOT NULL,
      advice_text TEXT NOT NULL,
      provider TEXT NOT NULL,
      confidence REAL DEFAULT 0.95,
      tokens_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_advice_site ON ai_advice_logs(site_domain);
    CREATE INDEX IF NOT EXISTS idx_advice_created ON ai_advice_logs(created_at);

    -- 3. Interception Telemetry & Event Store
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL,
      site_domain TEXT,
      category TEXT NOT NULL CHECK(category IN ('ad', 'analytics', 'social', 'fingerprinting', 'email', 'phishing', 'tracker')),
      action TEXT NOT NULL CHECK(action IN ('blocked', 'suspected', 'shielded', 'stripped', 'warned')),
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_events_domain ON events(domain);
    CREATE INDEX IF NOT EXISTS idx_events_site ON events(site_domain);
    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

    -- 4. Site Rules (Allow-list & Custom Block-list)
    CREATE TABLE IF NOT EXISTS site_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      rule_type TEXT NOT NULL CHECK(rule_type IN ('allow', 'block')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_site_rules_domain ON site_rules(domain);
    CREATE INDEX IF NOT EXISTS idx_site_rules_type ON site_rules(rule_type);

    -- 5. System Config & KV metadata
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedInitialThreats();
  console.log(`[panH Database] SQLite database initialized at ${DB_PATH}`);
}

/**
 * Seed baseline verified threats if threats table is empty
 */
function seedInitialThreats() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM threats;').get();
  if (countRow.count === 0) {
    const insert = db.prepare(`
      INSERT INTO threats (domain, verdict, risk_level, confidence, threat_category, reasons, reported_by)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    const seeds = [
      [
        'phishing-bank-update.xyz',
        'malicious',
        'critical',
        0.98,
        'phishing',
        JSON.stringify(['Known credential harvesting pattern', 'High Levenshtein homoglyph match to major bank']),
        'panH Threat Intelligence Feed'
      ],
      [
        'free-crypto-giveaway.top',
        'malicious',
        'high',
        0.95,
        'crypto_scam',
        JSON.stringify(['Crypto scam signature pattern', 'High-abuse TLD reputation (.top)']),
        'panH Threat Intelligence Feed'
      ],
      [
        'login-secure-account-verify.xyz',
        'malicious',
        'critical',
        0.99,
        'phishing',
        JSON.stringify(['Credential theft lure', 'Domain age < 48 hours', 'Suspicious URL parameter signature']),
        'panH Threat Intelligence Feed'
      ]
    ];

    seeds.forEach(s => insert.run(...s));
    console.log(`[panH Database] Seeded ${seeds.length} baseline threat intelligence records.`);
  }
}

// -------------------------------------------------------------
// Database Query APIs
// -------------------------------------------------------------

/**
 * Find threat by domain
 */
export function getThreatByDomain(domain) {
  if (!domain) return null;
  const clean = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const stmt = db.prepare('SELECT * FROM threats WHERE domain = ?;');
  const row = stmt.get(clean);
  if (!row) return null;
  return {
    ...row,
    reasons: JSON.parse(row.reasons || '[]')
  };
}

/**
 * Insert or update a threat record
 */
export function upsertThreat({ domain, verdict = 'malicious', risk_level = 'high', confidence = 0.90, threat_category = 'phishing', reasons = [], reported_by = 'user' }) {
  if (!domain) throw new Error('Domain is required');
  const clean = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const reasonsJson = typeof reasons === 'string' ? reasons : JSON.stringify(reasons);

  const stmt = db.prepare(`
    INSERT INTO threats (domain, verdict, risk_level, confidence, threat_category, reasons, reported_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(domain) DO UPDATE SET
      verdict = excluded.verdict,
      risk_level = excluded.risk_level,
      confidence = excluded.confidence,
      threat_category = excluded.threat_category,
      reasons = excluded.reasons,
      updated_at = CURRENT_TIMESTAMP;
  `);

  stmt.run(clean, verdict, risk_level, confidence, threat_category, reasonsJson, reported_by);
  return getThreatByDomain(clean);
}

/**
 * List threats with pagination
 */
export function listThreats(limit = 50, offset = 0) {
  const stmt = db.prepare('SELECT * FROM threats ORDER BY updated_at DESC LIMIT ? OFFSET ?;');
  const rows = stmt.all(limit, offset);
  const countRow = db.prepare('SELECT COUNT(*) as total FROM threats;').get();

  return {
    total: countRow.total,
    threats: rows.map(r => ({
      ...r,
      reasons: JSON.parse(r.reasons || '[]')
    }))
  };
}

/**
 * Log AI Advice query and response
 */
export function logAIAdvice({ siteDomain, userQuestion, adviceText, provider, confidence = 0.95, tokensUsed = 0 }) {
  const stmt = db.prepare(`
    INSERT INTO ai_advice_logs (site_domain, user_question, advice_text, provider, confidence, tokens_used)
    VALUES (?, ?, ?, ?, ?, ?);
  `);
  stmt.run(siteDomain || 'general', userQuestion || '', adviceText || '', provider || 'unknown', confidence, tokensUsed);
}

/**
 * Get recent AI advice history
 */
export function getRecentAIAdvice(limit = 20) {
  const stmt = db.prepare('SELECT * FROM ai_advice_logs ORDER BY created_at DESC LIMIT ?;');
  return stmt.all(limit);
}

/**
 * Record an interception event in SQLite
 */
export function recordEvent({ domain, siteDomain = null, category = 'tracker', action = 'blocked', reason = null }) {
  const stmt = db.prepare(`
    INSERT INTO events (domain, site_domain, category, action, reason)
    VALUES (?, ?, ?, ?, ?);
  `);
  stmt.run(domain, siteDomain, category, action, reason);
}

/**
 * Get aggregated event statistics
 */
export function getEventStats() {
  const totals = db.prepare(`
    SELECT 
      COUNT(*) as total_events,
      SUM(CASE WHEN category = 'ad' AND action = 'blocked' THEN 1 ELSE 0 END) as ads_blocked,
      SUM(CASE WHEN category IN ('analytics', 'social', 'tracker') AND action = 'blocked' THEN 1 ELSE 0 END) as trackers_blocked,
      SUM(CASE WHEN category = 'fingerprinting' THEN 1 ELSE 0 END) as fingerprint_shielded,
      SUM(CASE WHEN action = 'warned' OR category = 'phishing' THEN 1 ELSE 0 END) as threats_blocked
    FROM events;
  `).get();

  const recent = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 10;').all();

  return {
    total_events: totals.total_events || 0,
    ads_blocked: totals.ads_blocked || 0,
    trackers_blocked: totals.trackers_blocked || 0,
    fingerprint_shielded: totals.fingerprint_shielded || 0,
    threats_blocked: totals.threats_blocked || 0,
    recent_events: recent
  };
}

/**
 * Add site rule (allow or block)
 */
export function addSiteRule(domain, ruleType = 'allow', notes = '') {
  const clean = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const stmt = db.prepare(`
    INSERT INTO site_rules (domain, rule_type, notes)
    VALUES (?, ?, ?)
    ON CONFLICT(domain) DO UPDATE SET rule_type = excluded.rule_type, notes = excluded.notes;
  `);
  stmt.run(clean, ruleType, notes);
  return getSiteRules();
}

/**
 * Remove site rule
 */
export function removeSiteRule(domain) {
  const clean = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const stmt = db.prepare('DELETE FROM site_rules WHERE domain = ?;');
  stmt.run(clean);
  return getSiteRules();
}

/**
 * Get all site rules
 */
export function getSiteRules() {
  const stmt = db.prepare('SELECT * FROM site_rules ORDER BY created_at DESC;');
  const rows = stmt.all();
  return {
    allow_list: rows.filter(r => r.rule_type === 'allow').map(r => r.domain),
    block_list: rows.filter(r => r.rule_type === 'block').map(r => r.domain),
    rules: rows
  };
}

/**
 * Get overall database health and size
 */
export function getDatabaseDiagnostics() {
  const threatCount = db.prepare('SELECT COUNT(*) as count FROM threats;').get().count;
  const adviceCount = db.prepare('SELECT COUNT(*) as count FROM ai_advice_logs;').get().count;
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events;').get().count;
  const rulesCount = db.prepare('SELECT COUNT(*) as count FROM site_rules;').get().count;

  let fileSizeBytes = 0;
  if (fs.existsSync(DB_PATH)) {
    try {
      fileSizeBytes = fs.statSync(DB_PATH).size;
    } catch (e) {}
  }

  return {
    status: 'healthy',
    engine: 'SQLite (node:sqlite native)',
    path: DB_PATH,
    size_bytes: fileSizeBytes,
    size_formatted: `${(fileSizeBytes / 1024).toFixed(2)} KB`,
    counts: {
      threats: threatCount,
      ai_advice_logs: adviceCount,
      events: eventCount,
      site_rules: rulesCount
    }
  };
}

