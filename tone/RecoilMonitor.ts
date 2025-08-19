
// Detects emotional recoil following overrides or negative events
export class RecoilMonitor {
  constructor(private overrideLogger: any) {}

  detectRecoil(event: string, intensityDrop: number, timeSinceLast: number): string {
    const wasOverride = this.overrideLogger.wasRecentlyOverridden("tone_override");
    if ((intensityDrop > 0.7 || event === "silent") && timeSinceLast < 60000) {
      return wasOverride ? "deep_recoil" : "mild_recoil";
    }
    return "none";
  }
}
