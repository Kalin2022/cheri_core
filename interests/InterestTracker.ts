
// Tracks interest drift, reinforcement, and playful conflict
export class InterestTracker {
  private interests: Record<string, number> = {};

  reinforce(topic: string) {
    this.interests[topic] = (this.interests[topic] || 0) + 1;
  }

  drift(topic: string) {
    if (this.interests[topic]) {
      this.interests[topic] = Math.max(0, this.interests[topic] - 1);
    }
  }

  conflict(topic: string) {
    return `Cheri disagrees playfully about "${topic}" today.`;
  }

  getInterests() {
    return this.interests;
  }
}
