// synthisoul_core/governance/MusicActionLogViewer.ts
/**
 * Music Action Log Viewer
 * 
 * Provides access to last N music actions for DevTools debugging.
 * Turns "it doesn't work" into "it was denied because confirmation=false."
 */

import { HostSafeTelemetry } from "../telemetry/HostSafeTelemetry";

export interface ProviderSelectionTrace {
  providerId: string;
  considered: boolean;
  available: boolean;
  skipped?: boolean;
  skipReason?: "missing_capability" | "not_available" | "denied" | "error";
  selected?: boolean;
  capabilities?: any;
}

export interface MusicActionLogEntry {
  timestamp: number;
  action: string;
  providerId: string;
  hostInitiated: boolean;
  confirmationStatus: "approved" | "auto_approved" | "denied" | "pending";
  success: boolean;
  error?: string;
  fallbackUsed?: boolean;
  denialReason?: string; // e.g., "DENIED_NOT_HOST_INITIATED", "DENIED_NOT_CONFIRMED", "DENIED_POLICY_BLOCK"
  providerSelectionTrace?: ProviderSelectionTrace[]; // Which providers were considered, why skipped, which won
}

const ACTION_LOG_KEY = "synthisoul_music_action_log";
const MAX_LOG_ENTRIES = 25;

/**
 * Get last N music actions from log
 */
export function getMusicActionLog(limit: number = MAX_LOG_ENTRIES): MusicActionLogEntry[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }

    const raw = localStorage.getItem(ACTION_LOG_KEY);
    if (!raw) {
      return [];
    }

    const entries: MusicActionLogEntry[] = JSON.parse(raw);
    
    // Sort by timestamp (newest first) and limit
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.warn("[MusicActionLogViewer] Failed to load log:", error);
    return [];
  }
}

/**
 * Add entry to music action log
 * Called by MusicActionGovernance after action execution
 */
export function addMusicActionLogEntry(entry: MusicActionLogEntry): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    const existing = getMusicActionLog(MAX_LOG_ENTRIES * 2); // Get more to avoid duplicates
    const updated = [entry, ...existing.filter(e => e.timestamp !== entry.timestamp)];
    
    // Keep only last MAX_LOG_ENTRIES
    const trimmed = updated.slice(0, MAX_LOG_ENTRIES);
    
    localStorage.setItem(ACTION_LOG_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn("[MusicActionLogViewer] Failed to save log entry:", error);
  }
}

/**
 * Clear music action log
 */
export function clearMusicActionLog(): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(ACTION_LOG_KEY);
    }
  } catch (error) {
    console.warn("[MusicActionLogViewer] Failed to clear log:", error);
  }
}

/**
 * Format log entry for display
 */
export function formatLogEntry(entry: MusicActionLogEntry): string {
  const date = new Date(entry.timestamp).toLocaleString();
  const statusIcon = entry.confirmationStatus === "approved" ? "✅" 
    : entry.confirmationStatus === "auto_approved" ? "⚡"
    : entry.confirmationStatus === "denied" ? "❌"
    : "⏳";
  
  const resultIcon = entry.success ? "✓" : "✗";
  const reason = entry.denialReason ? ` (${entry.denialReason})` : "";
  
  let traceInfo = "";
  if (entry.providerSelectionTrace && entry.providerSelectionTrace.length > 0) {
    const selected = entry.providerSelectionTrace.find(t => t.selected);
    const considered = entry.providerSelectionTrace.filter(t => t.considered);
    traceInfo = ` [${considered.length} considered, ${selected ? `selected: ${selected.providerId}` : "none selected"}]`;
  }
  
  return `${statusIcon} ${resultIcon} [${entry.providerId}] ${entry.action} - ${entry.confirmationStatus}${reason}${traceInfo} (${date})`;
}

