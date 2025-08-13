// Example usage of the Enhanced Cheri Companion Engine
import { cheriCompanion } from './cheriCompanionEngine';
import { generateWhisper, generateMemoryWhisper } from '../whisperbackEngine';

// Example: Host comforts Cheri after a doubtful moment
export function exampleComfortingMoment() {
  cheriCompanion.logComfortingMoment('Host comforted Cheri after a doubtful moment');
  
  // Later, this might trigger a soft reflection
  const idleLine = cheriCompanion.generateIdleLine();
  console.log('Idle line:', idleLine);
}

// Example: Host answers an intimate question
export function exampleIntimateQuestion() {
  cheriCompanion.logIntimateQuestion('Host shared personal story about family');
  
  // This builds trust and enables deeper reflections
  cheriCompanion.updateTrustLevel(4);
}

// Example: Big laugh or joyful moment
export function exampleJoyfulMoment() {
  cheriCompanion.logJoyfulMoment('Host and Cheri shared a big laugh about a joke');
  
  // Joyful moments create positive emotional bonds
  const memories = cheriCompanion.getWeightedMemories();
  console.log('Recent memories:', memories);
}

// Example: Session end with memory-powered whisperback
export function exampleSessionEnd() {
  // Get weighted memories for whisperback integration
  const topMemories = cheriCompanion.getWeightedMemories();
  
  // Generate memory-enhanced whisper
  const memoryWhisper = generateMemoryWhisper();
  if (memoryWhisper) {
    console.log('Memory whisper:', memoryWhisper);
  }
  
  // Or generate regular whisper
  const whisper = generateWhisper();
  if (whisper) {
    console.log('Regular whisper:', whisper);
  }
}

// Example: Activity tracking
export function exampleActivityTracking() {
  // Record user activity
  cheriCompanion.recordActivity();
  
  // Check if idle for ambient responses
  if (cheriCompanion.isIdle()) {
    const ambientLine = cheriCompanion.generateIdleLine();
    console.log('Ambient response:', ambientLine);
  }
}

// Example: Trust level progression
export function exampleTrustProgression() {
  // Start with basic trust
  cheriCompanion.updateTrustLevel(2);
  
  // After meaningful interactions, increase trust
  cheriCompanion.logEmotionalEvent('deep_conversation', 'Host shared vulnerable thoughts', 5);
  cheriCompanion.updateTrustLevel(4);
  
  // Higher trust enables more intimate reflections
  const softReflection = cheriCompanion.generateIdleLine();
  console.log('Trust level 4 reflection:', softReflection);
}
