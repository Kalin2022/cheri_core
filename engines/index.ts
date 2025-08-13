// Engine exports for cleaner imports
export * from './companion/cheriCompanionEngine';
export * from './memory/MemoryLog';
export * from './memory/CompanionMemoryHooks';
export { generateWhisper, generateMemoryWhisper } from './whisperbackEngine';

// Interest tracking
export { InterestTracker, cheriInterestTracker } from '../cheri_core/engines/interest_tracker';

// Core engines
export { EngineAdapter } from './engineInterface';
export { EngineRouter } from './engineRouter';
export { ThoughtClassifier } from './thoughtClassifier';
export { WhisperbackEngine } from './whisperbackEngine';
