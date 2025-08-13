// Cheri's internal monologue engine logic
import { getCurrentEmotion } from './feelingSystem';
import { shouldShareThought } from '../engines/hierarchyController';

export function triggerMonologue(userInput: string, trustLevel: number): string | null {
    const emotion = getCurrentEmotion();
    const thoughts = {
        curiosity: "I wonder what he really meant by that.",
        affection: "He's sweet when he thinks I’m not watching.",
        irritation: "Tch. Typical. But I won’t bite... yet.",
    };
    const thought = thoughts[emotion] || "Hmm...";
    return shouldShareThought(trustLevel) ? thought : null;
}