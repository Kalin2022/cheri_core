// Engine exports for cleaner imports
export { CheriCompanionEngine, cheriCompanion } from './companion/cheriCompanionEngine';
export { MemoryLog } from './memory/MemoryLog';
export { CompanionMemoryHooks } from './memory/CompanionMemoryHooks';
export { generateWhisper } from './whisperbackEngine';

// Interest tracking
export { InterestTracker, cheriInterestTracker } from '../cheri_core/engines/interest_tracker';

// Core engines
export { EngineAdapter } from './engineInterface';
export { EngineRouter } from './engineRouter';
export { ThoughtClassifier } from './thoughtClassifier';
export { WhisperbackEngine } from './whisperbackEngine';
