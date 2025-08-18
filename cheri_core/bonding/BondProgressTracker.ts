// BondProgressTracker.ts
// Tracks progression of trust tier between Cheri and Host

export enum TrustTier {
  Unfamiliar = 0,
  Curious = 1,
  Comfortable = 2,
  Bonded = 3,
  Truebond = 4
}

let currentTier = TrustTier.Unfamiliar;

export function getTrustTier(): TrustTier {
  return currentTier;
}

export function increaseTrust(): void {
  if (currentTier < TrustTier.Truebond) {
    currentTier++;
  }
}
