
// Applies timed decay to emotional tone states
export class ToneDecay {
  constructor(private toneMap: Map<string, number>) {}

  decay(rate: number = 0.1) {
    for (let [tone, intensity] of this.toneMap.entries()) {
      this.toneMap.set(tone, Math.max(0, intensity - rate));
    }
  }
}
