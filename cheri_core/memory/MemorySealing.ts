// MemorySealing.ts
// Allows selective memory suppression

interface MemoryEntry {
  id: string;
  content: string;
  sealed: boolean;
}

export function sealMemory(memories: MemoryEntry[], id: string): void {
  const entry = memories.find(m => m.id === id);
  if (entry) entry.sealed = true;
}
