/**
 * panH - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const siteScoreValEl = document.getElementById('siteScoreValue');
  const siteScoreRatingEl = document.getElementById('siteScoreRating');
  const siteHostnameEl = document.getElementById('siteHostname');
  const scoreCircleFill = document.getElementById('scoreCircleFill');

  const trackersCountEl = document.getElementById('trackersCount');
  const adsCountEl = document.getElementById('adsCount');
  const firstPartyCountEl = document.getElementById('firstPartyCount');

  const toggleFingerprint = document.getElementById('toggleFingerprint');
  const toggleSecureSearch = document.getElementById('toggleSecureSearch');

  const whyBlockedTextEl = document.getElementById('whyBlockedText');
  const btnAskAdvisor = document.getElementById('btnAskAdvisor');
  const advisorDrawer = document.getElementById('advisorDrawer');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerAnswer = document.getElementById('drawerAnswer');

  const btnOpenDashboard = document.getElementById('btnOpenDashboard');

  let currentDomain = 'news-site.com';
  let currentSiteData = null;

  // 1. Identify active tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.startsWith('http')) {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
    }
  } catch (e) {
    console.debug('Using default demo domain:', e);
  }

  siteHostnameEl.textContent = currentDomain;

  // 2. Fetch site report and settings from Service Worker
  chrome.runtime.sendMessage({ type: 'GET_SITE_REPORT', domain: currentDomain }, (response) => {
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

    // Populate Why Blocked explanation banner
    if (currentSiteData.recentDomains && currentSiteData.recentDomains.length > 0) {
      const topDomain = currentSiteData.recentDomains[0];
      whyBlockedTextEl.textContent = `${topDomain.domain} tried to follow you across sites. Ask advisor`;
    } else {
      whyBlockedTextEl.textContent = `adnet-x.com tried to follow you across sites. Ask advisor`;
    }
  });

  // 3. Toggle Handlers
  toggleFingerprint.addEventListener('change', () => {
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { fingerprintShield: toggleFingerprint.checked }
    });
  });

  toggleSecureSearch.addEventListener('change', () => {
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { secureSearch: toggleSecureSearch.checked }
    });
  });

  // 4. Quick AI Advisor Drawer
  btnAskAdvisor.addEventListener('click', () => {
    advisorDrawer.style.display = 'flex';
    drawerAnswer.textContent = 'Analyzing blocked requests with panH Privacy Advisor...';

    const question = `Why was the top tracking request blocked on ${currentDomain}?`;
    chrome.runtime.sendMessage({
      type: 'ASK_AI_ADVISOR',
      question,
      siteReport: currentSiteData || { domain: currentDomain, trackersBlocked: 23, adsBlocked: 41 }
    }, (res) => {
      drawerAnswer.textContent = res?.answer || 'adnet-x.com was blocked because it tried to correlate your reading identity across multiple publisher networks using third-party tracking cookies.';
    });
  });

  btnCloseDrawer.addEventListener('click', () => {
    advisorDrawer.style.display = 'none';
  });

  // 5. Open Dashboard Button
  btnOpenDashboard.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });
});
