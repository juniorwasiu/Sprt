/**
 * SPRT App Configuration & State Manager
 * Handles real-time mode switching between "Continue to Download" and "App Task Guide"
 */

const DEFAULT_CONFIG = {
  mode: "download", // 'download' | 'task'
  downloadUrl: "https://phygitals.onelink.me/1HmK/o45tvhth",
  referralCode: "e406a482d8da",
  autoRedirect: false,
  autoRedirectSeconds: 3,
  taskTitle: "App Registration Task",
  taskSubtitle: "Follow the steps in order. Earn a $1 bonus.",
  vpnWarning: "This task must be done from the USA or Germany. If you are not in one of these countries, turn on a VPN and connect to a USA or Germany server before you start. Keep the VPN on until the task is finished.",
  adminPin: "admin123",
  updatedAt: Date.now()
};

const STORAGE_KEY = "sprt_site_config_v2";
// Using a reliable distributed KV endpoint for realtime multi-device sync
const CLOUD_KV_BUCKET = "sprt_app_config_live";
const CLOUD_KV_URL = `https://kvdb.io/4yHhQ7X8G1c8g5j3L9m2Qk/${CLOUD_KV_BUCKET}`;

class AppConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.listeners = [];
  }

  // Check URL query parameters for test overrides (e.g. ?mode=download or ?mode=task)
  getUrlOverride() {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode === "download" || mode === "task") {
        return { mode };
      }
    } catch (e) {
      console.warn("Could not parse URL params", e);
    }
    return null;
  }

  // Load configuration with hierarchy: URL param > Cloud KV > LocalStorage > config.json > DEFAULT
  async loadConfig() {
    let loaded = null;

    // 1. Try LocalStorage for instant render without network lag
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        loaded = { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
        this.config = loaded;
      }
    } catch (e) {
      console.warn("LocalStorage read error", e);
    }

    // 2. Try fetching static config.json with cache buster
    try {
      const res = await fetch(`./config.json?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const fileConfig = await res.json();
        // If fileConfig is newer than cached or cached is absent
        if (!loaded || (fileConfig.updatedAt && (!loaded.updatedAt || fileConfig.updatedAt >= loaded.updatedAt))) {
          this.config = { ...this.config, ...fileConfig };
          loaded = this.config;
          this.saveToLocalStorage(this.config);
        }
      }
    } catch (e) {
      // Fallback silently if offline / local file
    }

    // 3. Try fetching from Cloud KV with short timeout (800ms) for real-time sync across devices
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 900);
      const kvRes = await fetch(CLOUD_KV_URL, {
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      clearTimeout(timeoutId);
      if (kvRes.ok) {
        const cloudData = await kvRes.json();
        if (cloudData && cloudData.mode) {
          if (!loaded || (cloudData.updatedAt && (!loaded.updatedAt || cloudData.updatedAt >= loaded.updatedAt))) {
            this.config = { ...this.config, ...cloudData };
            this.saveToLocalStorage(this.config);
          }
        }
      }
    } catch (e) {
      // Offline or blocked, fallback gracefully
    }

    // 4. Apply URL override if present
    const urlOverride = this.getUrlOverride();
    if (urlOverride) {
      this.config = { ...this.config, ...urlOverride };
    }

    this.notifyListeners();
    return this.config;
  }

  // Save updated config locally and sync to Cloud KV
  async saveConfig(newConfigUpdates) {
    this.config = {
      ...this.config,
      ...newConfigUpdates,
      updatedAt: Date.now()
    };

    // Save to localStorage
    this.saveToLocalStorage(this.config);

    // Sync to Cloud KV
    let cloudSaved = false;
    try {
      const res = await fetch(CLOUD_KV_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.config)
      });
      if (res.ok) {
        cloudSaved = true;
      }
    } catch (e) {
      console.warn("Cloud sync error:", e);
    }

    this.notifyListeners();
    return { success: true, cloudSaved, config: this.config };
  }

  saveToLocalStorage(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn("LocalStorage save error", e);
    }
  }

  getConfig() {
    return { ...this.config };
  }

  onConfigChange(callback) {
    this.listeners.push(callback);
    // Trigger immediately with current state
    callback(this.config);
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.config);
      } catch (e) {
        console.error("Listener error", e);
      }
    }
  }
}

// Global instance
window.appConfig = new AppConfigManager();
