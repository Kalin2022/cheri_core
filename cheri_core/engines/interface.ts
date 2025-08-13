
// /cheri_core/engines/interface.ts

export type Interest = {
  tag: string;
  weight: number;
  lastMentioned: Date;
  source: 'conversation' | 'search' | 'manual';
};
