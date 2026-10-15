/**
 * TermsClarity - Storage Manager
 * Safely manages API keys, cache, and user preferences using chrome.storage.local
 */

const TermsStorage = {
  KEYS: {
    API_KEY: 'terms_clarity_gemini_key',
    SELECTED_MODEL: 'terms_clarity_model',
    CACHE: 'terms_clarity_cache',
    LAST_ANALYSIS: 'terms_clarity_last_analysis',
    SETTINGS: 'terms_clarity_settings'
  },

  DEFAULT_MODEL: 'gemini-3.8-flash',

  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.API_KEY], (res) => {
        resolve(res[this.KEYS.API_KEY] || '');
      });
    });
  },

  async setApiKey(apiKey) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.KEYS.API_KEY]: (apiKey || '').trim() }, () => {
        resolve(true);
      });
    });
  },

  async getModel() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.SELECTED_MODEL], (res) => {
        let model = res[this.KEYS.SELECTED_MODEL] || this.DEFAULT_MODEL;
        // Auto-upgrade legacy / deprecated model names
        if (model === 'gemini-2.0-flash' || model === 'gemini-1.5-flash' || model.includes('2.0') || model.includes('1.5')) {
          model = this.DEFAULT_MODEL;
          this.setModel(model);
        }
        resolve(model);
      });
    });
  },

  async setModel(modelName) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.KEYS.SELECTED_MODEL]: modelName }, () => {
        resolve(true);
      });
    });
  },

  async saveCachedAnalysis(url, data) {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.CACHE], (res) => {
        const cache = res[this.KEYS.CACHE] || {};
        // Keep up to 20 most recent analyses
        const keys = Object.keys(cache);
        if (keys.length > 20) {
          delete cache[keys[0]];
        }
        cache[url] = {
          timestamp: Date.now(),
          data: data
        };
        chrome.storage.local.set({ [this.KEYS.CACHE]: cache }, () => {
          resolve(true);
        });
      });
    });
  },

  async getCachedAnalysis(url) {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.CACHE], (res) => {
        const cache = res[this.KEYS.CACHE] || {};
        const item = cache[url];
        // Cache is valid for 24 hours
        if (item && Date.now() - item.timestamp < 24 * 60 * 60 * 1000) {
          resolve(item.data);
        } else {
          resolve(null);
        }
      });
    });
  },

  async clearCache() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.KEYS.CACHE], () => {
        resolve(true);
      });
    });
  }
};

// Export to window for popup script access
if (typeof window !== 'undefined') {
  window.TermsStorage = TermsStorage;
}
