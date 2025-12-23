
export interface Character {
  id: string;
  name: string;
  appearance: string;
  personality: string;
  dynamics: string;
  relations: string;
  image?: string;
}

export interface StoryBlock {
  id: string;
  type: 'user' | 'ai';
  versions: string[];
  activeVersionIndex: number;
  timestamp: Date;
}

export interface Story {
  id: string;
  title: string;
  blocks: StoryBlock[];
  rules: string; // Absolute behavioral rules
  keyEvents: string; // Permanent narrative memory
  characters: Character[];
  tags: string[];
  lastEdited: Date;
  images: string[];
  
  // Laws of the Story
  temporalContext: string;
  universe: string;
  primaryTone: string;
  secondaryTones: string[];
  referenceType: 'none' | 'based_on' | 'inspired_by';
  referenceWork: string;
}

export type ViewState = 'home' | 'writing';
