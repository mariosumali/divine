export type SystemSlug =
  | 'tarot'
  | 'oracle'
  | 'lenormand'
  | 'spellcraft'
  | 'ancient-egypt'
  | 'zodiac'
  | 'kipper'
  | 'belline'
  | 'playing-card-cartomancy'
  | 'sibilla'
  | 'runic-cards'
  | 'i-ching-cards'
  | 'fal-e-hafez'
  | 'hanafuda'
  | 'magic-8-ball'
  | 'fortune-cookie';

export type Focus = 'general' | 'love' | 'work' | 'growth';
export type ReadingKind = 'cards' | 'ball' | 'cookie';

export interface CardDefinition {
  id: string;
  name: string;
  glyph: string;
  image?: string;
  keywords: string[];
  meaning: string;
  reversedMeaning?: string;
  domain?: string;
  element?: string;
  numerology?: number;
  subject?: string;
  modifier?: string;
  polarity?: 'positive' | 'neutral' | 'challenging';
  timing?: string;
  focusModifiers?: Partial<Record<Focus, string>>;
  provenance?: string;
}

export interface SpreadDefinition {
  id: string;
  name: string;
  description: string;
  positions: string[];
  layout: 'single' | 'line' | 'cross' | 'grid' | 'tableau';
}

export interface SystemDefinition {
  slug: SystemSlug;
  index: string;
  name: string;
  shortName: string;
  kind: ReadingKind;
  countLabel: string;
  eyebrow: string;
  introduction: string;
  instruction: string;
  reversalStyle?: 'optional' | 'required';
  cards: CardDefinition[];
  spreads: SpreadDefinition[];
  cover: string;
}

export interface DrawnCard {
  card: CardDefinition;
  position: string;
  reversed: boolean;
}

export interface InterpretationBlock {
  headline: string;
  overview: string;
  positions: Array<{ label: string; card: string; text: string }>;
  synthesis: string;
  closing: string;
  reflectionPrompt?: string;
}

export interface ReadingRecord {
  id: string;
  system: SystemSlug;
  systemName: string;
  spreadId: string;
  spreadName: string;
  createdAt: string;
  focus: Focus;
  question?: string;
  draws: DrawnCard[];
  interpretation: InterpretationBlock;
  note: string;
  favorite: boolean;
}
