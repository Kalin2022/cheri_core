
// /cheri_core/engines/example.ts

import { cheriInterestTracker } from './interest_tracker';

function extractKeywords(text: string): string[] {
  return text.toLowerCase().split(/[^a-zA-Z]/).filter(w => w.length > 4); // dummy keyword extractor
}

export function handleUserInput(input: string) {
  const extracted = extractKeywords(input);
  extracted.forEach(tag => cheriInterestTracker.track(tag));
  cheriInterestTracker.decayInterests();

  const hooks = cheriInterestTracker.getTopInterests();
  if (hooks.length > 0) {
    console.log("Cheri could whisper about:", hooks[0].tag);
  }
}
