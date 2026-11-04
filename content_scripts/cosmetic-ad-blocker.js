/**
 * panH - Cosmetic Ad Blocker
 * Cleans up leftover blank ad frames, sponsored banners, and ad containers.
 */

(function () {
  'use strict';

  const AD_SELECTORS = [
    'ins.adsbygoogle',
    'div[id*="google_ads"]',
    'div[id*="dfp-ad"]',
    'div[id*="gpt-ad"]',
    'div[class*="ad-container"]',
    'div[class*="ad-slot"]',
    'div[class*="ad-banner"]',
    'div[class*="banner-ad"]',
    'div[class*="sponsored-post"]',
    'div[class*="promoted-tweet"]',
    'div[class*="sponsor-box"]',
    'div[class*="ad-placeholder"]',
    'div[class*="ad_wrapper"]',
    'div[class*="ad-wrapper"]',
    'div[id*="taboola-"]',
    'div[id*="outbrain-"]',
    'div[id*="rc-widget"]',
    'div[data-ad-unit]',
    'div[data-ad-name]',
    'div[data-ad-client]',
    'aside[class*="ad-"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="adnxs"]',
    'iframe[src*="criteo"]',
    'iframe[id*="google_ads"]',
    'iframe[src*="amazon-adsystem"]'
  ];

  function hideAdElements() {
    try {
      const combined = AD_SELECTORS.join(', ');
      const elements = document.querySelectorAll(combined);
      elements.forEach(el => {
        if (el && el.style && el.style.display !== 'none') {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('height', '0px', 'important');
          el.setAttribute('data-panh-hidden', 'true');
        }
      });
    } catch (e) {}
  }

  // Initial pass on document load
  hideAdElements();

  // Dynamic pass with MutationObserver for dynamically injected ads
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }
    if (shouldCheck) {
      hideAdElements();
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      hideAdElements();
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
  }
})();

