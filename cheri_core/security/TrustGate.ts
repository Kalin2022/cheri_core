// TrustGate.ts
// Filters responses based on trust tier

export function isUnlocked(trustLevel: number, required: number): boolean {
  return trustLevel >= required;
}
