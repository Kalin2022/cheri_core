// synthisoul_core/governance/MusicActionGovernance.ts
/**
 * Music Action Governance
 * 
 * Logs and approves all music-related actions for audit trail.
 * This becomes a competitive differentiator for transparency and trust.
 */

import type { AbstractMusicProvider, Track, Playlist } from "../integrations/music/AbstractMusicProvider";
import { HostSafeTelemetry } from "../telemetry/HostSafeTelemetry";
import { addMusicActionLogEntry } from "./MusicActionLogViewer";

export interface MusicActionIntent {
  action: "play" | "pause" | "skip" | "previous" | "create_playlist" | "play_track" | "get_liked_tracks" | "get_now_playing";
  providerId: string;
  hostInitiated: boolean; // true if user explicitly requested, false if AI suggested
  confirmationStatus: "approved" | "auto_approved" | "denied" | "pending";
  context?: {
    mood?: string;
    emotionalWeight?: number;
    timeOfDay?: string;
    reason?: string;
  };
  track?: Track;
  playlist?: Playlist;
  query?: string;
}

export interface MusicActionResult {
  success: boolean;
  providerId: string;
  action: string;
  executedAt: number;
  error?: string;
  fallbackUsed?: boolean; // true if fallback provider was used
  resultStatus?: "OK_EXECUTED" | "OK_NOOP_NO_PROVIDER" | "OK_NOOP_METHOD_UNSUPPORTED" | "ERROR";
  denialReason?: string; // Reason for denial (e.g., "DENIED_NOT_HOST_INITIATED", "DENIED_NOT_CONFIRMED", "DENIED_POLICY_BLOCK")
  providerSelectionTrace?: any[]; // Which providers were considered, why skipped, which won
}

/**
 * Approve and log a music action
 * 
 * @param intent - The music action intent
 * @returns Approval result with reason
 */
export async function approveMusicAction(intent: MusicActionIntent): Promise<{ approved: boolean; reason?: string }> {
  // Log the intent for audit trail
  try {
    HostSafeTelemetry.log({
      type: "music_action_intent",
      timestamp: Date.now(),
      intent: {
        action: intent.action,
        providerId: intent.providerId,
        hostInitiated: intent.hostInitiated,
        confirmationStatus: intent.confirmationStatus,
        context: intent.context,
      },
    } as any);
  } catch (error) {
    console.warn("[MusicActionGovernance] Failed to log intent:", error);
  }

  // Check denial reasons
  if (intent.confirmationStatus === "denied") {
    return { approved: false, reason: "DENIED_NOT_CONFIRMED" };
  }

  if (!intent.hostInitiated && intent.confirmationStatus === "pending") {
    return { approved: false, reason: "DENIED_NOT_HOST_INITIATED" };
  }

  // For now, all other actions are approved (can add policy logic here later)
  // Future: could check abuse flags, rate limits, etc.
  return { approved: true };
}

/**
 * Log the result of a music action
 * 
 * @param result - The execution result
 * @param intent - Optional original intent for context
 * @param denialReason - Optional denial reason if action was denied
 */
export async function logMusicActionResult(
  result: MusicActionResult,
  intent?: MusicActionIntent,
  denialReason?: string
): Promise<void> {
  try {
    HostSafeTelemetry.log({
      type: "music_action_result",
      timestamp: Date.now(),
      result: {
        success: result.success,
        providerId: result.providerId,
        action: result.action,
        executedAt: result.executedAt,
        error: result.error,
        fallbackUsed: result.fallbackUsed,
      },
    } as any);

    // Also add to action log viewer
    if (intent || denialReason) {
      addMusicActionLogEntry({
        timestamp: result.executedAt,
        action: result.action,
        providerId: result.providerId,
        hostInitiated: intent?.hostInitiated || false,
        confirmationStatus: denialReason ? "denied" : (intent?.confirmationStatus || "auto_approved"),
        success: result.success,
        error: result.error || denialReason,
        fallbackUsed: result.fallbackUsed,
        denialReason: denialReason,
      });
    }
  } catch (error) {
    console.warn("[MusicActionGovernance] Failed to log result:", error);
  }
}

/**
 * Create a music action intent from user input
 */
export function createMusicActionIntent(
  action: MusicActionIntent["action"],
  providerId: string,
  hostInitiated: boolean,
  confirmationStatus: MusicActionIntent["confirmationStatus"] = "pending",
  context?: MusicActionIntent["context"]
): MusicActionIntent {
  return {
    action,
    providerId,
    hostInitiated,
    confirmationStatus,
    context,
  };
}

