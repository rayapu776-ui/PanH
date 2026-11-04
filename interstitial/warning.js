/**
 * panH - Warning Interstitial Controller
 * Implements Section 2.3, 4.5, 4.6 (User override with explicit confirmation)
 */

document.addEventListener('DOMContentLoaded', () => {
  const api = window.panhApi || (typeof browser !== 'undefined' ? browser : chrome);

  const targetUrlEl = document.getElementById('targetUrl');
  const warningTitleEl = document.getElementById('warningTitle');
  const riskBadgeEl = document.getElementById('riskBadge');
  const confidenceBadgeEl = document.getElementById('confidenceBadge');
  const reasonsListEl = document.getElementById('reasonsList');
  const btnBackToSafety = document.getElementById('btnBackToSafety');
  const btnToggleDetails = document.getElementById('btnToggleDetails');
  const overridePanel = document.getElementById('overridePanel');
  const btnProceedAnyway = document.getElementById('btnProceedAnyway');
  const btnAllowListSite = document.getElementById('btnAllowListSite');

  // Parse URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url') || 'https://unknown-suspicious-domain.com';
  const riskLevel = urlParams.get('risk') || 'high';
  const confidenceVal = parseFloat(urlParams.get('confidence') || '0.95');
  const reasonsParam = urlParams.get('reasons');

  let parsedReasons = [];
  try {
    parsedReasons = reasonsParam ? JSON.parse(decodeURIComponent(reasonsParam)) : [];
  } catch (e) {
    parsedReasons = [decodeURIComponent(reasonsParam || 'Flagged for deceptive characteristics')];
  }

  // Populate UI
  targetUrlEl.textContent = targetUrl;
  confidenceBadgeEl.textContent = `${Math.round(confidenceVal * 100)}% Confidence`;

  if (riskLevel === 'high') {
    riskBadgeEl.textContent = 'High Danger';
    riskBadgeEl.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
    riskBadgeEl.style.color = '#fca5a5';
    warningTitleEl.textContent = 'Deceptive or Malicious Site Blocked';
  } else {
    riskBadgeEl.textContent = 'Suspicious Site';
    riskBadgeEl.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
    riskBadgeEl.style.color = '#fcd34d';
    warningTitleEl.textContent = 'Caution: Suspicious Link Ahead';
  }

  if (parsedReasons.length > 0) {
    reasonsListEl.innerHTML = '';
    parsedReasons.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      reasonsListEl.appendChild(li);
    });
  }

  // Return to Safety
  btnBackToSafety.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'about:blank';
    }
  });

  // Toggle Details / Override Panel
  btnToggleDetails.addEventListener('click', () => {
    const isHidden = overridePanel.style.display === 'none';
    overridePanel.style.display = isHidden ? 'flex' : 'none';
    btnToggleDetails.textContent = isHidden ? 'Hide Threat Details' : 'Show Threat Details';
  });

  // Proceed Anyway (Section 4.5 & 4.6: Never trap user in infinite loop)
  btnProceedAnyway.addEventListener('click', () => {
    try {
      const hostname = new URL(targetUrl).hostname;
      api.runtime.sendMessage({
        type: 'ALLOW_SESSION_OVERRIDE',
        domain: hostname
      }).then(() => {
        window.location.href = targetUrl;
      }).catch(() => {
        window.location.href = targetUrl;
      });
    } catch (e) {
      window.location.href = targetUrl;
    }
  });

  // Add Domain to Site Allow-List
  btnAllowListSite.addEventListener('click', () => {
    try {
      const hostname = new URL(targetUrl).hostname;
      api.runtime.sendMessage({
        type: 'ADD_SITE_ALLOWLIST',
        domain: hostname
      }).then(() => {
        btnAllowListSite.textContent = '✓ Added to Allow-List';
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 1000);
      });
    } catch (e) {
      alert('Unable to parse domain to allow-list.');
    }
  });
});

