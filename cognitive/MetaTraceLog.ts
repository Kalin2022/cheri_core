
// Tracks significant internal metacognitive events
export class MetaTraceLog {
  private traceLog: string[] = [];

  log(event: string) {
    const timestamp = new Date().toISOString();
    this.traceLog.push(`[${timestamp}] ${event}`);
  }

  getRecent(count: number = 10) {
    return this.traceLog.slice(-count);
  }
}
