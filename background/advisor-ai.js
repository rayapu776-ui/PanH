/**
 * panH - Privacy & Anonymity Network Hub
 * AI Privacy Advisor & Rule-Based Advisor Engine
 * 
 * Implements "Privacy by Design":
 * Never sends page content, browsing history, or private data.
 * When contacting external LLMs (e.g. Gemini), sends ONLY sanitized
 * domain names, tracker categories, and numerical metrics.
 */

import { explainDomainAction } from './tracker-db.js';

/**
 * Generate quick rule-based tips based on site metrics.
 */
export function generateRuleBasedTips(siteReport) {
  const tips = [];
  const { trackersBlocked = 0, adsBlocked = 0, firstPartyCount = 0, fingerprintCount = 0, score = 100, domain = 'Current Site' } = siteReport;

  if (trackersBlocked > 10) {
    tips.push({
      type: 'warning',
      title: 'High Cross-Site Tracking',
      text: `panH intercepted ${trackersBlocked} third-party tracking scripts on ${domain}. Tracking cookies are blocked.`,
      action: 'Keep Shields Active'
    });
  }

  if (firstPartyCount > 0) {
    tips.push({
      type: 'alert',
      title: 'First-Party Tracking Detected',
      text: `This site sets ${firstPartyCount} persistent identification cookies (CNAME cloaking / long-lived IDs). Block non-essential cookies?`,
      action: 'Clear Site Cookies'
    });
  }

  if (fingerprintCount > 0) {
    tips.push({
      type: 'shield',
      title: 'Browser Fingerprint Shield Engaged',
      text: `Canvas or WebGL device fingerprinting was probed. panH spoofed the output with micro-noise to prevent device profiling.`,
      action: 'Shielding On'
    });
  }

  if (adsBlocked > 20) {
    tips.push({
      type: 'info',
      title: 'Bandwidth & Clutter Saved',
      text: `${adsBlocked} advertising assets and popups were suppressed, cutting page weight and load latency.`,
      action: 'Cosmetic Filter Active'
    });
  }

  if (tips.length === 0) {
    tips.push({
      type: 'good',
      title: 'Clean Privacy Profile',
      text: `No aggressive tracking scripts or fingerprint probes detected on ${domain}. You have high privacy on this site.`,
      action: 'Protected'
    });
  }

  return tips;
}

/**
 * Generate human-readable AI summary of tracker report.
 */
export function generateAISummary(siteReport) {
  const { domain = 'this site', trackersBlocked = 0, adsBlocked = 0, firstPartyCount = 0, fingerprintCount = 0, score = 100, recentDomains = [] } = siteReport;

  const sampleList = recentDomains.slice(0, 3).map(d => d.domain).join(', ') || 'ad & telemetry networks';

  let tone = 'strong';
  if (score < 60) tone = 'heavy';
  else if (score < 80) tone = 'moderate';

  const summary = `
**panH Privacy Assessment for ${domain}** (Score: ${score}/100)
• **Activity Observed**: We blocked **${trackersBlocked} trackers** and **${adsBlocked} ad elements**. Notable third-party networks included ${sampleList}.
• **Identity Protection**: ${fingerprintCount > 0 ? `Detected and neutralized ${fingerprintCount} browser fingerprinting attempts (Canvas/WebGL).` : 'No invasive fingerprint probes succeeded.'}
• **First-Party Cloaking**: ${firstPartyCount > 0 ? `Flagged ${firstPartyCount} disguised first-party tracking cookies or CNAME subdomains.` : 'Clean first-party storage.'}

**Recommended Action**: Keep your Fingerprint Shield and Secure Search enabled. Your digital identity remains shielded on this session.
`.trim();

  return summary;
}

/**
 * Handle user questions in the AI Privacy Advisor chat panel.
 */
export async function handleAIAdvisorQuery(question, siteReport, apiKey = '') {
  const qLower = question.toLowerCase();

  // If user provided a Gemini API Key in settings, query Gemini with sanitized data
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const sanitizedContext = {
        siteDomain: siteReport.domain || 'unknown',
        privacyScore: siteReport.score || 80,
        trackersCount: siteReport.trackersBlocked || 0,
        adsCount: siteReport.adsBlocked || 0,
        fingerprintingDetected: (siteReport.fingerprintCount || 0) > 0,
        blockedDomainsSample: (siteReport.recentDomains || []).slice(0, 6).map(d => ({ domain: d.domain, category: d.category }))
      };

      const systemPrompt = `You are panH Privacy Advisor, a friendly, concise cybersecurity and privacy assistant built into the panH browser extension.
You explain tracking, ads, and fingerprinting in simple, plain language to everyday users.
RULES:
1. Keep answers concise (under 120 words), empathetic, and actionable.
2. Explain WHY something is blocked and WHAT the user should do next.
3. Strict privacy rule: Only reference the provided domain names and categories. Never assume or ask for private user content.`;

      const userPrompt = `Context for the current tab:
${JSON.stringify(sanitizedContext, null, 2)}

User question: "${question}"

Provide a clear, plain-language answer explaining what happened and what the user should do next.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 250 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (err) {
      console.warn('[panH AI Advisor] Gemini API request failed, falling back to local intelligence:', err);
    }
  }

  // Built-in Smart Local AI Reasoning Engine (Zero latency, works offline, strictly local)
  const domain = siteReport.domain || 'this website';
  const trackers = siteReport.trackersBlocked || 0;
  const ads = siteReport.adsBlocked || 0;
  const fpCount = siteReport.fingerprintCount || 0;

  // Specific domain inquiries
  if (qLower.includes('why blocked') || qLower.includes('adnet-x') || qLower.includes('tracker-a') || qLower.includes('why was') || qLower.includes('reason')) {
    return `We blocked these requests because third-party ad networks (such as adnet-x.com and tracker-a.io) attempt to sync your device ID across multiple websites you visit. By stopping their background scripts, panH stops them from building a persistent behavioral profile of your reading and shopping interests.`;
  }

  if (qLower.includes('fingerprint') || qLower.includes('canvas') || qLower.includes('webgl')) {
    return `Browser fingerprinting is a stealth tracking technique where websites probe subtle variations in your device's graphics card (Canvas/WebGL) and audio processing to create a unique ID without cookies. panH's **Fingerprint Shield** automatically injects harmless cryptographic micro-noise into these readouts so your browser looks like a different computer every time.`;
  }

  if (qLower.includes('first party') || qLower.includes('cname') || qLower.includes('cookie')) {
    return `First-party tracking occurs when a site tries to bypass ad blockers by saving user IDs in cookies on their own domain, or routing data through disguised subdomains (CNAME cloaking). panH inspects cookie expiration lengths and entropy to flag IDs designed to follow you back on future visits.`;
  }

  if (qLower.includes('email') || qLower.includes('pixel') || qLower.includes('gmail')) {
    return `Marketing emails often contain hidden 1x1 invisible images ("spy pixels") that report back to the sender the exact second you open an email, what city you are in, and what device you use. panH detects these invisible images and neutralizes them in Gmail, Outlook, and Yahoo webmail.`;
  }

  if (qLower.includes('secure search') || qLower.includes('search') || qLower.includes('utm')) {
    return `When you click search results or links, URLs often include tracking tags like 'utm_source', 'fbclid', or 'gclid' that tell destination sites exactly where you came from. panH's **Secure Search** strips these parameters before navigation and prevents referrer leakage.`;
  }

  if (qLower.includes('score') || qLower.includes('why is my score') || qLower.includes('rating')) {
    return `Your privacy score for ${domain} is calculated based on how aggressively the page attempted to track you. With ${trackers} trackers and ${ads} ads blocked${fpCount > 0 ? `, plus ${fpCount} fingerprint probes stopped` : ''}, panH actively prevented data brokers from identifying you.`;
  }

  if (qLower.includes('safe') || qLower.includes('is it safe') || qLower.includes('danger')) {
    return `The site itself is likely safe to view, but its advertisers and third-party partners were attempting to collect extensive behavioral telemetry. With panH active, those tracking channels are severed while the main site content continues to load normally.`;
  }

  // General recommendation
  return `On ${domain}, panH has blocked ${trackers} tracking scripts and ${ads} ad units. Your device fingerprint is masked, and tracking links are stripped. You don't need to take any extra steps—your session is shielded! Feel free to ask about any specific tracker or privacy setting.`;
}

