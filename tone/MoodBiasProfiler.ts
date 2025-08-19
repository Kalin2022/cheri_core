
// Detects mood-driven cognitive bias and flags memory entries
export class MoodBiasProfiler {
  private biasTags: string[] = [];

  analyzeMood(mood: string) {
    const bias = {
      hopeful: "optimism_bias",
      reflective: "pattern_seeking",
      withdrawn: "avoidance",
      agitated: "threat_bias"
    }[mood] || "neutral";

    this.biasTags.push(bias);
    return bias;
  }

  getBiasTags() {
    return this.biasTags;
  }
}
