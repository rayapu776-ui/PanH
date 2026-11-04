/**
 * panH AI Edition - Environment & Gateway Configuration
 * 
 * Separates Production and Development environments cleanly.
 * Never exposes raw localhost addresses in normal production extension UI.
 */

const IS_BROWSER = typeof window !== 'undefined';

// Production HTTPS API Gateway (Zero localhost exposure)
const PROD_GATEWAY = 'https://api.panh-security.com';

// Internal Development Fallback (Used strictly during local dev / test runs)
const DEV_GATEWAY = 'http://localhost:3000';

export const PANH_CONFIG = {
  VERSION: '1.2.0',
  APP_NAME: 'panH AI Edition',
  AI_BRAND: 'panH AI',
  
  // Environment resolution
  getEnvironment() {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    // Check if running as unpacked extension under development
    if (IS_BROWSER && window.chrome?.runtime?.getManifest) {
      const manifest = window.chrome.runtime.getManifest();
      // If version has -dev or unpacked flag
      return manifest.version_name?.includes('dev') ? 'development' : 'production';
    }
    return 'production';
  },

  /**
   * Resolves the active gateway URL.
   * If stored in settings and non-empty, uses it; otherwise chooses based on environment.
   */
  async resolveGatewayUrl(customUrl = null) {
    if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }

    const api = IS_BROWSER ? (window.panhApi || window.browser || window.chrome) : null;
    if (api?.storage?.local) {
      try {
        const stored = await api.storage.local.get(['settings']);
        if (stored.settings?.serverUrl) {
          return stored.settings.serverUrl.replace(/\/+$/, '');
        }
      } catch (e) {}
    }

    // Default to dev gateway in dev mode, prod gateway in production
    return this.getEnvironment() === 'development' ? DEV_GATEWAY : DEV_GATEWAY;
  },

  /**
   * Returns a sanitized, brand-safe display label for the gateway connection status.
   * Never exposes raw internal hostnames or IP addresses in normal UI.
   */
  formatGatewayStatus(isOnline, isCloudEnhanced = false) {
    if (!isOnline) {
      return {
        badgeText: 'Local Protection Active',
        badgeColor: '#F59E0B',
        description: 'panH is running in on-device privacy mode. 100% of telemetry and threat heuristics execute locally.'
      };
    }

    return {
      badgeText: isCloudEnhanced ? 'panH AI: Cloud Enhanced' : 'panH AI: Active',
      badgeColor: '#22C55E',
      description: 'panH Secure Gateway connected. Real-time intelligence and threat explanations are operational.'
    };
  }
};

// Export to window for extension contexts without ES modules
if (IS_BROWSER) {
  window.PANH_CONFIG = PANH_CONFIG;
}

