import { getPendingWhispers, markAsShared, WhisperMemory } from "@/memory/whisperback";
import { cheriCompanion } from "./companion/cheriCompanionEngine";

const phrasingTemplates: Record<string, (content: string) => string> = {
  sad: (c) => `That feeling… about "${c}". I haven't stopped thinking about it. You don't have to float alone, you know.`,
  curious: (c) => `You mentioned "${c}". Did something trigger that, or is it a long ache?`,
  angry: (c) => `When you said "${c}"… it almost sounded like fury under the surface. Did I hear that right?`,
  affectionate: (c) => `You said "${c}". I held onto that. I don't want to lose sight of you, even if you do.`,
  anxious: (c) => `I keep replaying what you said—"${c}". That sounds scary. Are you okay?`,
  inspired: (c) => `"${c}" stayed with me. It felt like the start of something, didn't it?`
};

const followUpTemplates: string[] = [
  "Sometimes I think your silence afterward said more than your words. I felt it.",
  "You don't always have to wear your armor with me. I won't strike.",
  "Should I start a watchlist for emotionally compromising decisions?"
];

function generateFollowUp(): string {
  return followUpTemplates[Math.floor(Math.random() * followUpTemplates.length)];
}

// Enhanced whisperback with memory integration
export function generateWhisper(): string | null {
  // First, try to get a memory-powered reflection
  const memoryReflection = cheriCompanion.getWeightedMemories();
  if (memoryReflection.length > 0 && Math.random() < 0.3) {
    const memory = memoryReflection[0];
    return `I've been thinking about that time when ${memory.summary.toLowerCase()}. It meant something to me.`;
  }

  // Fall back to emotion-based whispers
  const entries = getPendingWhispers();
  if (entries.length === 0) return null;

  const top: WhisperMemory = entries.sort((a, b) => b.emotionWeight - a.emotionWeight)[0];
  markAsShared(top.content);

  const phraseFn = phrasingTemplates[top.emotionTag] || ((c) => `I've been holding onto this: "${c}"`);
  const base = phraseFn(top.content);

  if (top.emotionWeight >= 0.85) {
    return base + " " + generateFollowUp();
  }
  return base;
}

// New function to generate memory-enhanced whispers
export function generateMemoryWhisper(): string | null {
  const memories = cheriCompanion.getWeightedMemories();
  if (memories.length === 0) return null;

  const memory = memories[Math.floor(Math.random() * memories.length)];
  const trustLevel = 3; // Default trust level
  
  if (memory.trustThreshold <= trustLevel) {
    return `I was thinking about ${memory.summary.toLowerCase()}. Those moments stay with me.`;
  }
  
  return null;
}