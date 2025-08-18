// OverrideLogger.ts
// Logs emotional or cognitive override events

interface OverrideLog {
  type: string;
  reason: string;
  timestamp: number;
}

export const overrideLogs: OverrideLog[] = [];

export function logOverride(type: string, reason: string) {
  overrideLogs.push({ type, reason, timestamp: Date.now() });
}
