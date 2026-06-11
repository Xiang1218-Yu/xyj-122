import { create } from 'zustand';
import * as THREE from 'three';
import type {
  Organism,
  EcosystemStats,
  Species,
  PresetEcosystem,
  EcologicalEvent,
  HistorySnapshot,
  SerializedOrganism,
  SerializedVector3,
} from '@/types/ecosystem';
import { getSpeciesById, SPECIES } from '@/data/species';
import { getPresetById } from '@/data/presets';

const MAX_HISTORY_SNAPSHOTS = 1800;

function serializeVector3(v: THREE.Vector3): SerializedVector3 {
  return { x: v.x, y: v.y, z: v.z };
}

function deserializeVector3(s: SerializedVector3): THREE.Vector3 {
  return new THREE.Vector3(s.x, s.y, s.z);
}

function serializeOrganism(o: Organism): SerializedOrganism {
  return {
    id: o.id,
    speciesId: o.speciesId,
    position: serializeVector3(o.position),
    velocity: serializeVector3(o.velocity),
    energy: o.energy,
    age: o.age,
    state: o.state,
    targetId: o.targetId,
    rotation: o.rotation,
    scale: o.scale,
  };
}

function deserializeOrganism(s: SerializedOrganism): Organism {
  return {
    id: s.id,
    speciesId: s.speciesId,
    position: deserializeVector3(s.position),
    velocity: deserializeVector3(s.velocity),
    energy: s.energy,
    age: s.age,
    state: s.state,
    targetId: s.targetId,
    rotation: s.rotation,
    scale: s.scale,
  };
}

interface EcosystemStore {
  organisms: Organism[];
  selectedSpeciesId: string | null;
  selectedOrganismId: string | null;
  trackingOrganismId: string | null;
  isRunning: boolean;
  simulationTime: number;
  showLabels: boolean;
  currentPresetId: string | null;
  backgroundColors: [string, string, string];
  waterColor: string;
  ambientLightIntensity: number;
  waterTemperature: number;
  lightIntensity: number;
  activeEvent: EcologicalEvent | null;
  showTimeline: boolean;

  history: HistorySnapshot[];
  isRewinding: boolean;
  rewindTime: number;

  addOrganism: (speciesId: string, position?: THREE.Vector3) => void;
  removeOrganism: (organismId: string) => void;
  updateOrganism: (organismId: string, updates: Partial<Organism>) => void;
  setSelectedSpecies: (speciesId: string | null) => void;
  setSelectedOrganism: (organismId: string | null) => void;
  setTrackingOrganism: (organismId: string | null) => void;
  toggleTracking: (organismId: string) => void;
  toggleSimulation: () => void;
  incrementTime: () => void;
  resetEcosystem: () => void;
  toggleLabels: () => void;
  getStats: () => EcosystemStats;
  batchUpdateOrganisms: (updates: { id: string; updates: Partial<Organism> }[]) => void;
  batchRemoveOrganisms: (ids: string[]) => void;
  loadPreset: (presetId: string) => void;
  getCurrentPreset: () => PresetEcosystem | undefined;
  triggerEvent: (event: EcologicalEvent) => void;
  clearEvent: () => void;
  setWaterColor: (color: string) => void;
  setWaterTemperature: (temp: number) => void;
  setLightIntensity: (intensity: number) => void;
  toggleTimeline: () => void;

  recordSnapshot: () => void;
  seekToTime: (targetTime: number) => void;
  exitRewind: () => void;
  clearHistory: () => void;
}

const AQUARIUM_BOUNDS = {
  minX: -4,
  maxX: 4,
  minY: -2,
  maxY: 2,
  minZ: -2,
  maxZ: 2,
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomPosition(species: Species): THREE.Vector3 {
  const isProducer = species.trophicLevel === 'producer';
  const minY = isProducer ? AQUARIUM_BOUNDS.minY : AQUARIUM_BOUNDS.minY + 0.3;
  const maxY = isProducer ? AQUARIUM_BOUNDS.minY + 0.5 : AQUARIUM_BOUNDS.maxY - 0.3;

  return new THREE.Vector3(
    AQUARIUM_BOUNDS.minX + Math.random() * (AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX),
    minY + Math.random() * (maxY - minY),
    AQUARIUM_BOUNDS.minZ + Math.random() * (AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ),
  );
}

function createOrganism(speciesId: string, position?: THREE.Vector3): Organism | null {
  const species = getSpeciesById(speciesId);
  if (!species) return null;

  const pos = position || randomPosition(species);

  return {
    id: generateId(),
    speciesId,
    position: pos,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * species.speed,
      (Math.random() - 0.5) * species.speed * 0.5,
      (Math.random() - 0.5) * species.speed,
    ),
    energy: species.energyValue * (0.7 + Math.random() * 0.3),
    age: Math.random() * species.lifespan * 0.3,
    state: 'idle',
    targetId: null,
    rotation: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
  };
}

export const useEcosystemStore = create<EcosystemStore>((set, get) => ({
  organisms: [],
  selectedSpeciesId: null,
  selectedOrganismId: null,
  trackingOrganismId: null,
  isRunning: true,
  simulationTime: 0,
  showLabels: true,
  currentPresetId: null,
  backgroundColors: ['#0A1628', '#0d1f3d', '#1E3A5F'] as [string, string, string],
  waterColor: '#22D3EE',
  ambientLightIntensity: 0.7,
  waterTemperature: 24,
  lightIntensity: 0.7,
  activeEvent: null,
  showTimeline: true,

  history: [],
  isRewinding: false,
  rewindTime: 0,

  addOrganism: (speciesId, position) => {
    const state = get();
    if (state.isRewinding) return;
    const species = getSpeciesById(speciesId);
    if (!species) return;

    const currentCount = state.organisms.filter((o) => o.speciesId === speciesId).length;
    if (currentCount >= species.maxPopulation) return;

    const organism = createOrganism(speciesId, position);
    if (organism) {
      set((prev) => ({ organisms: [...prev.organisms, organism] }));
    }
  },

  removeOrganism: (organismId) => {
    if (get().isRewinding) return;
    set((prev) => ({
      organisms: prev.organisms.filter((o) => o.id !== organismId),
      selectedOrganismId: prev.selectedOrganismId === organismId ? null : prev.selectedOrganismId,
      trackingOrganismId: prev.trackingOrganismId === organismId ? null : prev.trackingOrganismId,
    }));
  },

  updateOrganism: (organismId, updates) => {
    if (get().isRewinding) return;
    set((prev) => ({
      organisms: prev.organisms.map((o) => (o.id === organismId ? { ...o, ...updates } : o)),
    }));
  },

  batchUpdateOrganisms: (updates) => {
    if (get().isRewinding) return;
    set((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.updates]));
      return {
        organisms: prev.organisms.map((o) => {
          const update = updateMap.get(o.id);
          return update ? { ...o, ...update } : o;
        }),
      };
    });
  },

  batchRemoveOrganisms: (ids) => {
    if (get().isRewinding) return;
    const idSet = new Set(ids);
    set((prev) => ({
      organisms: prev.organisms.filter((o) => !idSet.has(o.id)),
      selectedOrganismId:
        prev.selectedOrganismId && idSet.has(prev.selectedOrganismId) ? null : prev.selectedOrganismId,
      trackingOrganismId:
        prev.trackingOrganismId && idSet.has(prev.trackingOrganismId) ? null : prev.trackingOrganismId,
    }));
  },

  setSelectedSpecies: (speciesId) => {
    set({ selectedSpeciesId: speciesId });
  },

  setSelectedOrganism: (organismId) => {
    set({ selectedOrganismId: organismId });
  },

  setTrackingOrganism: (organismId) => {
    set({ trackingOrganismId: organismId });
  },

  toggleTracking: (organismId) => {
    set((prev) => ({
      trackingOrganismId: prev.trackingOrganismId === organismId ? null : organismId,
    }));
  },

  toggleSimulation: () => {
    set((prev) => {
      if (prev.isRewinding) {
        return { isRewinding: false, isRunning: true, rewindTime: 0 };
      }
      return { isRunning: !prev.isRunning };
    });
  },

  incrementTime: () => {
    if (get().isRewinding) return;
    set((prev) => ({ simulationTime: prev.simulationTime + 1 }));
  },

  resetEcosystem: () => {
    set({
      organisms: [],
      selectedSpeciesId: null,
      selectedOrganismId: null,
      trackingOrganismId: null,
      simulationTime: 0,
      isRunning: true,
      currentPresetId: null,
      backgroundColors: ['#0A1628', '#0d1f3d', '#1E3A5F'] as [string, string, string],
      waterColor: '#22D3EE',
      ambientLightIntensity: 0.7,
      waterTemperature: 24,
      lightIntensity: 0.7,
      activeEvent: null,
      showTimeline: true,
      history: [],
      isRewinding: false,
      rewindTime: 0,
    });
  },

  toggleLabels: () => {
    set((prev) => ({ showLabels: !prev.showLabels }));
  },

  loadPreset: (presetId) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    const newOrganisms: Organism[] = [];
    preset.species.forEach(({ speciesId, count }) => {
      const species = getSpeciesById(speciesId);
      if (!species) return;

      const actualCount = Math.min(count, species.maxPopulation);
      for (let i = 0; i < actualCount; i++) {
        const organism = createOrganism(speciesId);
        if (organism) {
          newOrganisms.push(organism);
        }
      }
    });

    set({
      organisms: [],
      selectedSpeciesId: null,
      selectedOrganismId: null,
      trackingOrganismId: null,
      simulationTime: 0,
      isRunning: false,
      currentPresetId: presetId,
      backgroundColors: preset.backgroundColors,
      waterColor: preset.waterColor,
      ambientLightIntensity: preset.ambientLightIntensity,
      waterTemperature: 24,
      lightIntensity: preset.ambientLightIntensity,
      activeEvent: null,
      showTimeline: true,
      history: [],
      isRewinding: false,
      rewindTime: 0,
    });

    requestAnimationFrame(() => {
      set({
        organisms: newOrganisms,
        isRunning: true,
      });
    });
  },

  getCurrentPreset: () => {
    const state = get();
    return state.currentPresetId ? getPresetById(state.currentPresetId) : undefined;
  },

  triggerEvent: (event) => {
    set({ activeEvent: event });
  },

  clearEvent: () => {
    set({ activeEvent: null });
  },

  setWaterColor: (color) => {
    set({ waterColor: color });
  },

  setWaterTemperature: (temp) => {
    set({ waterTemperature: temp });
  },

  setLightIntensity: (intensity) => {
    set({ lightIntensity: intensity, ambientLightIntensity: intensity });
  },

  toggleTimeline: () => {
    set((prev) => ({ showTimeline: !prev.showTimeline }));
  },

  getStats: () => {
    const state = get();
    const populationBySpecies: Record<string, number> = {};
    SPECIES.forEach((s) => {
      populationBySpecies[s.id] = 0;
    });
    state.organisms.forEach((o) => {
      populationBySpecies[o.speciesId] = (populationBySpecies[o.speciesId] || 0) + 1;
    });

    let balanceIndex = 0;
    const levels = ['producer', 'herbivore', 'omnivore', 'carnivore', 'decomposer'];
    const levelCounts: Record<string, number> = { producer: 0, herbivore: 0, omnivore: 0, carnivore: 0, decomposer: 0 };
    state.organisms.forEach((o) => {
      const sp = getSpeciesById(o.speciesId);
      if (sp) levelCounts[sp.trophicLevel]++;
    });

    const total = state.organisms.length;
    if (total > 0) {
      const idealRatios = { producer: 0.45, herbivore: 0.25, omnivore: 0.1, carnivore: 0.1, decomposer: 0.1 };
      let deviation = 0;
      levels.forEach((level) => {
        const actual = levelCounts[level] / total;
        deviation += Math.abs(actual - idealRatios[level]);
      });
      balanceIndex = Math.max(0, 100 - deviation * 100);
    }

    return {
      time: state.isRewinding ? state.rewindTime : state.simulationTime,
      isRunning: state.isRunning,
      balanceIndex,
      populationBySpecies,
      totalOrganisms: total,
    };
  },

  recordSnapshot: () => {
    const state = get();
    if (state.isRewinding) return;

    const populationBySpecies: Record<string, number> = {};
    SPECIES.forEach((s) => {
      populationBySpecies[s.id] = 0;
    });
    state.organisms.forEach((o) => {
      populationBySpecies[o.speciesId] = (populationBySpecies[o.speciesId] || 0) + 1;
    });

    let balanceIndex = 0;
    const levels = ['producer', 'herbivore', 'omnivore', 'carnivore', 'decomposer'];
    const levelCounts: Record<string, number> = { producer: 0, herbivore: 0, omnivore: 0, carnivore: 0, decomposer: 0 };
    state.organisms.forEach((o) => {
      const sp = getSpeciesById(o.speciesId);
      if (sp) levelCounts[sp.trophicLevel]++;
    });
    const total = state.organisms.length;
    if (total > 0) {
      const idealRatios = { producer: 0.45, herbivore: 0.25, omnivore: 0.1, carnivore: 0.1, decomposer: 0.1 };
      let deviation = 0;
      levels.forEach((level) => {
        const actual = levelCounts[level] / total;
        deviation += Math.abs(actual - idealRatios[level]);
      });
      balanceIndex = Math.max(0, 100 - deviation * 100);
    }

    const snapshot: HistorySnapshot = {
      time: state.simulationTime,
      organisms: state.organisms.map(serializeOrganism),
      totalOrganisms: total,
      populationBySpecies,
      balanceIndex,
      activeEventId: state.activeEvent?.id || null,
      waterColor: state.waterColor,
    };

    set((prev) => {
      const newHistory = [...prev.history, snapshot];
      if (newHistory.length > MAX_HISTORY_SNAPSHOTS) {
        newHistory.splice(0, newHistory.length - MAX_HISTORY_SNAPSHOTS);
      }
      return { history: newHistory };
    });
  },

  seekToTime: (targetTime: number) => {
    const state = get();
    if (state.history.length === 0) return;

    let closestSnapshot = state.history[0];
    let minDiff = Math.abs(targetTime - closestSnapshot.time);

    for (let i = 1; i < state.history.length; i++) {
      const diff = Math.abs(targetTime - state.history[i].time);
      if (diff < minDiff) {
        minDiff = diff;
        closestSnapshot = state.history[i];
      }
    }

    const restoredOrganisms = closestSnapshot.organisms.map(deserializeOrganism);

    set({
      isRewinding: true,
      rewindTime: closestSnapshot.time,
      organisms: restoredOrganisms,
      waterColor: closestSnapshot.waterColor,
      selectedOrganismId: null,
      trackingOrganismId: null,
    });
  },

  exitRewind: () => {
    const state = get();
    if (!state.isRewinding) return;

    const lastSnapshot = state.history[state.history.length - 1];
    if (!lastSnapshot) {
      set({ isRewinding: false, rewindTime: 0 });
      return;
    }

    const restoredOrganisms = lastSnapshot.organisms.map(deserializeOrganism);
    const preset = state.getCurrentPreset();

    set({
      isRewinding: false,
      rewindTime: 0,
      simulationTime: lastSnapshot.time,
      organisms: restoredOrganisms,
      waterColor: preset?.waterColor || lastSnapshot.waterColor || '#22D3EE',
    });
  },

  clearHistory: () => {
    set({ history: [], isRewinding: false, rewindTime: 0 });
  },
}));

export { AQUARIUM_BOUNDS };
