/**
 * panH - Fingerprint Shield (Multi-Vector Protection)
 * Spoofs and introduces non-deterministic micro-noise into Canvas, WebGL,
 * AudioContext, Font enumeration, and Hardware attributes.
 * Runs in MAIN execution world across all browsers.
 */

(function () {
  'use strict';

  if (window.__panH_fingerprint_shield_active__) return;
  window.__panH_fingerprint_shield_active__ = true;

  function notifyFingerprintProbe(probeType) {
    try {
      window.dispatchEvent(new CustomEvent('__panH_probe_detected__', {
        detail: {
          probeType,
          siteDomain: window.location.hostname,
          timestamp: Date.now()
        }
      }));
    } catch (e) {}
  }

  // 1. Canvas Pixel Readout Protection (Micro-Noise Injection)
  try {
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type) {
      if (this.width > 16 && this.height > 16) {
        notifyFingerprintProbe('canvas');
        try {
          const ctx = this.getContext('2d');
          if (ctx) {
            // Apply imperceptible micro-noise to alter hash without visual degradation
            const imgData = ctx.getImageData(0, 0, 1, 1);
            imgData.data[0] = (imgData.data[0] + 1) % 256;
            ctx.putImageData(imgData, 0, 0);
          }
        } catch (e) {}
      }
      return origToDataURL.apply(this, arguments);
    };

    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (sx, sy, sw, sh) {
      const res = origGetImageData.apply(this, arguments);
      if (sw > 16 && sh > 16) {
        notifyFingerprintProbe('canvas');
        if (res && res.data && res.data.length > 4) {
          // Cryptographic micro-noise on last pixel channel
          const idx = res.data.length - 4;
          res.data[idx] = (res.data[idx] ^ 1);
        }
      }
      return res;
    };

    // 2. Font Probing Protection via measureText Jitter
    const origMeasureText = CanvasRenderingContext2D.prototype.measureText;
    CanvasRenderingContext2D.prototype.measureText = function (text) {
      const metrics = origMeasureText.apply(this, arguments);
      if (metrics && typeof metrics.width === 'number') {
        const jitter = (Math.random() - 0.5) * 0.0001;
        // Return proxy to apply tiny imperceptible sub-pixel jitter
        return new Proxy(metrics, {
          get(target, prop) {
            if (prop === 'width') return target.width + jitter;
            return target[prop];
          }
        });
      }
      return metrics;
    };
  } catch (err) {
    console.debug('[panH Shield] Canvas shield init error:', err);
  }

  // 3. WebGL GPU Hardware Masking
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
    console.debug('[panH Shield] WebGL shield init error:', err);
  }

  // 4. AudioContext Fingerprint Protection
  try {
    if (window.AudioBuffer) {
      const origGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function () {
        const res = origGetChannelData.apply(this, arguments);
        if (res && res.length > 100) {
          notifyFingerprintProbe('audio');
          // Add negligible audio jitter (inaudible, destroys hash)
          res[0] += (Math.random() - 0.5) * 0.000001;
        }
        return res;
      };
    }
  } catch (err) {
    console.debug('[panH Shield] Audio shield init error:', err);
  }

  // 5. Hardware Attribute Normalization
  try {
    Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
    Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
  } catch (e) {}

  console.log('[panH Shield] Multi-Vector Fingerprint Shield Active on', window.location.hostname);
})();
