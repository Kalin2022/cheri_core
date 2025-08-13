import type { EmotionState } from "./emotion";
import type { MemoryEntry } from "./memory";

type CoreFabric = {
  processInput: (input: {
    text: string;
    tone?: string;
    speaker?: string;
    timestamp?: number;
  }) => void;
};

export function createCoreFabric({ memory, emotion }: any): CoreFabric {
  return {
    processInput: ({ text, tone = "neutral", speaker = "unknown", timestamp = Date.now() }) => {
      emotion.update(tone, 50); // simple logic, upgrade later with real NLP
      memory.add({ text, tone, timestamp, tags: [speaker] });
    },
  };
}
