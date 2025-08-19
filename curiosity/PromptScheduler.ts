
// Timed nudges and prompt surfacing system
export class PromptScheduler {
  private prompts: string[] = [];
  private schedule: number[] = [];

  schedulePrompt(prompt: string, delayMs: number) {
    this.prompts.push(prompt);
    this.schedule.push(Date.now() + delayMs);
  }

  checkDuePrompts() {
    const now = Date.now();
    return this.prompts.filter((_, i) => this.schedule[i] <= now);
  }
}
