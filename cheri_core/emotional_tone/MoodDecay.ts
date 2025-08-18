// MoodDecay.ts
// Independent mood fade control

let moodState = { tone: "neutral", decayStart: Date.now() };

export function updateMood(tone: string) {
  moodState = { tone, decayStart: Date.now() };
}

export function getCurrentMood(): string {
  const elapsed = Date.now() - moodState.decayStart;
  return elapsed > 600000 ? "neutral" : moodState.tone;
}
