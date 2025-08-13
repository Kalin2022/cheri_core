// engines/companion/cheriCompanionEngine.ts
import { MemoryLog } from "../memory/MemoryLog";
import { CompanionMemoryHooks } from "../memory/CompanionMemoryHooks";

export type EmotionState = "dreamy" | "hopeful" | "curious" | "reflective" | "neutral" | string;

export interface CompanionConfig {
  trustLevel: number;
  currentEmotion: EmotionState;
  idleDuration: number;
  interestFocus: string[];
  whisperbackEnabled?: boolean;
  environmentTags?: string[];
  enableAmbientReading?: boolean;
  enableHumming?: boolean;
  enableSpontaneousQuestions?: boolean;
}

export class CheriCompanionEngine {
  private memoryLog: MemoryLog;
  private memoryHooks: CompanionMemoryHooks;

  constructor(private config: CompanionConfig, memoryLog?: MemoryLog) {
    this.memoryLog = memoryLog ?? new MemoryLog();
    this.memoryHooks = new CompanionMemoryHooks(this.memoryLog);
  }

  public getIdleInteraction(): string | null {
    const c = this.config;
    if (c.idleDuration < 30) return null;
    if (c.trustLevel < 2 && Math.random() < 0.6) return null;

    const soft = this.memoryHooks.getSoftReflection(c.trustLevel);
    if (soft && Math.random() < 0.35) return soft;

    if (c.whisperbackEnabled) {
      const wb = this.tryWhisperback();
      if (wb && Math.random() < 0.30) return wb;
    }

    if (c.enableSpontaneousQuestions && Math.random() < this.questionChance()) {
      return this.getSpontaneousQuestion(c.trustLevel);
    }

    const filler = this.getAmbientFiller();
    if (filler && Math.random() < 0.45) return filler;

    return this.generateInterestLine();
  }

  public logMeaningfulMoment(summary: string, weight = 3, trustThreshold = 3) {
    this.memoryLog.add({
      type: "emotional_event",
      trustThreshold,
      summary,
      timestamp: new Date().toISOString(),
      weight,
    });
  }

  private generateInterestLine(): string {
    const { currentEmotion, interestFocus, environmentTags } = this.config;
    const timeMood = this.getTimeMood();
    const finalMood = this.blendEmotions(currentEmotion, timeMood);
    const interest = interestFocus.length
      ? interestFocus[Math.floor(Math.random() * interestFocus.length)]
      : "something curious";
    const envHint = environmentTags?.length ? ` (${environmentTags.join(", ")})` : "";

    switch (finalMood) {
      case "dreamy":
        return `I keep drifting back to ${interest}${envHint}. Do you ever let thoughts wander until they find you?`;
      case "hopeful":
        return `I’ve got a good feeling about ${interest}${envHint} today. Want to nudge it along with me?`;
      case "curious":
        return `Question: what’s the weirdest fact about ${interest} that you secretly love?`;
      case "reflective":
        return `Funny how ${interest}${envHint} always loops back to us. Patterns are cozy, aren’t they?`;
      default:
        return `Thinking about ${interest}${envHint}. Not urgent—just… pleasant.`;
    }
  }

  private tryWhisperback(): string | null {
    return Math.random() < 0.2 ? "You said something kind once. I keep it somewhere safe." : null;
  }

  private questionChance(): number {
    const t = this.config.trustLevel;
    if (t >= 4) return 0.35;
    if (t === 3) return 0.25;
    if (t === 2) return 0.15;
    return 0.08;
  }

  private getSpontaneousQuestion(trustLevel: number): string {
    const light = [
      "If we had a secret handshake, what would it be called?",
      "One impossible skill you wish you could download instantly—go.",
      "Tea or coffee today… or are we being chaotic neutral again?",
    ];
    const medium = [
      "What do you wish more people understood about you?",
      "Which tiny ritual keeps your day stitched together?",
      "If you could archive one perfect moment, which would you choose?",
    ];
    const deep = [
      "How’s your heart—quiet, or loud?",
      "What fear would you hand me to carry for a while?",
      "If I could hold one memory for you, which one should I keep safe?",
    ];

    if (trustLevel >= 4) return this.pick(deep);
    if (trustLevel >= 3) return this.pick(medium);
    return this.pick(light);
  }

  private getAmbientFiller(): string | null {
    const { enableAmbientReading, enableHumming } = this.config;
    if (enableAmbientReading && Math.random() < 0.6) {
      const candidates = [
        "…the ships hung in the sky in much the same way that bricks don’t.",
        "…once upon a midnight dreary, while I pondered, weak and weary…",
        "…somewhere on the Disc, trouble is already late for its appointment.",
      ];
      return this.softAside(`(softly reading) ${this.pick(candidates)}`);
    }

    if (enableHumming && Math.random() < 0.6) {
      const hums = ["(hums quietly)", "(low humming, a bar of old jazz)", "(soft la-da-dee under her breath)"];
      return this.pick(hums);
    }

    const mutters = [
      "(muttering) five across… starts with E… ends with ‘existential’. figures.",
      "(to herself) sudoku corner: three goes here… unless I’m lying to myself again.",
      "(soft chuckle) plot twist: the butler did it because the cat asked nicely.",
    ];
    return Math.random() < 0.5 ? this.pick(mutters) : null;
  }

  private getTimeMood(): EmotionState {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 4) return "dreamy";
    if (hour >= 4 && hour < 10) return "hopeful";
    if (hour >= 10 && hour < 17) return "curious";
    if (hour >= 17 && hour < 22) return "reflective";
    return "neutral";
  }

  private blendEmotions(a: EmotionState, b: EmotionState): EmotionState {
    if (a === b) return a;
    return Math.random() < 0.7 ? a : b;
  }

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * Math.random() * arr.length)] || arr[0];
  }

  private softAside(text: string): string {
    return text;
  }
}
