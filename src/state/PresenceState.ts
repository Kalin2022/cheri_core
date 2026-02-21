/**
 * PresenceState - State management for Presence Mode
 * Sprint 20 Phase 2: Presence Mode Implementation
 * 
 * Manages the full-screen presence overlay state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PresenceMode = "off" | "on";

interface PresenceState {
  mode: PresenceMode;
  setMode: (mode: PresenceMode) => void;
  toggle: () => void;
}

/**
 * Toggle presence mode
 */
export const togglePresenceMode = (current: PresenceMode): PresenceMode => {
  return current === "off" ? "on" : "off";
};

/**
 * Presence state store
 */
export const usePresenceStore = create<PresenceState>()(
  persist(
    (set) => ({
      mode: "off",
      setMode: (mode) => set({ mode }),
      toggle: () => set((state) => ({ mode: togglePresenceMode(state.mode) })),
    }),
    {
      name: 'synthisoul-presence-state',
      version: 1,
    }
  )
);

/**
 * Get current presence mode (for non-React contexts)
 * Lazy getter to avoid TDZ issues - wraps store access in try-catch
 */
export const getPresenceMode = (): PresenceMode => {
  try {
    return usePresenceStore.getState().mode;
  } catch (error) {
    console.warn("⚠️ [PresenceState] Failed to get presence mode from store, defaulting to 'off':", error);
    return "off";
  }
};

/**
 * Assert that presence mode can be read (for boot-time validation)
 */
export const assertPresenceModeInitialized = (): boolean => {
  try {
    const mode = usePresenceStore.getState().mode;
    console.log(`✅ [PresenceState] Presence mode initialized: ${mode}`);
    return true;
  } catch (error) {
    console.error("❌ [PresenceState] Presence mode NOT initialized:", error);
    return false;
  }
};

/**
 * Get presence emotional effect based on mode and climate
 * Sprint 20 Phase 3: Runtime state linking emotionalClimate & presenceMode
 */
export const getPresenceEmotionalEffect = (): number => {
  const mode = usePresenceStore.getState().mode;
  if (mode === "off") return 0;

  try {
    const { getClimateSnapshot } = require("../../synthisoul_core/emotional_climate/EmotionalClimateIntegration");
    const climate = getClimateSnapshot();
    const weather = climate?.weather || "CLEAR";

    if (weather === "BRIGHT") {
      return +0.1;
    } else if (weather === "STORM") {
      return -0.15;
    } else {
      return +0.02;
    }
  } catch {
    // Fallback if climate not available
    return mode === "on" ? +0.02 : 0;
  }
};

