/**
 * panH - Email Privacy Content Script
 * Blocks 1x1 hidden spy tracking pixels and strips tracked links in webmail.
 */

(function () {
  'use strict';

  const EMAIL_TRACKER_HOSTS = [
    'mandrillapp.com', 'sendgrid.net', 'mailchimp.com', 'yesware.com',
    'mixmax.com', 'streak.com', 'superhuman.com', 'bananatag.com',
    'mailtrack.io', 'salesloft.com', 'hubspot.com/email-tracking',
    'constantcontact.com', 'activecampaign.com', 'customer.io',
    'getsignals.com', 'cirrusinsight.com'
  ];

  const api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

  function cleanEmailTrackingPixels() {
    try {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.getAttribute('data-panh-checked')) return;
        img.setAttribute('data-panh-checked', 'true');

        const src = (img.src || '').toLowerCase();
        const width = img.width || parseInt(img.getAttribute('width') || '0', 10);
        const height = img.height || parseInt(img.getAttribute('height') || '0', 10);

        let isSpyPixel = false;
        let trackerDomain = '';

        // Check dimensions (1x1 or 0x0 invisible beacons)
        if ((width === 1 && height === 1) || (width === 0 && height === 0)) {
          isSpyPixel = true;
          try {
            trackerDomain = new URL(src).hostname;
          } catch (e) {
            trackerDomain = 'hidden-pixel';
          }
        }

        // Check domain against known email telemetry networks
        if (!isSpyPixel) {
          for (const host of EMAIL_TRACKER_HOSTS) {
            if (src.includes(host)) {
              isSpyPixel = true;
              trackerDomain = host;
              break;
            }
          }
        }

        if (isSpyPixel) {
          console.log('[panH Email Privacy] Blocked spy pixel:', trackerDomain, src);
          img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Safe transparent 1px
          img.style.setProperty('display', 'none', 'important');
          
          try {
            api.runtime?.sendMessage?.({
              type: 'REPORT_EMAIL_TRACKER',
              domain: trackerDomain
            });
          } catch (e) {}
        }
      });

      // Unwrap tracking redirect links
      const links = document.querySelectorAll('a[href*="/track/"], a[href*="mandrillapp"], a[href*="sendgrid"]');
      links.forEach(a => {
        try {
          const u = new URL(a.href);
          const target = u.searchParams.get('url') || u.searchParams.get('target') || u.searchParams.get('redirect');
          if (target && target.startsWith('http')) {
            a.href = decodeURIComponent(target);
            a.setAttribute('title', 'panH: Tracking redirect bypassed');
          }
        } catch (e) {}
      });
    } catch (err) {
      console.debug('[panH] Email privacy observer error:', err);
    }
  }

  setInterval(cleanEmailTrackingPixels, 2000);
})();

