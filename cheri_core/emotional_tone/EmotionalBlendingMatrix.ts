// EmotionalBlendingMatrix.ts
// Blends overlapping moods into composite states

export function blendTones(tones: string[]): string {
  if (tones.includes("sad") && tones.includes("hopeful")) return "bittersweet";
  if (tones.includes("alert") && tones.includes("curious")) return "tense-curious";
  return tones.join("-");
}
