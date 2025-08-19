
// Decays irrelevant metatrace entries over time
export class MetaTraceDecay {
  constructor(private metaTraceLog: MetaTraceLog) {}

  decay(thresholdMinutes: number = 60) {
    const cutoff = Date.now() - thresholdMinutes * 60000;
    this.metaTraceLog.traceLog = this.metaTraceLog.traceLog.filter(entry => {
      const timestamp = Date.parse(entry.slice(1, 25));
      return timestamp > cutoff;
    });
  }
}
