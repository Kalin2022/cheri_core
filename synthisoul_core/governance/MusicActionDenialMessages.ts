// synthisoul_core/governance/MusicActionDenialMessages.ts
/**
 * Public-Facing User Message Patterns for Music Action Denials
 * 
 * When an action is denied, the Synth should explain:
 * - What was denied
 * - Why (denial reason)
 * - What it needs (confirmation, etc.)
 * 
 * This makes the UX "trustable" - users understand why actions didn't happen.
 */

export type DenialReason = 
  | "DENIED_NOT_CONFIRMED"
  | "DENIED_NOT_HOST_INITIATED"
  | "DENIED_POLICY_BLOCK"
  | "DENIED_NO_PROVIDER"
  | "DENIED_EXECUTION_ERROR"
  | "DENIED_METHOD_UNSUPPORTED";

export interface DenialMessage {
  what: string; // What was denied
  why: string; // Why it was denied (user-friendly explanation)
  whatNeeded: string; // What is needed (confirmation, provider, etc.)
}

/**
 * Generate user-friendly denial message
 */
export function generateDenialMessage(
  action: string,
  reason: DenialReason,
  providerId?: string
): DenialMessage {
  const actionName = getActionName(action);
  
  switch (reason) {
    case "DENIED_NOT_CONFIRMED":
      return {
        what: `${actionName} was not executed`,
        why: "You haven't confirmed this action yet",
        whatNeeded: "Please confirm if you'd like me to proceed",
      };
    
    case "DENIED_NOT_HOST_INITIATED":
      return {
        what: `${actionName} was not executed`,
        why: "This action wasn't explicitly requested by you",
        whatNeeded: "If you'd like me to do this, please ask directly",
      };
    
    case "DENIED_POLICY_BLOCK":
      return {
        what: `${actionName} was blocked`,
        why: "This action was blocked by system policy",
        whatNeeded: "This may require different permissions or settings",
      };
    
    case "DENIED_NO_PROVIDER":
      return {
        what: `${actionName} couldn't be executed`,
        why: "No music provider is currently available",
        whatNeeded: providerId 
          ? `Please connect ${providerId} or enable system media controls`
          : "Please connect a music service or enable system media controls",
      };
    
    case "DENIED_EXECUTION_ERROR":
      return {
        what: `${actionName} failed`,
        why: "An error occurred while trying to execute this action",
        whatNeeded: "Please try again, or check if your music service is connected",
      };
    
    case "DENIED_METHOD_UNSUPPORTED":
      return {
        what: `${actionName} is not supported`,
        why: `The current music provider (${providerId || "unknown"}) doesn't support this action`,
        whatNeeded: "Try using a different music service or method",
      };
    
    default:
      return {
        what: `${actionName} was not executed`,
        why: "The action was denied for an unknown reason",
        whatNeeded: "Please try again or check your settings",
      };
  }
}

/**
 * Format denial message for display to user
 */
export function formatDenialMessage(message: DenialMessage): string {
  return `${message.what}. ${message.why}. ${message.whatNeeded}.`;
}

/**
 * Get user-friendly action name
 */
function getActionName(action: string): string {
  const actionNames: Record<string, string> = {
    play: "Playback",
    pause: "Pausing",
    skip: "Skipping to next track",
    previous: "Going to previous track",
    get_now_playing: "Getting current track",
    create_playlist: "Creating playlist",
    play_track: "Playing track",
    get_liked_tracks: "Getting liked tracks",
  };
  
  return actionNames[action] || `Music action (${action})`;
}

/**
 * Generate denial message from log entry
 */
export function getDenialMessageFromLog(entry: {
  action: string;
  denialReason?: string;
  providerId: string;
}): DenialMessage | null {
  if (!entry.denialReason) {
    return null;
  }
  
  return generateDenialMessage(
    entry.action,
    entry.denialReason as DenialReason,
    entry.providerId
  );
}

