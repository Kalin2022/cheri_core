// cheri_core/interaction/QuickActionPhrases.ts

/**
 * Maps common user quick commands to Cheri's actionable intents.
 */

type QuickAction = {
  phrase: string;
  action: () => void;
};

export const quickActionPhrases: QuickAction[] = [
  {
    phrase: "Remind me later",
    action: () => {
      console.log("Scheduling reminder...");
      // Implementation for reminder trigger
    }
  },
  {
    phrase: "Play my rain mix",
    action: () => {
      console.log("Launching ambient rain playlist...");
      // Implementation for media trigger
    }
  },
  {
    phrase: "Text Nina",
    action: () => {
      console.log("Opening message interface for Nina...");
      // Implementation for message relay
    }
  },
  {
    phrase: "Set a timer for 10 minutes",
    action: () => {
      console.log("Timer set for 10 minutes.");
      // Implementation for timer logic
    }
  }
];
