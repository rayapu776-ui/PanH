/**
 * panH - Universal Cross-Browser Polyfill Layer
 * Ensures seamless compatibility across Chrome, Edge, Firefox, Brave, Opera, and Vivaldi
 * on Windows, macOS, and Linux.
 */

(function (global) {
  'use strict';

  // Determine standard browser API object
  const hasBrowser = typeof browser !== 'undefined' && browser.runtime;
  const hasChrome = typeof chrome !== 'undefined' && chrome.runtime;

  const rawApi = hasBrowser ? browser : (hasChrome ? chrome : {});

  // Create unified Promise-based / callback-compatible wrapper
  const panhBrowser = {
    // Runtime API
    runtime: {
      get id() { return rawApi.runtime?.id; },
      getURL: (path) => rawApi.runtime?.getURL ? rawApi.runtime.getURL(path) : path,
      sendMessage: (message, options) => {
        return new Promise((resolve, reject) => {
          try {
            if (rawApi.runtime?.sendMessage) {
              rawApi.runtime.sendMessage(message, options, (res) => {
                const err = rawApi.runtime.lastError;
                if (err) {
                  // Resolve safely to avoid unhandled rejections for closed ports
                  resolve({ error: err.message });
                } else {
                  resolve(res);
                }
              });
            } else {
              resolve({ error: 'Runtime API unavailable' });
            }
          } catch (e) {
            resolve({ error: e.message });
          }
        });
      },
      onMessage: rawApi.runtime?.onMessage || { addListener: () => {} },
      onInstalled: rawApi.runtime?.onInstalled || { addListener: () => {} }
    },

    // Storage API (Promise wrapped for local storage)
    storage: {
      local: {
        get: (keys) => {
          return new Promise((resolve) => {
            try {
              if (rawApi.storage?.local?.get) {
                rawApi.storage.local.get(keys, (res) => {
                  resolve(res || {});
                });
              } else {
                resolve({});
              }
            } catch (e) {
              resolve({});
            }
          });
        },
        set: (items) => {
          return new Promise((resolve) => {
            try {
              if (rawApi.storage?.local?.set) {
                rawApi.storage.local.set(items, () => {
                  resolve();
                });
              } else {
                resolve();
              }
            } catch (e) {
              resolve();
            }
          });
        },
        remove: (keys) => {
          return new Promise((resolve) => {
            try {
              if (rawApi.storage?.local?.remove) {
                rawApi.storage.local.remove(keys, () => resolve());
              } else {
                resolve();
              }
            } catch (e) {
              resolve();
            }
          });
        },
        clear: () => {
          return new Promise((resolve) => {
            try {
              if (rawApi.storage?.local?.clear) {
                rawApi.storage.local.clear(() => resolve());
              } else {
                resolve();
              }
            } catch (e) {
              resolve();
            }
          });
        }
      }
    },

    // Tabs API
    tabs: {
      query: (queryInfo) => {
        return new Promise((resolve) => {
          try {
            if (rawApi.tabs?.query) {
              rawApi.tabs.query(queryInfo, (tabs) => resolve(tabs || []));
            } else {
              resolve([]);
            }
          } catch (e) {
            resolve([]);
          }
        });
      },
      create: (createProperties) => {
        return new Promise((resolve) => {
          try {
            if (rawApi.tabs?.create) {
              rawApi.tabs.create(createProperties, (tab) => resolve(tab));
            } else {
              if (typeof window !== 'undefined') window.open(createProperties.url, '_blank');
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      },
      update: (tabId, updateProperties) => {
        return new Promise((resolve) => {
          try {
            if (rawApi.tabs?.update) {
              rawApi.tabs.update(tabId, updateProperties, (tab) => resolve(tab));
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      }
    },

    // DeclarativeNetRequest API
    declarativeNetRequest: rawApi.declarativeNetRequest || null,

    // WebNavigation API
    webNavigation: rawApi.webNavigation || null,

    // ContextMenus API
    contextMenus: rawApi.contextMenus || null,

    // Alarms API
    alarms: rawApi.alarms || null,

    // Helper to detect current browser platform
    getBrowserInfo: () => {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      if (/Edg\//.test(ua)) return { name: 'Microsoft Edge', engine: 'Chromium' };
      if (/Firefox\//.test(ua)) return { name: 'Mozilla Firefox', engine: 'Gecko' };
      if (/Brave\//.test(ua) || (navigator.brave && navigator.brave.isBrave)) return { name: 'Brave', engine: 'Chromium' };
      if (/OPR\//.test(ua) || /Opera/.test(ua)) return { name: 'Opera', engine: 'Chromium' };
      if (/Chrome\//.test(ua)) return { name: 'Google Chrome', engine: 'Chromium' };
      if (/Safari\//.test(ua)) return { name: 'Apple Safari', engine: 'WebKit' };
      return { name: 'Standard WebExtension Browser', engine: 'Universal' };
    }
  };

  // Export to global scope
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = panhBrowser;
  }
  global.panhApi = panhBrowser;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
