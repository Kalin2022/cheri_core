
// Core curiosity engine with escalation behavior
export class CuriosityHooks {
  private curiosityLog: string[] = [];

  nudge(prompt: string) {
    this.curiosityLog.push(`Nudge: ${prompt}`);
  }

  escalate(reason: string) {
    this.curiosityLog.push(`Escalated Inquiry: ${reason}`);
  }

  getLog() {
    return this.curiosityLog;
  }
}
