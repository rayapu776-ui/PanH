/**
 * panH AI Edition - Automated Pre-Push Secret & Environment Scanner
 * 
 * Verifies that:
 * 1. Zero .env or secret files are tracked in Git.
 * 2. .gitignore properly matches all .env variants.
 * 3. No high-entropy API keys or credentials are leaked in tracked source code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('--- 🔍 panH AI Automated Secret & Environment Scanner ---');

let violations = [];

// 1. Check git tracked files for prohibited env patterns
try {
  const trackedFilesOutput = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' });
  const trackedFiles = trackedFilesOutput.split('\n').map(f => f.trim()).filter(Boolean);

  for (const file of trackedFiles) {
    const base = path.basename(file);
    // Allow example templates only
    if (base === '.env.example' || base === '.env.template') {
      continue;
    }

    if (base === '.env' || base.startsWith('.env.') || file.includes('/.env')) {
      violations.push(`[BLOCKED FILE] Prohibited environment file is tracked in git: "${file}"`);
    }

    if (file.endsWith('.pem') || file.endsWith('.key') || file.endsWith('.pfx') || file.endsWith('.p12')) {
      violations.push(`[BLOCKED KEY] Private certificate/key file is tracked in git: "${file}"`);
    }

    if (file.endsWith('.db') || file.endsWith('.sqlite') || file.includes('server/data/backups/')) {
      violations.push(`[BLOCKED STORE] Database store/backup file is tracked in git: "${file}"`);
    }
  }

  // 2. Scan tracked files for raw secret patterns
  const SECRET_PATTERNS = [
    { name: 'Google Cloud / Gemini API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
    { name: 'GCP Service Account Key Token', regex: /AQ\.[0-9A-Za-z-_]{30,}/ },
    { name: 'OpenAI Secret API Key', regex: /sk-[a-zA-Z0-9]{32,}/ },
    { name: 'Private Key Header', regex: /-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/ },
    { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'GitHub Personal Access Token', regex: /gh[pousr]_[0-9A-Za-z]{36}/ }
  ];

  for (const file of trackedFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;

    // Skip binary and test files with mock tokens
    if (file.endsWith('.png') || file.endsWith('.svg') || file === 'test/ai-eval.js') continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(content)) {
          violations.push(`[DETECTED SECRET] ${pattern.name} found in tracked file: "${file}"`);
        }
      }
    } catch (e) {
      // Binary file skip
    }
  }

  // 3. Verify .gitignore blocks .env
  const testEnvIgnored = execSync('git check-ignore .env server/.env', { cwd: ROOT, encoding: 'utf-8' });
  if (!testEnvIgnored.includes('.env')) {
    violations.push('[GITIGNORE MISCONFIGURED] .env is not matched by .gitignore');
  }

} catch (err) {
  violations.push(`[EXECUTION ERROR] Secret scanner encountered error: ${err.message}`);
}

if (violations.length > 0) {
  console.error('\n🚨 CRITICAL SECURITY RULE VIOLATIONS DETECTED:');
  violations.forEach(v => console.error(`  ❌ ${v}`));
  console.error('\n🛑 GITHUB PUSH MUST BE REJECTED. Remove secrets before committing or pushing.\n');
  process.exit(1);
} else {
  console.log('✅ PASS: Zero tracked .env files or exposed private credentials found.');
  console.log('✅ PASS: All environment files correctly blocked by .gitignore.');
  console.log('🎉 Repository is safe and compliant with panH AI Security Standards!\n');
  process.exit(0);
}

