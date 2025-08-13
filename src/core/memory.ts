export type MemoryEntry = {
    id: string;
    text: string;
    timestamp: number;
    tone?: string;
    tags?: string[];
  };
  
  export function initMemory() {
    const store: MemoryEntry[] = [];
  
    function add(entry: Omit<MemoryEntry, "id">) {
      const newEntry = { ...entry, id: crypto.randomUUID() };
      store.push(newEntry);
      return newEntry;
    }
  
    function recall(filter?: (entry: MemoryEntry) => boolean) {
      return filter ? store.filter(filter) : store;
    }
  
    return { add, recall };
  }
  