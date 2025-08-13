// Cheri MemoryLog System
export interface MemoryEntry {
  type: string;
  trustThreshold: number;
  summary: string;
  timestamp: string;
  weight: number;
}

export class MemoryLog {
  private log: MemoryEntry[] = [];

  public add(entry: MemoryEntry) {
    this.log.push(entry);
  }

  public getRecent(trustLevel: number): MemoryEntry[] {
    return this.log.filter(e => e.trustThreshold <= trustLevel);
  }

  public getWeightedMemories(): MemoryEntry[] {
    return this.log.sort((a, b) => b.weight - a.weight).slice(0, 5);
  }
}
