// Companion Memory Hooks
import { MemoryLog, MemoryEntry } from './MemoryLog';

export class CompanionMemoryHooks {
  constructor(private memory: MemoryLog) {}

  public getSoftReflection(trustLevel: number): string | null {
    const memories = this.memory.getRecent(trustLevel);
    if (memories.length === 0) return null;
    const pick = memories[Math.floor(Math.random() * memories.length)];
    return `I was thinking about something… ${pick.summary.toLowerCase()}`;
  }
}
