/**
 * panH - First-Party Tracking & CNAME Cloaking Detector
 * Inspects first-party cookies for high-entropy persistent IDs
 * and bridges fingerprint probe events to the background privacy engine.
 */

(function () {
  'use strict';

  const api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

  const SUSPICIOUS_COOKIE_NAMES = [
    '_ga', '_gid', '_fbp', '_fbc', 'ajs_user_id', 'ajs_anonymous_id',
    'amplitude_id', 'mp_', 'mixpanel', 'hubspotutk', '__hstc',
    'intercom-id', 'drift_aid', '_clck', '_clsk', 'uid', 'uuid',
    'visitor_id', 'device_id', 'user_token'
  ];

  const ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const HIGH_ENTROPY_HEX = /^[0-9a-f]{24,}$/i;

  function inspectFirstPartyCookies() {
    try {
      const rawCookies = document.cookie || '';
      if (!rawCookies) return;

      const pairs = rawCookies.split(';');

      for (const pair of pairs) {
        const parts = pair.trim().split('=');
        if (parts.length < 2) continue;
        const name = parts[0].trim();
        const val = parts.slice(1).join('=').trim();

        let isTracker = false;
        let detail = '';

        for (const suspect of SUSPICIOUS_COOKIE_NAMES) {
          if (name.toLowerCase().startsWith(suspect)) {
            isTracker = true;
            detail = `Matches known telemetry identifier '${name}'`;
            break;
          }
        }

        if (!isTracker && (ID_REGEX.test(val) || HIGH_ENTROPY_HEX.test(val))) {
          isTracker = true;
          detail = `High-entropy persistent UUID token in '${name}'`;
        }

        if (isTracker) {
          try {
            api.runtime?.sendMessage?.({
              type: 'REPORT_FIRST_PARTY_TRACKER',
              cookieName: name,
              details: detail,
              siteDomain: window.location.hostname
            });
          } catch (e) {}
        }
      }
    } catch (err) {
      console.debug('[panH] First-party detector check error:', err);
    }
  }

  // Listen for fingerprint probe notifications dispatched from MAIN world script
  window.addEventListener('__panH_probe_detected__', (e) => {
    try {
      api.runtime?.sendMessage?.({
        type: 'REPORT_FINGERPRINT_PROBE',
        probeType: e.detail?.probeType || 'canvas',
        siteDomain: window.location.hostname
      });
    } catch (err) {}
  });

  // Check on idle
  setTimeout(inspectFirstPartyCookies, 1500);
})();
