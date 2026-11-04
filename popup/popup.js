/**
 * panH - Popup Controller
 * Implements Section 5.2 of panH AI Edition Blueprint
 */

document.addEventListener('DOMContentLoaded', async () => {
  const api = window.panhApi || (typeof browser !== 'undefined' ? browser : chrome);

  // Score & status elements
  const siteScoreValEl = document.getElementById('siteScoreValue');
  const siteScoreRatingEl = document.getElementById('siteScoreRating');
  const siteStatusPill = document.getElementById('siteStatusPill');
  const siteHostnameEl = document.getElementById('siteHostname');
  const scoreCircleFill = document.getElementById('scoreCircleFill');
  const statusBadgeText = document.getElementById('statusBadgeText');
  const btnSettingsShortcut = document.getElementById('btnSettingsShortcut');

  // 4 Counter elements (Section 5.2)
  const trackersCountEl = document.getElementById('trackersCount');
  const adsCountEl = document.getElementById('adsCount');
  const suspiciousCountEl = document.getElementById('suspiciousCount');
  const firstPartyCountEl = document.getElementById('firstPartyCount');

  // Site-level control elements (Section 2.2 & 5.2)
  const siteControlStatus = document.getElementById('siteControlStatus');
  const btnPauseSite = document.getElementById('btnPauseSite');
  const btnPauseSiteText = document.getElementById('btnPauseSiteText');
  const btnReportBroken = document.getElementById('btnReportBroken');

  // Quick controls (Section 5.2)
  const toggleAdBlocking = document.getElementById('toggleAdBlocking');
  const toggleTrackerShield = document.getElementById('toggleTrackerShield');
  const toggleFingerprint = document.getElementById('toggleFingerprint');
  const toggleAIGuardian = document.getElementById('toggleAIGuardian');

  // Why blocked banner & AI advisor drawer
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

  let currentDomain = 'Active Tab';
  let currentSiteData = null;
  let isSitePaused = false;

  // 1. Identify active tab domain across browsers
  try {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab && tab.url && tab.url.startsWith('http')) {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
    } else if (tab && tab.title) {
      currentDomain = tab.title.slice(0, 24);
    }
  } catch (e) {
    console.debug('[panH] Active tab resolution error:', e);
  }

  siteHostnameEl.textContent = currentDomain;

  // 2. Fetch site report and settings
  api.runtime.sendMessage({ type: 'GET_SITE_REPORT', domain: currentDomain }).then((response) => {
    if (!response) return;

    currentSiteData = response.siteData || {
      domain: currentDomain,
      trackersBlocked: 0,
      adsBlocked: 0,
      suspiciousCount: 0,
      firstPartyCount: 0,
      score: 100,
      recentDomains: []
    };
    const settings = response.settings || {};
    const allowList = settings.whitelistedDomains || [];

    // Check if site is paused / allow-listed
    isSitePaused = allowList.includes(currentDomain);
    updateSitePauseUI();

    // Populate score & circular progress
    const score = isSitePaused ? 100 : (currentSiteData.score !== undefined ? currentSiteData.score : 100);
    siteScoreValEl.textContent = score;

    const maxCircumference = 264;
    const offset = maxCircumference - (score / 100) * maxCircumference;
    scoreCircleFill.style.strokeDashoffset = offset;

    // Set rating label & color (Design Tokens)
    if (isSitePaused) {
      siteScoreRatingEl.textContent = 'Paused';
      siteScoreRatingEl.style.color = '#F59E0B';
      siteStatusPill.textContent = 'Paused';
      siteStatusPill.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
      siteStatusPill.style.color = '#F59E0B';
      scoreCircleFill.style.stroke = '#F59E0B';
    } else if (score >= 80) {
      siteScoreRatingEl.textContent = 'Protected';
      siteScoreRatingEl.style.color = '#22C55E';
      siteStatusPill.textContent = 'Protected';
      siteStatusPill.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
      siteStatusPill.style.color = '#22C55E';
      scoreCircleFill.style.stroke = '#22C55E';
    } else if (score >= 60) {
      siteScoreRatingEl.textContent = 'Caution';
      siteScoreRatingEl.style.color = '#F59E0B';
      siteStatusPill.textContent = 'Caution';
      siteStatusPill.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
      siteStatusPill.style.color = '#F59E0B';
      scoreCircleFill.style.stroke = '#F59E0B';
    } else {
      siteScoreRatingEl.textContent = 'Threat Blocked';
      siteScoreRatingEl.style.color = '#EF4444';
      siteStatusPill.textContent = 'Threat Blocked';
      siteStatusPill.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
      siteStatusPill.style.color = '#EF4444';
      scoreCircleFill.style.stroke = '#EF4444';
    }

    // Populate 4 Counters
    trackersCountEl.textContent = currentSiteData.trackersBlocked || 0;
    adsCountEl.textContent = currentSiteData.adsBlocked || 0;
    suspiciousCountEl.textContent = currentSiteData.suspiciousCount || 0;
    firstPartyCountEl.textContent = `${currentSiteData.firstPartyCount || 0} found`;

    // Populate Toggles
    toggleAdBlocking.checked = settings.adsBlocker !== false;
    toggleTrackerShield.checked = settings.trackerBlocker !== false;
    toggleFingerprint.checked = settings.fingerprintShield !== false;
    toggleAIGuardian.checked = settings.aiThreatDetection !== false;

    // Why Blocked Card
    if (currentSiteData.recentDomains && currentSiteData.recentDomains.length > 0) {
      const topDomain = currentSiteData.recentDomains[0];
      whyBlockedTextEl.textContent = `${topDomain.domain} was blocked from following you. Ask advisor`;
    } else {
      whyBlockedTextEl.textContent = `No cross-site trackers or threats detected on this page. Ask advisor`;
    }

    if (settings.geminiApiKey) {
      drawerModelPill.textContent = 'Gemini AI';
      drawerModelPill.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
      drawerModelPill.style.color = '#22C55E';
    }
  });

  // 3. Site-Level Controls UI & Handler (Section 2.2 & 5.2)
  function updateSitePauseUI() {
    if (isSitePaused) {
      siteControlStatus.textContent = 'Protection paused for this domain';
      siteControlStatus.style.color = '#F59E0B';
      btnPauseSiteText.textContent = 'Resume Site';
      btnPauseSite.classList.add('paused');
      statusBadgeText.textContent = 'Site Paused';
    } else {
      siteControlStatus.textContent = 'Active for this domain';
      siteControlStatus.style.color = '#A9B8CA';
      btnPauseSiteText.textContent = 'Pause for Site';
      btnPauseSite.classList.remove('paused');
      statusBadgeText.textContent = 'AI Active';
    }
  }

  btnPauseSite.addEventListener('click', () => {
    isSitePaused = !isSitePaused;
    updateSitePauseUI();

    const action = isSitePaused ? 'ADD_SITE_ALLOWLIST' : 'REMOVE_SITE_ALLOWLIST';
    api.runtime.sendMessage({
      type: action,
      domain: currentDomain
    }).then(() => {
      // Reload tab to apply pause if desired
      api.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (tab && tab.id) api.tabs.update(tab.id, { url: tab.url });
      });
    });
  });

  // Report a broken page button
  btnReportBroken.addEventListener('click', () => {
    api.runtime.sendMessage({
      type: 'REPORT_BROKEN_PAGE',
      domain: currentDomain
    }).then(() => {
      btnReportBroken.textContent = '✓ Report submitted. Thank you!';
      btnReportBroken.style.color = '#22C55E';
      setTimeout(() => {
        btnReportBroken.textContent = 'Report a broken page';
        btnReportBroken.style.color = '#A9B8CA';
      }, 3000);
    });
  });

  // 4. Quick Toggles Handlers
  function handleToggleChange(element, settingKey) {
    element.addEventListener('change', () => {
      api.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { [settingKey]: element.checked }
      });
    });
  }

  handleToggleChange(toggleAdBlocking, 'adsBlocker');
  handleToggleChange(toggleTrackerShield, 'trackerBlocker');
  handleToggleChange(toggleFingerprint, 'fingerprintShield');
  handleToggleChange(toggleAIGuardian, 'aiThreatDetection');

  // 5. 1-Click AI Fix
  btnQuickFix?.addEventListener('click', () => {
    api.runtime.sendMessage({
      type: 'EXECUTE_AI_REMEDIATION',
      action: 'ENABLE_STRICT_SHIELD'
    }).then(() => {
      toggleFingerprint.checked = true;
      toggleAdBlocking.checked = true;
      toggleTrackerShield.checked = true;
      btnQuickFix.textContent = '✓ Shielded';
      setTimeout(() => { btnQuickFix.textContent = '1-Click AI Fix'; }, 2000);
    });
  });

  // 6. Quick AI Advisor Drawer
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

  // 7. Settings Shortcut & Open Dashboard
  btnSettingsShortcut.addEventListener('click', () => {
    api.tabs.create({ url: api.runtime.getURL('dashboard/dashboard.html#settings') });
  });

  btnOpenDashboard.addEventListener('click', () => {
    api.tabs.create({ url: api.runtime.getURL('dashboard/dashboard.html') });
  });
});
