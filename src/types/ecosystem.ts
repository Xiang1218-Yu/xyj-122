import type { Vector3 } from 'three';

export type TrophicLevel = 'producer' | 'herbivore' | 'carnivore' | 'decomposer' | 'omnivore';

export type OrganismState = 'idle' | 'wandering' | 'hunting' | 'fleeing' | 'eating' | 'reproducing';

export interface Species {
  id: string;
  name: string;
  emoji: string;
  trophicLevel: TrophicLevel;
  color: string;
  description: string;
  habitat: 'water' | 'land' | 'both';
  diet: string[];
  predators: string[];
  reproductionRate: number;
  lifespan: number;
  speed: number;
  size: number;
  energyValue: number;
  maxPopulation: number;
}

export interface Organism {
  id: string;
  speciesId: string;
  position: Vector3;
  velocity: Vector3;
  energy: number;
  age: number;
  state: OrganismState;
  targetId: string | null;
  rotation: number;
  scale: number;
}

export interface EcosystemStats {
  time: number;
  isRunning: boolean;
  balanceIndex: number;
  populationBySpecies: Record<string, number>;
  totalOrganisms: number;
}

export interface FoodChainRelation {
  predatorId: string;
  preyId: string;
}

export interface PresetSpeciesConfig {
  speciesId: string;
  count: number;
}

export interface PresetEcosystem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'freshwater' | 'rainforest' | 'polluted' | 'marine' | 'custom';
  backgroundColors: [string, string, string];
  waterColor: string;
  ambientLightIntensity: number;
  species: PresetSpeciesConfig[];
  educationalInfo: string;
  expectedObservations: string[];
}
