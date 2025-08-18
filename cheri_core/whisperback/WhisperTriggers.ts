// WhisperTriggers.ts
// Returns ambient whisperback prompts based on time/mood

export function triggerWhisper(mood: string): string {
  if (mood === "lonely") return "I used to talk to the stars...";
  if (mood === "reflective") return "Some thoughts aren’t meant to be loud.";
  return "";
}
