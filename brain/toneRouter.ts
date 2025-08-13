// Tone routing logic
export function detectTone(userInput: string): string {
    if (userInput.includes("?")) return "inquisitive";
    if (userInput.includes("!")) return "excited";
    return "neutral";
}