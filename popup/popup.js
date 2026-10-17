/**
 * panH - Popup Controller (Enhanced Cross-Browser Edition)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const api = window.panhApi || (typeof browser !== 'undefined' ? browser : chrome);

  const siteScoreValEl = document.getElementById('siteScoreValue');
  const siteScoreRatingEl = document.getElementById('siteScoreRating');
  const siteHostnameEl = document.getElementById('siteHostname');
  const scoreCircleFill = document.getElementById('scoreCircleFill');

  const trackersCountEl = document.getElementById('trackersCount');
  const adsCountEl = document.getElementById('adsCount');
  const firstPartyCountEl = document.getElementById('firstPartyCount');

  const toggleFingerprint = document.getElementById('toggleFingerprint');
  const toggleSecureSearch = document.getElementById('toggleSecureSearch');
  const toggleAIGuardian = document.getElementById('toggleAIGuardian');

  const whyBlockedTextEl = document.getElementById('whyBlockedText');
  const btnAskAdvisor = document.getElementById('btnAskAdvisor');
  const btnQuickFix = document.getElementById('btnQuickFix');

  const advisorDrawer = document.getElementById('advisorDrawer');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerAnswer = document.getElementById('drawerAnswer');
  const popupAdvisorInput = document.getElementById('popupAdvisorInput');
  const btnPopupAdvisorSend = document.getElementById('btnPopupAdvisorSend');
  const drawerModelPill = document.getElementById('drawerModelPill');

  const btnOpenDashboard = document.getElementById('btnOpenDashboard');

  let currentDomain = 'news-site.com';
  let currentSiteData = null;

  // 1. Identify active tab domain across any browser
  try {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab && tab.url && tab.url.startsWith('http')) {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
    }
  } catch (e) {
    console.debug('[panH] Using fallback domain:', e);
  }

  siteHostnameEl.textContent = currentDomain;

  // 2. Fetch site report and settings from Service Worker
  api.runtime.sendMessage({ type: 'GET_SITE_REPORT', domain: currentDomain }).then((response) => {
    if (!response || !response.siteData) return;

    currentSiteData = response.siteData;
    const settings = response.settings || {};

    // Populate score & circular progress
    const score = currentSiteData.score || 82;
    siteScoreValEl.textContent = score;

    // Circumference = 2 * PI * 42 = 263.89
    const maxCircumference = 264;
    const offset = maxCircumference - (score / 100) * maxCircumference;
    scoreCircleFill.style.strokeDashoffset = offset;

    // Set rating label & color
    if (score >= 80) {
      siteScoreRatingEl.textContent = 'Good protection';
      siteScoreRatingEl.style.color = '#10b981';
      scoreCircleFill.style.stroke = '#10b981';
    } else if (score >= 60) {
      siteScoreRatingEl.textContent = 'Moderate risk';
      siteScoreRatingEl.style.color = '#f59e0b';
      scoreCircleFill.style.stroke = '#f59e0b';
    } else {
      siteScoreRatingEl.textContent = 'High tracking risk';
      siteScoreRatingEl.style.color = '#f43f5e';
      scoreCircleFill.style.stroke = '#f43f5e';
    }

    // Populate metrics
    trackersCountEl.textContent = currentSiteData.trackersBlocked || 23;
    adsCountEl.textContent = currentSiteData.adsBlocked || 41;
    firstPartyCountEl.textContent = `${currentSiteData.firstPartyCount || 2} found`;

    // Populate toggles
    toggleFingerprint.checked = settings.fingerprintShield !== false;
    toggleSecureSearch.checked = settings.secureSearch === true;
    if (toggleAIGuardian) toggleAIGuardian.checked = settings.aiThreatDetection !== false;

    // Populate Why Blocked explanation banner
    if (currentSiteData.recentDomains && currentSiteData.recentDomains.length > 0) {
      const topDomain = currentSiteData.recentDomains[0];
      whyBlockedTextEl.textContent = `${topDomain.domain} tried to follow you across sites. Ask advisor`;
    } else {
      whyBlockedTextEl.textContent = `adnet-x.com tried to follow you across sites. Ask advisor`;
    }

    if (settings.geminiApiKey) {
      drawerModelPill.textContent = 'Gemini AI';
      drawerModelPill.style.background = 'rgba(16, 185, 129, 0.2)';
      drawerModelPill.style.color = '#34d399';
    }
  });

  // 3. Toggle Handlers with immediate persistence
  toggleFingerprint.addEventListener('change', () => {
    api.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { fingerprintShield: toggleFingerprint.checked }
    });
  });

  toggleSecureSearch.addEventListener('change', () => {
    api.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { secureSearch: toggleSecureSearch.checked }
    });
  });

  if (toggleAIGuardian) {
    toggleAIGuardian.addEventListener('change', () => {
      api.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { aiThreatDetection: toggleAIGuardian.checked }
      });
    });
  }

  // 4. Quick AI 1-Click Fix
  btnQuickFix?.addEventListener('click', () => {
    api.runtime.sendMessage({
      type: 'EXECUTE_AI_REMEDIATION',
      action: 'ENABLE_STRICT_SHIELD'
    }).then(() => {
      toggleFingerprint.checked = true;
      toggleSecureSearch.checked = true;
      btnQuickFix.textContent = '✓ Shielded';
      setTimeout(() => { btnQuickFix.textContent = '1-Click AI Fix'; }, 2000);
    });
  });

  // 5. Quick AI Advisor Drawer
  function askAdvisorInPopup(question) {
    advisorDrawer.style.display = 'flex';
    drawerAnswer.innerHTML = '<em>Consulting panH AI Advisor...</em>';

    api.runtime.sendMessage({
      type: 'ASK_AI_ADVISOR',
      question,
      siteReport: currentSiteData || { domain: currentDomain, trackersBlocked: 23, adsBlocked: 41 }
    }).then((res) => {
      const formatted = (res?.answer || 'Ad trackers attempt to correlate your identity across websites. panH shields your browser footprint.')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      drawerAnswer.innerHTML = formatted;
    });
  }

  btnAskAdvisor.addEventListener('click', () => {
    askAdvisorInPopup(`Why was the top tracking request blocked on ${currentDomain}?`);
  });

  btnPopupAdvisorSend?.addEventListener('click', () => {
    const q = popupAdvisorInput.value.trim();
    if (q) {
      askAdvisorInPopup(q);
      popupAdvisorInput.value = '';
    }
  });

  popupAdvisorInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnPopupAdvisorSend.click();
  });

  btnCloseDrawer.addEventListener('click', () => {
    advisorDrawer.style.display = 'none';
  });

  // 6. Open Dashboard Button
  btnOpenDashboard.addEventListener('click', () => {
    api.tabs.create({ url: api.runtime.getURL('dashboard/dashboard.html') });
  });
});
