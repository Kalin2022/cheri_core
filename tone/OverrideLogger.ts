
// Logs system overrides and informs recoil and introspection modules
export class OverrideLogger {
  private recentOverrides: { type: string; time: number }[] = [];

  logOverride(type: string) {
    this.recentOverrides.push({ type, time: Date.now() });
  }

  wasRecentlyOverridden(type: string, withinMs: number = 60000): boolean {
    return this.recentOverrides.some(o => o.type === type && (Date.now() - o.time) < withinMs);
  }
}
