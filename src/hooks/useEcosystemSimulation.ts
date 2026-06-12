import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { simulateStep } from '@/utils/ecosystemSimulator';
import { AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';
import { getSpeciesById } from '@/data/species';
import type { Organism, EcologicalEvent, EcologicalEventType, PresetEcosystem } from '@/types/ecosystem';

const EVENT_CONFIGS: Record<EcologicalEventType, {
  name: string;
  description: string;
  color: string;
  minDuration: number;
  maxDuration: number;
  probability: number;
}> = {
  red_tide: {
    name: '赤潮爆发',
    description: '有害藻类大量繁殖，水质变红，威胁鱼类生存',
    color: '#DC2626',
    minDuration: 300,
    maxDuration: 500,
    probability: 0.0008,
  },
  invasive_species: {
    name: '外来物种入侵',
    description: '入侵物种大量繁殖，抢占本地物种资源',
    color: '#F97316',
    minDuration: 400,
    maxDuration: 600,
    probability: 0.0006,
  },
  water_purification: {
    name: '水质净化',
    description: '有益微生物活跃，水质变清，生态系统恢复',
    color: '#06B6D4',
    minDuration: 350,
    maxDuration: 500,
    probability: 0.0007,
  },
};

const INVASIVE_SPECIES_BY_HABITAT: Record<'water' | 'land' | 'both', string[]> = {
  water: ['jellyfish', 'polluted_algae', 'carp', 'mosquito_larva'],
  land: ['ant', 'beetle'],
  both: ['frog', 'snail'],
};

function inferHabitatFromPreset(preset: PresetEcosystem | undefined): 'water' | 'land' | 'both' {
  if (!preset) return 'water';

  switch (preset.category) {
    case 'rainforest':
      return 'land';
    case 'freshwater':
    case 'marine':
    case 'polluted':
      return 'water';
    case 'custom':
    default: {
      const speciesHabitats = preset.species.map(({ speciesId }) => getSpeciesById(speciesId)?.habitat);
      const waterCount = speciesHabitats.filter((h) => h === 'water' || h === 'both').length;
      const landCount = speciesHabitats.filter((h) => h === 'land' || h === 'both').length;
      if (waterCount > landCount) return 'water';
      if (landCount > waterCount) return 'land';
      return 'both';
    }
  }
}

function getInvasiveSpeciesForHabitat(habitat: 'water' | 'land' | 'both'): string[] {
  if (habitat === 'both') {
    return [...INVASIVE_SPECIES_BY_HABITAT.water, ...INVASIVE_SPECIES_BY_HABITAT.land, ...INVASIVE_SPECIES_BY_HABITAT.both];
  }
  return [...INVASIVE_SPECIES_BY_HABITAT[habitat], ...INVASIVE_SPECIES_BY_HABITAT.both];
}

function generateEventId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createRandomEvent(currentTime: number): EcologicalEvent | null {
  const eventTypes: EcologicalEventType[] = ['red_tide', 'invasive_species', 'water_purification'];
  
  for (const type of eventTypes) {
    const config = EVENT_CONFIGS[type];
    if (Math.random() < config.probability) {
      const duration = config.minDuration + Math.floor(Math.random() * (config.maxDuration - config.minDuration));
      return {
        id: generateEventId(),
        type,
        name: config.name,
        description: config.description,
        color: config.color,
        startTime: currentTime,
        duration,
        intensity: 0.5 + Math.random() * 0.5,
      };
    }
  }
  return null;
}

function applyEventEffects(
  event: EcologicalEvent,
  currentTime: number,
  state: ReturnType<typeof useEcosystemStore.getState>
): {
  updates: { id: string; updates: Partial<Organism> }[];
  toRemove: string[];
  toAdd: { speciesId: string; position: THREE.Vector3 }[];
  waterColor?: string;
} {
  const updates: { id: string; updates: Partial<Organism> }[] = [];
  const toRemove: string[] = [];
  const toAdd: { speciesId: string; position: THREE.Vector3 }[] = [];
  let waterColor: string | undefined;

  const progress = (currentTime - event.startTime) / event.duration;
  const intensityFactor = event.intensity * (1 - Math.abs(progress - 0.5) * 2);

  switch (event.type) {
    case 'red_tide': {
      waterColor = `rgb(${Math.floor(180 + intensityFactor * 75)}, ${Math.floor(60 - intensityFactor * 40)}, ${Math.floor(80 - intensityFactor * 50)})`;
      
      state.organisms.forEach((org) => {
        const species = org.speciesId;
        if (species === 'seaweed' || species === 'grass' || species === 'polluted_algae') {
          updates.push({ id: org.id, updates: { energy: Math.min(org.energy + 0.3 * intensityFactor, 150) } });
        } else if (species === 'fish' || species === 'tadpole' || species === 'shrimp') {
          if (Math.random() < 0.02 * intensityFactor) {
            toRemove.push(org.id);
          } else {
            updates.push({ id: org.id, updates: { energy: Math.max(0, org.energy - 0.15 * intensityFactor) } });
          }
        }
      });

      if (Math.random() < 0.05 * intensityFactor) {
        const pos = new THREE.Vector3(
          AQUARIUM_BOUNDS.minX + Math.random() * (AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX),
          AQUARIUM_BOUNDS.minY + 0.2 + Math.random() * 0.5,
          AQUARIUM_BOUNDS.minZ + Math.random() * (AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ)
        );
        toAdd.push({ speciesId: 'polluted_algae', position: pos });
      }
      break;
    }

    case 'invasive_species': {
      const preset = state.getCurrentPreset();
      const habitat = inferHabitatFromPreset(preset);
      const invasiveSpeciesIds = getInvasiveSpeciesForHabitat(habitat);

      if (Math.random() < 0.08 * intensityFactor && invasiveSpeciesIds.length > 0) {
        const invasiveId = invasiveSpeciesIds[Math.floor(Math.random() * invasiveSpeciesIds.length)];
        const species = getSpeciesById(invasiveId);
        const isProducer = species?.trophicLevel === 'producer';
        const minY = isProducer ? AQUARIUM_BOUNDS.minY : AQUARIUM_BOUNDS.minY + 0.3;
        const maxY = isProducer ? AQUARIUM_BOUNDS.minY + 0.5 : AQUARIUM_BOUNDS.maxY - 0.3;

        const pos = new THREE.Vector3(
          AQUARIUM_BOUNDS.minX + Math.random() * (AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX),
          minY + Math.random() * (maxY - minY),
          AQUARIUM_BOUNDS.minZ + Math.random() * (AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ)
        );
        toAdd.push({ speciesId: invasiveId, position: pos });
      }

      state.organisms.forEach((org) => {
        if (invasiveSpeciesIds.includes(org.speciesId)) {
          updates.push({ id: org.id, updates: { energy: Math.min(org.energy + 0.2 * intensityFactor, 150) } });
        } else if (Math.random() < 0.01 * intensityFactor) {
          updates.push({ id: org.id, updates: { energy: Math.max(0, org.energy - 0.1 * intensityFactor) } });
        }
      });
      break;
    }

    case 'water_purification': {
      waterColor = `rgb(${Math.floor(100 - intensityFactor * 50)}, ${Math.floor(180 + intensityFactor * 40)}, ${Math.floor(200 + intensityFactor * 55)})`;
      
      state.organisms.forEach((org) => {
        const species = org.speciesId;
        if (species === 'bacteria' || species === 'tubifex' || species === 'earthworm') {
          updates.push({ id: org.id, updates: { energy: Math.min(org.energy + 0.3 * intensityFactor, 150) } });
        } else if (species === 'polluted_algae' || species === 'mosquito_larva') {
          if (Math.random() < 0.04 * intensityFactor) {
            toRemove.push(org.id);
          }
        } else {
          updates.push({ id: org.id, updates: { energy: Math.min(org.energy + 0.08 * intensityFactor, 150) } });
        }
      });
      break;
    }
  }

  return { updates, toRemove, toAdd, waterColor };
}

export function useEcosystemSimulation() {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastSnapshotTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(true);
  const isRewindingRef = useRef<boolean>(false);

  const batchUpdateOrganisms = useEcosystemStore((s) => s.batchUpdateOrganisms);
  const batchRemoveOrganisms = useEcosystemStore((s) => s.batchRemoveOrganisms);
  const addOrganism = useEcosystemStore((s) => s.addOrganism);
  const incrementTime = useEcosystemStore((s) => s.incrementTime);
  const isRunning = useEcosystemStore((s) => s.isRunning);
  const isRewinding = useEcosystemStore((s) => s.isRewinding);
  const triggerEvent = useEcosystemStore((s) => s.triggerEvent);
  const clearEvent = useEcosystemStore((s) => s.clearEvent);
  const setWaterColor = useEcosystemStore((s) => s.setWaterColor);
  const recordSnapshot = useEcosystemStore((s) => s.recordSnapshot);
  const checkChallenges = useEcosystemStore((s) => s.checkChallenges);
  const waterTemperature = useEcosystemStore((s) => s.waterTemperature);
  const lightIntensity = useEcosystemStore((s) => s.lightIntensity);

  const SNAPSHOT_INTERVAL = 5;

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    isRewindingRef.current = isRewinding;
  }, [isRewinding]);

  useEffect(() => {
    const tick = (time: number) => {
      if (!isRewindingRef.current && isRunningRef.current && time - lastTimeRef.current > 60) {
        lastTimeRef.current = time;

        const state = useEcosystemStore.getState();
        const currentTime = state.simulationTime;
        let activeEvent = state.activeEvent;

        if (!activeEvent) {
          const newEvent = createRandomEvent(currentTime);
          if (newEvent) {
            triggerEvent(newEvent);
            activeEvent = newEvent;
          }
        } else {
          const eventEnded = currentTime >= activeEvent.startTime + activeEvent.duration;
          if (eventEnded) {
            clearEvent();
            setWaterColor(state.currentPresetId ? 
              (state.getCurrentPreset()?.waterColor || '#22D3EE') : '#22D3EE'
            );
            activeEvent = null;
          }
        }

        const organisms = state.organisms;
        const { updates, toRemove, toAdd } = simulateStep(organisms, waterTemperature, lightIntensity);

        if (activeEvent) {
          const eventEffects = applyEventEffects(activeEvent, currentTime, state);
          
          if (eventEffects.waterColor) {
            setWaterColor(eventEffects.waterColor);
          }

          eventEffects.updates.forEach((eu) => {
            const existing = updates.find((u) => u.id === eu.id);
            if (existing) {
              existing.updates = { ...existing.updates, ...eu.updates };
            } else {
              updates.push(eu);
            }
          });

          eventEffects.toRemove.forEach((id) => {
            if (!toRemove.includes(id)) {
              toRemove.push(id);
            }
          });

          eventEffects.toAdd.forEach((add) => {
            toAdd.push(add);
          });
        }

        if (updates.length > 0) {
          batchUpdateOrganisms(updates);
        }
        if (toRemove.length > 0) {
          batchRemoveOrganisms(toRemove);
        }

        if (toAdd.length > 0 && !state.seenTips.has('first_reproduction')) {
          state.showTeachingTip('first_reproduction');
        }

        if (toRemove.length > 0) {
          const afterRemoveSpecies = new Set(
            organisms
              .filter((o) => !toRemove.includes(o.id))
              .map((o) => o.speciesId),
          );
          const beforeSpecies = new Set(organisms.map((o) => o.speciesId));
          const extinctSpecies = [...beforeSpecies].filter(
            (id) => !afterRemoveSpecies.has(id),
          );
          if (extinctSpecies.length > 0 && !state.seenTips.has('first_species_extinction')) {
            state.showTeachingTip('first_species_extinction');
          }
        }

        toAdd.forEach(({ speciesId, position }) => {
          addOrganism(speciesId, position);
        });

        incrementTime();
        checkChallenges();

        const afterState = useEcosystemStore.getState();
        if (
          afterState.getStats().balanceIndex >= 60 &&
          !afterState.seenTips.has('first_balance_achieved')
        ) {
          afterState.showTeachingTip('first_balance_achieved');
        }

        if (currentTime - lastSnapshotTimeRef.current >= SNAPSHOT_INTERVAL) {
          lastSnapshotTimeRef.current = currentTime;
          recordSnapshot();
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [batchUpdateOrganisms, batchRemoveOrganisms, addOrganism, incrementTime, triggerEvent, clearEvent, setWaterColor, recordSnapshot, checkChallenges, waterTemperature, lightIntensity]);
}
