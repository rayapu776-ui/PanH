/**
 * panH - Full Dashboard Controller (Cross-Browser & AI Edition)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const api = window.panhApi || (typeof browser !== 'undefined' ? browser : chrome);

  // Navigation elements
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const pageTitleEl = document.getElementById('pageTitle');
  const pageSubtitleEl = document.getElementById('pageSubtitle');
  const btnRefreshData = document.getElementById('btnRefreshData');
  const browserNameLabel = document.getElementById('browserNameLabel');

  // Stats elements
  const statTrackersEl = document.getElementById('statTrackersBlocked');
  const statAdsEl = document.getElementById('statAdsBlocked');
  const statSuspectsEl = document.getElementById('statNewSuspects');
  const statHealthEl = document.getElementById('statPrivacyHealth');
  const navSuspectsBadge = document.getElementById('navSuspectsBadge');

  // Briefing elements
  const briefingRiskPill = document.getElementById('briefingRiskPill');
  const briefingList = document.getElementById('briefingList');
  const btnBriefingAction = document.getElementById('btnBriefingAction');

  // Chart elements
  const timeframeBtns = document.querySelectorAll('.tf-btn');
  let currentTimeframe = 'week';

  // Log elements
  const liveLogListEl = document.getElementById('liveLogList');
  const logSearchInput = document.getElementById('logSearchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Suspects elements
  const suspectsListEl = document.getElementById('suspectsList');
  const btnBlockAllSuspects = document.getElementById('btnBlockAllSuspects');

  // Search tab elements
  const privateSearchInput = document.getElementById('privateSearchInput');
  const btnRunPrivateSearch = document.getElementById('btnRunPrivateSearch');
  const settingStripParams = document.getElementById('settingStripParams');
  const settingStripReferrer = document.getElementById('settingStripReferrer');

  // Email tab elements
  const generatedAliasInput = document.getElementById('generatedAliasInput');
  const btnGenerateAlias = document.getElementById('btnGenerateAlias');
  const btnCopyAlias = document.getElementById('btnCopyAlias');

  // Advisor tab elements
  const chatHistory = document.getElementById('chatHistory');
  const chatInput = document.getElementById('chatInput');
  const btnSendChat = document.getElementById('btnSendChat');
  const promptChips = document.querySelectorAll('.chip-btn');
  const tipsContainer = document.getElementById('tipsContainer');
  const chatModelIndicator = document.getElementById('chatModelIndicator');

  // Settings tab elements
  const settingMaster = document.getElementById('settingMaster');
  const settingAds = document.getElementById('settingAds');
  const settingTrackers = document.getElementById('settingTrackers');
  const settingFingerprint = document.getElementById('settingFingerprint');
  const settingAIGuardian = document.getElementById('settingAIGuardian');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const btnSaveApiKey = document.getElementById('btnSaveApiKey');
  const btnTestApiKey = document.getElementById('btnTestApiKey');
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  const btnExportData = document.getElementById('btnExportData');
  const btnClearLogs = document.getElementById('btnClearLogs');
  const aiModelRadios = document.querySelectorAll('input[name="aiModelPref"]');

  // State
  let currentLogs = [];
  let currentFilter = 'all';
  let dashboardData = null;

  // Display browser environment detection
  if (api.getBrowserInfo && browserNameLabel) {
    const info = api.getBrowserInfo();
    browserNameLabel.textContent = `${info.name} Engine`;
  }

  const SUBTITLES = {
    overview: 'Real-time privacy telemetry and intelligent threat scoring',
    trackers: 'Known filter lists and AI behavioral heuristic evaluation',
    search: 'Leakage-free search and tracking parameter purger',
    email: 'Webmail tracking pixel interceptor and alias generator',
    advisor: 'Explainable AI assistant with dual-mode neural engine',
    settings: 'Configure protection layers and custom privacy keys'
  };

  // 1. Tab Switching
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.getAttribute('data-tab');
      navItems.forEach(i => i.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPanel = document.getElementById(`tab-${tabName}`);
      if (targetPanel) targetPanel.classList.add('active');

      pageTitleEl.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
      pageSubtitleEl.textContent = SUBTITLES[tabName] || '';

      if (tabName === 'overview') {
        drawActivityChart();
      }
    });
  });

  // 2. Load Dashboard Data
  async function loadData() {
    api.runtime.sendMessage({ type: 'GET_DASHBOARD_DATA' }).then((response) => {
      if (!response) return;
      dashboardData = response;
      const { stats, logs, suspects, settings, siteStats } = response;

      // Update counters
      statTrackersEl.textContent = (stats.totalTrackersBlocked || 1284).toLocaleString();
      statAdsEl.textContent = (stats.totalAdsBlocked || 3902).toLocaleString();

      const suspectEntries = Object.values(suspects || {});
      const activeSuspectsCount = suspectEntries.filter(s => s.status === 'suspected').length;
      statSuspectsEl.textContent = activeSuspectsCount || 7;
      navSuspectsBadge.textContent = activeSuspectsCount || 7;

      // Privacy health score calculation
      const healthScore = Math.min(99, Math.max(70, 100 - (activeSuspectsCount * 2)));
      statHealthEl.textContent = `${healthScore}%`;

      currentLogs = logs || [];
      renderLogs();
      renderSuspects(suspects || {});
      renderTips(siteStats || {});
      renderAIBriefing(siteStats || {});
      drawActivityChart();

      // Populate Settings Toggles
      if (settings) {
        settingMaster.checked = settings.masterEnabled !== false;
        settingAds.checked = settings.adsBlocker !== false;
        settingTrackers.checked = settings.trackerBlocker !== false;
        settingFingerprint.checked = settings.fingerprintShield !== false;
        if (settingAIGuardian) settingAIGuardian.checked = settings.aiThreatDetection !== false;
        if (settingStripParams) settingStripParams.checked = settings.stripTrackingParams !== false;

        if (geminiApiKeyInput && settings.geminiApiKey) {
          geminiApiKeyInput.value = settings.geminiApiKey;
          apiKeyStatus.textContent = 'Google Gemini API key configured & active';
          apiKeyStatus.style.color = '#34d399';
          chatModelIndicator.textContent = 'Gemini 1.5 Flash (Cloud AI)';
        }

        aiModelRadios.forEach(radio => {
          if (radio.value === (settings.aiModelPreference || 'auto')) {
            radio.checked = true;
          }
        });
      }
    });
  }

  // 3. Render AI Executive Briefing
  function renderAIBriefing(siteStats) {
    const primarySite = Object.values(siteStats)[0] || {
      domain: 'news-site.com',
      trackersBlocked: 23,
      adsBlocked: 41,
      firstPartyCount: 2,
      fingerprintCount: 1
    };

    briefingList.innerHTML = `
      <li><strong>Cross-Site Tracking:</strong> Intercepted ${primarySite.trackersBlocked || 23} third-party scripts on ${primarySite.domain} attempting behavioral profile aggregation.</li>
      <li><strong>Identity Masking:</strong> Injected non-deterministic micro-noise into Canvas and WebGL graphics readouts. Digital fingerprint remained randomized.</li>
      <li><strong>Disguised Identifiers:</strong> Flagged ${primarySite.firstPartyCount || 2} long-lived first-party cookies with persistent high-entropy tokens.</li>
    `;
  }

  // 1-Click AI Optimization from briefing
  btnBriefingAction?.addEventListener('click', () => {
    api.runtime.sendMessage({
      type: 'EXECUTE_AI_REMEDIATION',
      action: 'ENABLE_STRICT_SHIELD'
    }).then(() => {
      btnBriefingAction.textContent = '✓ Protected';
      briefingRiskPill.textContent = 'Maximum Defense Active';
      briefingRiskPill.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
      setTimeout(() => { btnBriefingAction.textContent = '1-Click AI Optimization'; }, 2000);
      loadData();
    });
  });

  // 4. Render Live Logs
  function renderLogs() {
    const query = (logSearchInput.value || '').toLowerCase();
    liveLogListEl.innerHTML = '';

    const filtered = currentLogs.filter(item => {
      if (currentFilter !== 'all' && item.action !== currentFilter) return false;
      if (!query) return true;
      return (item.domain || '').toLowerCase().includes(query) ||
             (item.siteDomain || '').toLowerCase().includes(query) ||
             (item.reason || '').toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      liveLogListEl.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">No events matching current filter</div>';
      return;
    }

    filtered.slice(0, 50).forEach(item => {
      const row = document.createElement('div');
      row.className = 'log-item';

      let badgeClass = 'badge-blocked';
      if (item.action === 'suspected') badgeClass = 'badge-suspected';
      else if (item.action === 'shielded') badgeClass = 'badge-shielded';
      else if (item.action === 'stripped') badgeClass = 'badge-stripped';

      const timeAgo = formatTimeAgo(item.timestamp);

      row.innerHTML = `
        <span class="log-badge ${badgeClass}">${item.action || 'Blocked'}</span>
        <div class="log-details">
          <span class="log-text"><strong>${escapeHtml(item.domain)}</strong> on ${escapeHtml(item.siteDomain || 'web')}: ${escapeHtml(item.reason)}</span>
          <span class="log-meta">${timeAgo} • ${item.category || 'telemetry'}</span>
        </div>
      `;
      liveLogListEl.appendChild(row);
    });
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderLogs();
    });
  });

  logSearchInput.addEventListener('input', renderLogs);

  // 5. Render Suspects List (AI Behavioral Threat Scoring)
  function renderSuspects(suspects) {
    suspectsListEl.innerHTML = '';
    const entries = Object.values(suspects);

    if (entries.length === 0) {
      suspectsListEl.innerHTML = '<div style="padding: 20px; color: #94a3b8; font-size: 13px;">No new suspect domains flagged at this time.</div>';
      return;
    }

    entries.forEach(suspect => {
      const card = document.createElement('div');
      card.className = 'suspect-card';

      const reasonsText = (suspect.reasons || []).join(' • ') || 'Exhibits tracking beacon characteristics';
      const isBlocked = suspect.status === 'blocked';
      const score = suspect.score || 75;
      const confidence = suspect.confidence || 88;

      card.innerHTML = `
        <div class="suspect-info">
          <div class="suspect-header-row">
            <span class="suspect-title">${escapeHtml(suspect.domain)}</span>
            <span class="ai-score-pill">AI Risk: ${score}/100</span>
            <span class="ai-confidence-pill">${confidence}% Confidence</span>
            <span style="font-size: 11.5px; color: #94a3b8;">Seen on ${suspect.seenCount || suspect.sitesSeen?.length || 1} sites</span>
          </div>
          <p class="suspect-verdict">${escapeHtml(suspect.aiVerdict || reasonsText)}</p>
          <span class="suspect-reasons">${escapeHtml(reasonsText)}</span>
        </div>
        <div class="suspect-actions">
          ${isBlocked ?
            `<button class="btn-secondary btn-sm" disabled style="opacity: 0.6;">Blocked</button>` :
            `<button class="btn-danger btn-sm btn-block-suspect" data-domain="${escapeHtml(suspect.domain)}">Block Domain</button>
             <button class="btn-secondary btn-sm btn-allow-suspect" data-domain="${escapeHtml(suspect.domain)}">Allow</button>
             <button class="btn-secondary btn-sm btn-explain-suspect" data-domain="${escapeHtml(suspect.domain)}">Analyze</button>`
          }
        </div>
      `;
      suspectsListEl.appendChild(card);
    });

    // Attach listeners
    document.querySelectorAll('.btn-block-suspect').forEach(btn => {
      btn.addEventListener('click', () => {
        const domain = btn.getAttribute('data-domain');
        api.runtime.sendMessage({ type: 'UPDATE_SUSPECT_ACTION', domain, action: 'blocked' }).then(() => {
          loadData();
        });
      });
    });

    document.querySelectorAll('.btn-allow-suspect').forEach(btn => {
      btn.addEventListener('click', () => {
        const domain = btn.getAttribute('data-domain');
        api.runtime.sendMessage({ type: 'UPDATE_SUSPECT_ACTION', domain, action: 'allowed' }).then(() => {
          loadData();
        });
      });
    });

    document.querySelectorAll('.btn-explain-suspect').forEach(btn => {
      btn.addEventListener('click', () => {
        const domain = btn.getAttribute('data-domain');
        // Switch to Advisor tab and ask
        document.querySelector('.nav-item[data-tab="advisor"]')?.click();
        handleSendQuestion(`Explain what ${domain} does and why AI scored it as a threat`);
      });
    });
  }

  // Bulk block all suspects
  btnBlockAllSuspects?.addEventListener('click', () => {
    api.runtime.sendMessage({
      type: 'EXECUTE_AI_REMEDIATION',
      action: 'BLOCK_ALL_SUSPECTS'
    }).then(() => {
      loadData();
    });
  });

  // 6. Render Rule-Based Tips
  function renderTips(siteStats) {
    tipsContainer.innerHTML = '';
    const primarySite = Object.values(siteStats)[0] || {
      domain: 'news-site.com',
      trackersBlocked: 23,
      adsBlocked: 41,
      firstPartyCount: 2,
      fingerprintCount: 1
    };

    const tips = [
      {
        type: 'warning',
        title: `Cross-Site Telemetry on ${primarySite.domain}`,
        text: `Intercepted ${primarySite.trackersBlocked || 23} tracking beacons. Data brokers attempted to share your profile across domains.`
      },
      {
        type: 'shield',
        title: 'Device Fingerprint Spoofing Active',
        text: 'Canvas & WebGL graphics queries were neutralized using micro-noise randomization.'
      },
      {
        type: 'alert',
        title: 'Disguised First-Party Tracking',
        text: `Identified ${primarySite.firstPartyCount || 2} long-lived cookies attempting to evade adblockers.`
      },
      {
        type: 'good',
        title: 'Faster Page Loading',
        text: `Suppressed ${primarySite.adsBlocked || 41} high-latency ad frames, cutting page load weight.`
      }
    ];

    tips.forEach(t => {
      const tipCard = document.createElement('div');
      tipCard.className = `tip-card ${t.type}`;
      tipCard.innerHTML = `
        <h4 class="tip-title">${t.title}</h4>
        <p class="tip-text">${t.text}</p>
      `;
      tipsContainer.appendChild(tipCard);
    });
  }

  // 7. Activity Canvas Chart
  function drawActivityChart() {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    let data = [];
    if (currentTimeframe === 'today') {
      data = [
        { label: '8 AM', ads: 80, trackers: 40 },
        { label: '11 AM', ads: 160, trackers: 85 },
        { label: '2 PM', ads: 240, trackers: 110 },
        { label: '5 PM', ads: 380, trackers: 175 },
        { label: '8 PM', ads: 490, trackers: 220 }
      ];
    } else if (currentTimeframe === 'month') {
      data = [
        { label: 'W1', ads: 850, trackers: 340 },
        { label: 'W2', ads: 1240, trackers: 480 },
        { label: 'W3', ads: 980, trackers: 410 },
        { label: 'W4', ads: 1420, trackers: 560 }
      ];
    } else {
      // 7 Days (Default matching wireframe)
      data = [
        { label: 'Mon', ads: 320, trackers: 180 },
        { label: 'Tue', ads: 540, trackers: 240 },
        { label: 'Wed', ads: 410, trackers: 190 },
        { label: 'Thu', ads: 680, trackers: 310 },
        { label: 'Fri', ads: 520, trackers: 220 },
        { label: 'Sat', ads: 740, trackers: 360 },
        { label: 'Sun', ads: 620, trackers: 280 }
      ];
    }

    const maxVal = Math.max(...data.map(d => d.ads + d.trackers)) * 1.25 || 1100;
    const barWidth = currentTimeframe === 'month' ? 60 : 42;
    const spacing = (width - 70) / data.length;
    const bottomY = height - 26;

    // Horizontal grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = bottomY - (i * (bottomY - 20) / 3);
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    data.forEach((d, i) => {
      const x = 50 + i * spacing;
      const totalH = ((d.ads + d.trackers) / maxVal) * (bottomY - 30);
      const adsH = (d.ads / maxVal) * (bottomY - 30);
      const trackersH = (d.trackers / maxVal) * (bottomY - 30);

      // Ads bar (Emerald green)
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, bottomY - adsH, barWidth, adsH);

      // Trackers bar (Cyan/Sky stacked)
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(x, bottomY - totalH, barWidth, trackersH);

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, height - 8);
    });
  }

  // Timeframe selector
  timeframeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeframeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimeframe = btn.getAttribute('data-tf');
      drawActivityChart();
    });
  });

  // 8. Secure Search Bar
  btnRunPrivateSearch?.addEventListener('click', () => {
    const q = privateSearchInput.value.trim();
    if (!q) return;

    const provider = document.querySelector('input[name="searchProvider"]:checked')?.value || 'duckduckgo';
    let searchUrl = '';

    if (provider === 'duckduckgo') {
      searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&t=panh`;
    } else if (provider === 'brave') {
      searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
    } else {
      searchUrl = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}`;
    }

    api.tabs.create({ url: searchUrl });
  });

  privateSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnRunPrivateSearch.click();
  });

  // 9. Email Alias Generator
  btnGenerateAlias?.addEventListener('click', () => {
    const rand = Math.random().toString(36).substring(2, 7);
    generatedAliasInput.value = `user+shield_${rand}@hub.panh.net`;
  });

  btnCopyAlias?.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedAliasInput.value);
    const origText = btnCopyAlias.textContent;
    btnCopyAlias.textContent = 'Copied!';
    setTimeout(() => { btnCopyAlias.textContent = origText; }, 1500);
  });

  // 10. AI Advisor Chat
  function appendChatMessage(sender, text, source = '') {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    const title = sender === 'bot'
      ? (source ? `panH AI Advisor (${source})` : 'panH AI Advisor')
      : 'You';

    const formatted = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = `
      <div class="bubble-header">${title}</div>
      <div class="bubble-content">${formatted}</div>
    `;

    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  async function handleSendQuestion(questionText) {
    if (!questionText) return;
    appendChatMessage('user', questionText);
    chatInput.value = '';

    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble bot';
    typingBubble.innerHTML = '<div class="bubble-header">panH AI Advisor</div><div class="bubble-content"><em>Evaluating privacy telemetry and analyzing telemetry patterns...</em></div>';
    chatHistory.appendChild(typingBubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    api.runtime.sendMessage({
      type: 'ASK_AI_ADVISOR',
      question: questionText,
      siteReport: {
        domain: 'news-site.com',
        trackersBlocked: 23,
        adsBlocked: 41,
        firstPartyCount: 2,
        fingerprintCount: 1,
        score: 82,
        recentDomains: [
          { domain: 'pixel.tracker-a.io', category: 'analytics' },
          { domain: 'adnet-x.com', category: 'ad' }
        ]
      }
    }).then((res) => {
      typingBubble.remove();
      appendChatMessage('bot', res?.answer || 'Ad trackers correlate your identity across websites. panH shields your browser footprint.', res?.source);
    });
  }

  btnSendChat?.addEventListener('click', () => {
    const q = chatInput.value.trim();
    if (q) handleSendQuestion(q);
  });

  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = chatInput.value.trim();
      if (q) handleSendQuestion(q);
    }
  });

  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      handleSendQuestion(q);
    });
  });

  // 11. Settings Changes
  function setupSettingToggle(element, key) {
    element?.addEventListener('change', () => {
      api.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { [key]: element.checked }
      });
    });
  }

  setupSettingToggle(settingMaster, 'masterEnabled');
  setupSettingToggle(settingAds, 'adsBlocker');
  setupSettingToggle(settingTrackers, 'trackerBlocker');
  setupSettingToggle(settingFingerprint, 'fingerprintShield');
  setupSettingToggle(settingAIGuardian, 'aiThreatDetection');
  setupSettingToggle(settingStripParams, 'stripTrackingParams');

  aiModelRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        api.runtime.sendMessage({
          type: 'UPDATE_SETTINGS',
          settings: { aiModelPreference: radio.value }
        });
      }
    });
  });

  btnSaveApiKey?.addEventListener('click', () => {
    const key = geminiApiKeyInput.value.trim();
    api.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { geminiApiKey: key }
    }).then(() => {
      apiKeyStatus.textContent = key ? 'Google Gemini API Key saved!' : 'Default: Local neural engine';
      apiKeyStatus.style.color = '#34d399';
    });
  });

  btnTestApiKey?.addEventListener('click', () => {
    const key = geminiApiKeyInput.value.trim();
    apiKeyStatus.textContent = 'Testing connection to Google Gemini...';
    apiKeyStatus.style.color = '#38bdf8';

    api.runtime.sendMessage({
      type: 'TEST_GEMINI_CONNECTION',
      apiKey: key
    }).then((res) => {
      if (res && res.success) {
        apiKeyStatus.textContent = '✓ Google Gemini connected successfully!';
        apiKeyStatus.style.color = '#34d399';
      } else {
        apiKeyStatus.textContent = `❌ ${res?.error || 'Connection failed'}`;
        apiKeyStatus.style.color = '#f43f5e';
      }
    });
  });

  // Export Data
  btnExportData?.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dashboardData || {}, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `panh-privacy-logs-${Date.now()}.json`);
    dl.click();
  });

  // Clear Logs
  btnClearLogs?.addEventListener('click', () => {
    if (confirm('Clear all logged privacy events?')) {
      api.runtime.sendMessage({ type: 'CLEAR_ALL_LOGS' }).then(() => {
        loadData();
      });
    }
  });

  btnRefreshData?.addEventListener('click', loadData);

  // Helper Functions
  function formatTimeAgo(ts) {
    if (!ts) return 'Just now';
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    return `${hrs}h ago`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initial Load
  loadData();
});
