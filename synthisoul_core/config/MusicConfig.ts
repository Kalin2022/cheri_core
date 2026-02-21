// synthisoul_core/config/MusicConfig.ts
/**
 * Music Configuration Loader
 * 
 * Loads music provider priority and settings from music_config.json
 */

export interface MusicConfig {
  musicProviders: string[]; // Priority order: ["system_media", "spotify"]
  playlistCache: {
    enabled: boolean;
    maxCached: number;
    cacheKeyComponents: string[];
  };
  governance: {
    requireConfirmation: boolean;
    autoApproveMusicControls: boolean;
  };
}

const DEFAULT_CONFIG: MusicConfig = {
  musicProviders: ["system_media", "local"], // Safe defaults: system media + local player (no external dependencies)
  playlistCache: {
    enabled: true,
    maxCached: 10,
    cacheKeyComponents: ["mood", "day", "traitHash"],
  },
  governance: {
    requireConfirmation: false,
    autoApproveMusicControls: true,
  },
};

let cachedConfig: MusicConfig | null = null;

export const MusicConfig = {
  /**
   * Load music configuration
   * Falls back to defaults if file not found or invalid
   */
  load(): MusicConfig {
    if (cachedConfig) {
      return cachedConfig;
    }

    try {
      // Try to load from JSON file (in browser, this would need to be fetched)
      // For now, use localStorage as fallback or load from import
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = localStorage.getItem("synthisoul_music_config");
        if (stored) {
          const parsed = JSON.parse(stored);
          cachedConfig = { ...DEFAULT_CONFIG, ...parsed };
          return cachedConfig;
        }
      }

      // In Node/Electron, could use fs.readFileSync
      // For now, return defaults
      cachedConfig = DEFAULT_CONFIG;
      return cachedConfig;
    } catch (error) {
      console.warn("[MusicConfig] Failed to load config, using defaults:", error);
      cachedConfig = DEFAULT_CONFIG;
      return cachedConfig;
    }
  },

  /**
   * Save music configuration to localStorage
   */
  save(config: Partial<MusicConfig>): void {
    try {
      const current = this.load();
      const updated = { ...current, ...config };
      cachedConfig = updated;
      
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("synthisoul_music_config", JSON.stringify(updated));
      }
    } catch (error) {
      console.warn("[MusicConfig] Failed to save config:", error);
    }
  },

  /**
   * Get provider priority list
   */
  getProviderPriority(): string[] {
    return this.load().musicProviders;
  },

  /**
   * Reset to defaults
   */
  reset(): void {
    cachedConfig = null;
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("synthisoul_music_config");
    }
  },
};

