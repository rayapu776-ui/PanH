/**
 * panH - Secure Search Safety Layer Content Script
 * Implements Section 2.5 of panH AI Edition Blueprint:
 * - Operates over supported search-result pages (Google, Bing, DuckDuckGo, Brave, Startpage)
 * - Annotates search results with non-intrusive risk badges
 * - Strips commercial tracking parameters from outbound result links
 * - Never sends search query text to any backend service
 */

(function () {
  'use strict';

  const api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

  // Tracking query parameters to strip
  const TRACKING_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
    'gclid', 'fbclid', 'msclkid', 'mc_eid', 'dclid', '_hsenc', '_hsmi', 'vero_id', 'yclid', 'ttclid'
  ];

  function stripTrackingParamsFromUrl(rawUrl) {
    try {
      const u = new URL(rawUrl);
      let changed = false;
      for (const p of TRACKING_PARAMS) {
        if (u.searchParams.has(p)) {
          u.searchParams.delete(p);
          changed = true;
        }
      }
      return changed ? u.toString() : rawUrl;
    } catch (e) {
      return rawUrl;
    }
  }

  // Scan and annotate search result links
  function annotateSearchResults() {
    try {
      // Common search result link selectors across search engines
      const candidateLinks = document.querySelectorAll(
        '#search a[href^="http"], .results a[href^="http"], #rso a[href^="http"], .b_algo a[href^="http"], .snippet a[href^="http"]'
      );

      candidateLinks.forEach(link => {
        if (link.getAttribute('data-panh-inspected')) return;
        link.setAttribute('data-panh-inspected', 'true');

        const href = link.href;
        if (!href || href.startsWith('javascript:') || href.includes(window.location.hostname)) return;

        // Clean link href of tracking params immediately
        link.href = stripTrackingParamsFromUrl(href);

        let destDomain = '';
        try {
          destDomain = new URL(link.href).hostname;
        } catch (e) {
          return;
        }

        // Request assessment from Threat Guardian (local cache/heuristics)
        api.runtime?.sendMessage?.({
          type: 'ASSESS_URL',
          url: link.href
        }, (res) => {
          if (!res || !res.verdict) return;

          // Create badge
          const badge = document.createElement('span');
          badge.className = 'panh-search-badge';
          badge.style.display = 'inline-flex';
          badge.style.alignItems = 'center';
          badge.style.gap = '3px';
          badge.style.fontSize = '10px';
          badge.style.fontWeight = '700';
          badge.style.padding = '1px 5px';
          badge.style.borderRadius = '4px';
          badge.style.marginLeft = '6px';
          badge.style.verticalAlign = 'middle';
          badge.style.cursor = 'help';
          badge.setAttribute('title', `panH Threat Guardian: ${res.reasons ? res.reasons.join('; ') : res.verdict}`);

          if (res.verdict === 'malicious') {
            badge.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            badge.style.color = '#ef4444';
            badge.style.border = '1px solid rgba(239, 68, 68, 0.4)';
            badge.textContent = '⚠ panH Danger';
          } else if (res.verdict === 'suspicious') {
            badge.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
            badge.style.color = '#f59e0b';
            badge.style.border = '1px solid rgba(245, 158, 11, 0.4)';
            badge.textContent = '⚡ panH Caution';
          } else {
            badge.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
            badge.style.color = '#22c55e';
            badge.style.border = '1px solid rgba(34, 197, 94, 0.3)';
            badge.textContent = '✓ panH Safe';
          }

          // Insert next to title if possible
          const header = link.querySelector('h3, h2, .title');
          if (header) {
            header.appendChild(badge);
          } else if (link.parentElement) {
            link.parentElement.appendChild(badge);
          }
        });
      });
    } catch (err) {
      console.debug('[panH Secure Search] Observation error:', err);
    }
  }

  // Run on initial load and on DOM mutation
  setTimeout(annotateSearchResults, 1000);
  const observer = new MutationObserver(() => {
    annotateSearchResults();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      annotateSearchResults();
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();

