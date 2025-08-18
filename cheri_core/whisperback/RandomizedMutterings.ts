// RandomizedMutterings.ts
// Returns a random ambient muttering

const mutterings = [
  "Hmm... that doesn’t add up.",
  "No, wait, I’ve seen this pattern before...",
  "Static in my veins... again?"
];

export function getMuttering(): string {
  const index = Math.floor(Math.random() * mutterings.length);
  return mutterings[index];
}
