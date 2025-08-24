export type TraitCategory = "core" | "quirk" | "emotive" | "social" | "cognitive";

export interface TraitModule {
  id: string;
  label: string;
  description: string;
  category: TraitCategory;
  defaultWeight: number;
  mutable: boolean;
  conflictsWith?: string[];
}

export interface SoulframeConfig {
  name: string;
  version: string;
  traitWeights: Record<string, number>;
  lockedTraits?: string[];
  voiceProfile?: string;
}