/**
 * Automated validation test for panH Chrome Extension
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- Validating panH Extension Files & Manifest V3 ---');

// 1. Check manifest.json
const manifestPath = path.join(ROOT, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
assert(manifest.manifest_version === 3, 'manifest_version is 3');
assert(manifest.name && manifest.version, 'Manifest has name and version');

// 2. Check Icons
for (const size of [16, 32, 48, 128]) {
  const iconPath = path.join(ROOT, 'icons', `icon${size}.png`);
  assert(fs.existsSync(iconPath), `Icon icons/icon${size}.png exists`);
}

// 3. Check Rulesets
for (const ruleResource of manifest.declarative_net_request.rule_resources) {
  const rulePath = path.join(ROOT, ruleResource.path);
  assert(fs.existsSync(rulePath), `Rule resource ${ruleResource.path} exists`);
  const rules = JSON.parse(fs.readFileSync(rulePath, 'utf-8'));
  assert(Array.isArray(rules) && rules.length > 0, `Rule resource ${ruleResource.path} has valid array of ${rules.length} rules`);
}

// 4. Check Background Service Worker
const bgPath = path.join(ROOT, manifest.background.service_worker);
assert(fs.existsSync(bgPath), `Service worker ${manifest.background.service_worker} exists`);

// 5. Check Content Scripts
for (const cs of manifest.content_scripts) {
  for (const jsFile of cs.js) {
    const csPath = path.join(ROOT, jsFile);
    assert(fs.existsSync(csPath), `Content script ${jsFile} exists`);
  }
}

// 6. Check Popup & Dashboard
assert(fs.existsSync(path.join(ROOT, 'popup', 'popup.html')), 'popup/popup.html exists');
assert(fs.existsSync(path.join(ROOT, 'popup', 'popup.css')), 'popup/popup.css exists');
assert(fs.existsSync(path.join(ROOT, 'popup', 'popup.js')), 'popup/popup.js exists');

assert(fs.existsSync(path.join(ROOT, 'dashboard', 'dashboard.html')), 'dashboard/dashboard.html exists');
assert(fs.existsSync(path.join(ROOT, 'dashboard', 'dashboard.css')), 'dashboard/dashboard.css exists');
assert(fs.existsSync(path.join(ROOT, 'dashboard', 'dashboard.js')), 'dashboard/dashboard.js exists');

console.log('\n🎉 ALL VALIDATION CHECKS PASSED SUCCESSFULLY!');
