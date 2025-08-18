// IntrospectionReplay.ts
// Returns recent internal monologues for review

const logs: string[] = [];

export function record(log: string): void {
  logs.push(log);
}

export function replay(): string[] {
  return logs.slice(-5);
}
