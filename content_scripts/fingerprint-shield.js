/**
 * panH - Fingerprint Shield Content Script
 * Spoofs and limits Canvas, WebGL, AudioContext, and Screen attributes
 * to prevent websites from constructing a unique device fingerprint.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__panH_fingerprint_shield_active__) return;
  window.__panH_fingerprint_shield_active__ = true;

  function notifyFingerprintProbe(probeType) {
    try {
      // Send custom event to isolated content script bridge or extension
      window.dispatchEvent(new CustomEvent('__panH_probe_detected__', {
        detail: { probeType, siteDomain: window.location.hostname }
      }));
    } catch (e) {}
  }

  // 1. Canvas Fingerprint Protection
  try {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type) {
      if (this.width > 16 && this.height > 16) {
        notifyFingerprintProbe('canvas');
        try {
          const ctx = this.getContext('2d');
          if (ctx) {
            // Apply imperceptible 1-pixel micro-noise to alter hash
            const imgData = ctx.getImageData(0, 0, 1, 1);
            imgData.data[0] = (imgData.data[0] + 1) % 256;
            ctx.putImageData(imgData, 0, 0);
          }
        } catch (e) {}
      }
      return originalToDataURL.apply(this, arguments);
    };

    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (sx, sy, sw, sh) {
      const res = originalGetImageData.apply(this, arguments);
      if (sw > 16 && sh > 16) {
        notifyFingerprintProbe('canvas');
        if (res && res.data && res.data.length > 4) {
          // Micro-noise on last pixel to randomize hash across sessions
          const idx = res.data.length - 4;
          res.data[idx] = (res.data[idx] ^ 1);
        }
      }
      return res;
    };
  } catch (err) {
    console.debug('[panH] Canvas shield init error:', err);
  }

  // 2. WebGL Fingerprint Protection (Mask GPU Vendor & Renderer)
  try {
    const spoofWebGL = function (proto) {
      if (!proto) return;
      const origGetParam = proto.getParameter;
      proto.getParameter = function (parameter) {
        // UNMASKED_VENDOR_WEBGL = 37445
        if (parameter === 37445) {
          notifyFingerprintProbe('webgl');
          return 'Google Inc. (NVIDIA)';
        }
        // UNMASKED_RENDERER_WEBGL = 37446
        if (parameter === 37446) {
          notifyFingerprintProbe('webgl');
          return 'ANGLE (NVIDIA, NVIDIA GeForce RTX Direct3D11 vs_5_0 ps_5_0)';
        }
        return origGetParam.apply(this, arguments);
      };
    };

    if (window.WebGLRenderingContext) spoofWebGL(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) spoofWebGL(WebGL2RenderingContext.prototype);
  } catch (err) {
    console.debug('[panH] WebGL shield init error:', err);
  }

  // 3. AudioContext Fingerprint Protection
  try {
    if (window.AudioBuffer) {
      const origGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function () {
        const res = origGetChannelData.apply(this, arguments);
        if (res && res.length > 100) {
          notifyFingerprintProbe('audio');
          // Add negligible micro-noise to defeat audio fingerprinting
          res[0] += (Math.random() - 0.5) * 0.000001;
        }
        return res;
      };
    }
  } catch (err) {
    console.debug('[panH] Audio shield init error:', err);
  }

  // 4. Bridge event listener to chrome.runtime
  window.addEventListener('__panH_probe_detected__', (e) => {
    try {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'REPORT_FINGERPRINT_PROBE',
          probeType: e.detail?.probeType || 'canvas',
          siteDomain: window.location.hostname
        });
      }
    } catch (err) {}
  });

  console.log('[panH] Fingerprint Shield active on', window.location.hostname);
})();
