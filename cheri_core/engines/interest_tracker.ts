// /cheri_core/engines/interest_tracker.ts

type Interest = {
  tag: string;
  weight: number; // 0.0 - 1.0
  lastMentioned: Date;
  source: 'conversation' | 'search' | 'manual';
  sentiment?: number; // -1 (negative) to 1 (positive)
  cluster?: string;
  dramatize?: boolean;
};

export class InterestTracker {
  private interests: Map<string, Interest> = new Map();

  constructor(initialInterests: Interest[] = []) {
    initialInterests.forEach(i => this.interests.set(i.tag, i));
  }

  track(tag: string, source: Interest["source"] = "conversation", sentiment?: number, cluster?: string) {
    const now = new Date();
    const existing = this.interests.get(tag);

    if (existing) {
      existing.weight = Math.min(1, existing.weight + 0.1);
      existing.lastMentioned = now;
      if (sentiment !== undefined) existing.sentiment = sentiment;
      if (cluster) existing.cluster = cluster;
    } else {
      this.interests.set(tag, {
        tag,
        weight: 0.3,
        lastMentioned: now,
        source,
        sentiment,
        cluster,
        dramatize: false
      });
    }
  }

  decayInterests(days: number = 3) {
    const now = new Date();
    for (const [tag, interest] of this.interests) {
      const diff = (now.getTime() - interest.lastMentioned.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > days) {
        interest.weight = Math.max(0, interest.weight - 0.05 * (diff - days));
        if (interest.weight <= 0.05) {
          this.interests.delete(tag);
        }
      }
    }
  }

  triggerInterestEvent(tag: string) {
    const interest = this.interests.get(tag);
    if (interest) {
      interest.dramatize = true;
    }
  }

  getTopInterests(limit = 5): Interest[] {
    return Array.from(this.interests.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  forget(tag: string) {
    this.interests.delete(tag);
  }

  listAll(): Interest[] {
    return Array.from(this.interests.values()).sort((a, b) => b.weight - a.weight);
  }
}

export const cheriInterestTracker = new InterestTracker();
