import { useEffect, useRef } from 'react';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { simulateStep } from '@/utils/ecosystemSimulator';

export function useEcosystemSimulation() {
  const {
    organisms,
    isRunning,
    batchUpdateOrganisms,
    batchRemoveOrganisms,
    addOrganism,
    incrementTime,
  } = useEcosystemStore();

  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      return;
    }

    const tick = (time: number) => {
      if (time - lastTimeRef.current > 60) {
        lastTimeRef.current = time;

        const { updates, toRemove, toAdd } = simulateStep(organisms);

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
  }, [isRunning, organisms, batchUpdateOrganisms, batchRemoveOrganisms, addOrganism, incrementTime]);
}
