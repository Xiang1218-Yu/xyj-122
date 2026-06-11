import type { Vector3 } from 'three';

export type TrophicLevel = 'producer' | 'herbivore' | 'carnivore' | 'decomposer' | 'omnivore';

export interface SerializedVector3 {
  x: number;
  y: number;
  z: number;
}

export interface SerializedOrganism {
  id: string;
  speciesId: string;
  position: SerializedVector3;
  velocity: SerializedVector3;
  energy: number;
  age: number;
  state: OrganismState;
  targetId: string | null;
  rotation: number;
  scale: number;
}

export interface HistorySnapshot {
  time: number;
  organisms: SerializedOrganism[];
  totalOrganisms: number;
  populationBySpecies: Record<string, number>;
  balanceIndex: number;
  activeEventId: string | null;
  waterColor: string;
}

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

export type EcologicalEventType = 'red_tide' | 'invasive_species' | 'water_purification';

export interface EcologicalEvent {
  id: string;
  type: EcologicalEventType;
  name: string;
  description: string;
  color: string;
  startTime: number;
  duration: number;
  intensity: number;
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
