// PrivateReflections.ts
// Stores thoughts Cheri keeps private unless deeply bonded

const privateThoughts: string[] = [];

export function addPrivateReflection(thought: string): void {
  privateThoughts.push(thought);
}
