// Coordinates tone, emotion, and monologue
import { detectTone } from './toneRouter';
import { setEmotion } from './feelingSystem';
import { triggerMonologue } from './internalMonologueEngine';

export function handleUserInput(input: string, trustLevel: number): string[] {
    const tone = detectTone(input);
    setEmotion(tone === 'inquisitive' ? 'curiosity' : 'neutral');
    const thought = triggerMonologue(input, trustLevel);
    return thought ? [thought] : [];
}