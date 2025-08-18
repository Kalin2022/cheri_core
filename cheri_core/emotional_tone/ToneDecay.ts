// ToneDecay.ts
// Models emotional fadeout over time

interface MoodEntry {
  tone: string;
  timestamp: number;
}

const moodLog: MoodEntry[] = [];

export function decayTone(currentTime: number): string[] {
  return moodLog.filter(m => currentTime - m.timestamp < 300000).map(m => m.tone);
}
