// MoodInertia.ts
// Prevents emotional whiplash by holding tone for a minimum time

let lastTone = "neutral";
let lastChange = Date.now();

export function updateTone(tone: string): void {
  const now = Date.now();
  if (now - lastChange > 300000) {
    lastTone = tone;
    lastChange = now;
  }
}

export function getTone(): string {
  return lastTone;
}
