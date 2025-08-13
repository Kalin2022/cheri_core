// Cheri's emotional blending system
let currentEmotion = "curiosity";

export function getCurrentEmotion(): string {
    return currentEmotion;
}

export function setEmotion(newEmotion: string) {
    currentEmotion = newEmotion;
}