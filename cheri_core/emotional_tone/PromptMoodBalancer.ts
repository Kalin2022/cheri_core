// PromptMoodBalancer.ts
// Caps extreme mood stacking

export function balanceTone(activeTones: string[]): string[] {
  if (activeTones.length > 3) {
    return activeTones.slice(0, 3);
  }
  return activeTones;
}
