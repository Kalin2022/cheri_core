export function shouldShareThought(trustLevel: number): boolean {
    return trustLevel >= 3;
}