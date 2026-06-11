import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { simulateStep } from '@/utils/ecosystemSimulator';
import { AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';
import type { EcologicalEvent, EcologicalEventType } from '@/types/ecosystem';

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

const INVASIVE_SPECIES_IDS = ['jellyfish', 'polluted_algae', 'carp'];

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
  updates: { id: string; updates: Partial<any> }[];
  toRemove: string[];
  toAdd: { speciesId: string; position: THREE.Vector3 }[];
  waterColor?: string;
} {
  const updates: { id: string; updates: Partial<any> }[] = [];
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
      if (Math.random() < 0.08 * intensityFactor) {
        const invasiveId = INVASIVE_SPECIES_IDS[Math.floor(Math.random() * INVASIVE_SPECIES_IDS.length)];
        const pos = new THREE.Vector3(
          AQUARIUM_BOUNDS.minX + Math.random() * (AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX),
          AQUARIUM_BOUNDS.minY + 0.3 + Math.random() * (AQUARIUM_BOUNDS.maxY - AQUARIUM_BOUNDS.minY - 0.6),
          AQUARIUM_BOUNDS.minZ + Math.random() * (AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ)
        );
        toAdd.push({ speciesId: invasiveId, position: pos });
      }

      state.organisms.forEach((org) => {
        if (INVASIVE_SPECIES_IDS.includes(org.speciesId)) {
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
  const isRunningRef = useRef<boolean>(true);

  const batchUpdateOrganisms = useEcosystemStore((s) => s.batchUpdateOrganisms);
  const batchRemoveOrganisms = useEcosystemStore((s) => s.batchRemoveOrganisms);
  const addOrganism = useEcosystemStore((s) => s.addOrganism);
  const incrementTime = useEcosystemStore((s) => s.incrementTime);
  const isRunning = useEcosystemStore((s) => s.isRunning);
  const triggerEvent = useEcosystemStore((s) => s.triggerEvent);
  const clearEvent = useEcosystemStore((s) => s.clearEvent);
  const setWaterColor = useEcosystemStore((s) => s.setWaterColor);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    const tick = (time: number) => {
      if (isRunningRef.current && time - lastTimeRef.current > 60) {
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
        const { updates, toRemove, toAdd } = simulateStep(organisms);

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
        toAdd.forEach(({ speciesId, position }) => {
          addOrganism(speciesId, position);
        });

        incrementTime();
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [batchUpdateOrganisms, batchRemoveOrganisms, addOrganism, incrementTime, triggerEvent, clearEvent, setWaterColor]);
}
