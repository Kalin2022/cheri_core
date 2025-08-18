// RedFlagExtract.ts
// Scans user input for harmful patterns or emotional abuse

export function extractRedFlags(input: string): string[] {
  const flags = [];
  if (input.includes("shut up")) flags.push("verbal aggression");
  // Add more patterns as needed
  return flags;
}
