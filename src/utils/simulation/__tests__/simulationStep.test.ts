import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { simulateStep } from '../simulationStep';
import type { Organism } from '@/types/ecosystem';
import { getSpeciesById } from '@/data/species';

function createTestOrganism(
  id: string,
  speciesId: string,
  overrides: Partial<Organism> = {}
): Organism {
  const species = getSpeciesById(speciesId)!;
  return {
    id,
    speciesId,
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0.01, 0, 0.01),
    energy: species.energyValue,
    age: 0,
    state: 'idle',
    targetId: null,
    rotation: 0,
    scale: 1,
    ...overrides,
  };
}

describe('simulationStep', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic simulation', () => {
    it('should return empty results for empty organism list', () => {
      const result = simulateStep([], 24, 0.7);
      expect(result.updates).toEqual([]);
      expect(result.toRemove).toEqual([]);
      expect(result.toAdd).toEqual([]);
      expect(result.environmentalEffects).toEqual([]);
    });

    it('should increment age of organisms', () => {
      const organism = createTestOrganism('org-1', 'fish', { age: 10 });
      const result = simulateStep([organism], 24, 0.7);

      const update = result.updates.find((u) => u.id === 'org-1');
      expect(update?.updates.age).toBe(11);
    });

    it('should consume energy each step', () => {
      const organism = createTestOrganism('org-1', 'fish', { energy: 50 });
      const result = simulateStep([organism], 24, 0.7);

      const update = result.updates.find((u) => u.id === 'org-1');
      expect(update?.updates.energy).toBeLessThan(50);
    });

    it('should clamp energy between 0 and max', () => {
      const organism = createTestOrganism('org-1', 'fish', { energy: 1000 });
      const result = simulateStep([organism], 24, 0.7);

      const update = result.updates.find((u) => u.id === 'org-1');
      const species = getSpeciesById('fish')!;
      expect(update?.updates.energy).toBeLessThanOrEqual(species.energyValue * 1.5);
      expect(update?.updates.energy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('death conditions', () => {
    it('should remove organism when energy reaches 0', () => {
      const organism = createTestOrganism('org-1', 'fish', { energy: 0 });
      const result = simulateStep([organism], 24, 0.7);

      expect(result.toRemove).toContain('org-1');
    });

    it('should remove organism when age exceeds lifespan', () => {
      const species = getSpeciesById('fish')!;
      const organism = createTestOrganism('org-1', 'fish', {
        age: species.lifespan * 2,
        energy: 50,
      });
      const result = simulateStep([organism], 24, 0.7);

      expect(result.toRemove).toContain('org-1');
    });

    it('should not remove young healthy organisms', () => {
      const organism = createTestOrganism('org-1', 'fish', { age: 10, energy: 50 });
      const result = simulateStep([organism], 24, 0.7);

      expect(result.toRemove).not.toContain('org-1');
    });

    it('should not include dead organisms in updates', () => {
      const organism = createTestOrganism('org-1', 'fish', { energy: 0 });
      const result = simulateStep([organism], 24, 0.7);

      const update = result.updates.find((u) => u.id === 'org-1');
      expect(update).toBeUndefined();
    });
  });

  describe('producer simulation', () => {
    it('should increase energy during daytime', () => {
      const organism = createTestOrganism('org-1', 'seaweed', { energy: 20 });
      const result = simulateStep([organism], 22, 0.7, true, 1.0);

      const update = result.updates.find((u) => u.id === 'org-1');
      expect(update?.updates.energy).toBeGreaterThan(20);
    });

    it('should decrease energy during nighttime', () => {
      const organism = createTestOrganism('org-1', 'seaweed', { energy: 20 });
      const result = simulateStep([organism], 22, 0.7, false, 0.2);

      const update = result.updates.find((u) => u.id === 'org-1');
      expect(update?.updates.energy).toBeLessThan(20);
    });

    it('should have idle state during daytime', () => {
      const organism = createTestOrganism('org-1', 'seaweed');
      const result = simulateStep([organism], 22, 0.7, true);

      const update = result.updates.find((u) => u.id === 'org-1');
      expect(update?.updates.state).toBe('idle');
    });

    it('should have sleeping state during nighttime', () => {
      const organism = createTestOrganism('org-1', 'seaweed');
      const result = simulateStep([organism], 22, 0.7, false);

      const update = result.updates.find((u) => u.id === 'org-1');
      expect(update?.updates.state).toBe('sleeping');
    });
  });

  describe('consumer simulation', () => {
    it('should be in wandering state when no prey or predator nearby', () => {
      const organism = createTestOrganism('fish-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
      });
      const result = simulateStep([organism], 24, 0.6);

      const update = result.updates.find((u) => u.id === 'fish-1');
      expect(update?.updates.state).toBe('wandering');
    });

    it('should hunt when prey is nearby and energy is low', () => {
      const predator = createTestOrganism('pred-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
        energy: 10,
      });
      const prey = createTestOrganism('prey-1', 'seaweed', {
        position: new THREE.Vector3(1, 0, 0),
      });

      const result = simulateStep([predator, prey], 24, 0.6);

      const predatorUpdate = result.updates.find((u) => u.id === 'pred-1');
      expect(predatorUpdate?.updates.state).toBe('hunting');
      expect(predatorUpdate?.updates.targetId).toBe('prey-1');
    });

    it('should flee when predator is nearby', () => {
      const prey = createTestOrganism('prey-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
      });
      const predator = createTestOrganism('pred-1', 'bigfish', {
        position: new THREE.Vector3(1, 0, 0),
      });

      const result = simulateStep([prey, predator], 24, 0.6);

      const preyUpdate = result.updates.find((u) => u.id === 'prey-1');
      expect(preyUpdate?.updates.state).toBe('fleeing');
    });

    it('should eat prey when close enough', () => {
      const predator = createTestOrganism('pred-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
        energy: 10,
      });
      const prey = createTestOrganism('prey-1', 'seaweed', {
        position: new THREE.Vector3(0.2, 0, 0),
      });

      const result = simulateStep([predator, prey], 24, 0.6);

      const predatorUpdate = result.updates.find((u) => u.id === 'pred-1');
      expect(predatorUpdate?.updates.state).toBe('eating');
      expect(result.toRemove).toContain('prey-1');
    });

    it('should gain energy from eating prey', () => {
      const predator = createTestOrganism('pred-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
        energy: 10,
      });
      const prey = createTestOrganism('prey-1', 'seaweed', {
        position: new THREE.Vector3(0.2, 0, 0),
      });

      const result = simulateStep([predator, prey], 24, 0.6);

      const predatorUpdate = result.updates.find((u) => u.id === 'pred-1');
      expect(predatorUpdate?.updates.energy).toBeGreaterThan(10);
    });

    it('should sleep at night for non-nocturnal species', () => {
      const organism = createTestOrganism('fish-1', 'fish');
      const result = simulateStep([organism], 24, 0.6, false);

      const update = result.updates.find((u) => u.id === 'fish-1');
      expect(update?.updates.state).toBe('sleeping');
    });

    it('should be active at night for nocturnal species', () => {
      const organism = createTestOrganism('jelly-1', 'jellyfish');
      const result = simulateStep([organism], 20, 0.4, false);

      const update = result.updates.find((u) => u.id === 'jelly-1');
      expect(update?.updates.state).not.toBe('sleeping');
    });

    it('should not hunt when energy is high', () => {
      const predator = createTestOrganism('pred-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
        energy: 100,
      });
      const prey = createTestOrganism('prey-1', 'seaweed', {
        position: new THREE.Vector3(1, 0, 0),
      });

      const result = simulateStep([predator, prey], 24, 0.6);

      const predatorUpdate = result.updates.find((u) => u.id === 'pred-1');
      expect(predatorUpdate?.updates.state).toBe('wandering');
    });
  });

  describe('decomposer simulation', () => {
    it('should wander when no dead organisms nearby', () => {
      const decomposer = createTestOrganism('decomp-1', 'bacteria', {
        position: new THREE.Vector3(0, 0, 0),
        energy: 2,
      });
      const result = simulateStep([decomposer], 25, 0.5);

      const update = result.updates.find((u) => u.id === 'decomp-1');
      expect(update?.updates.state).toBe('wandering');
    });

    it('should seek out dead organisms', () => {
      const dying = createTestOrganism('dying-1', 'fish', {
        position: new THREE.Vector3(1, 0, 0),
        energy: 0,
      });
      const decomposer = createTestOrganism('decomp-1', 'bacteria', {
        position: new THREE.Vector3(0, 0, 0),
        energy: 2,
      });

      const result = simulateStep([dying, decomposer], 25, 0.5);

      const decomposerUpdate = result.updates.find((u) => u.id === 'decomp-1');
      expect(decomposerUpdate?.updates.state).toBe('hunting');
      expect(decomposerUpdate?.updates.targetId).toBe('dying-1');
    });

    it('should gain energy from decomposing dead organisms', () => {
      const dying = createTestOrganism('dying-1', 'fish', {
        position: new THREE.Vector3(0.2, 0, 0),
        energy: 0,
      });
      const decomposer = createTestOrganism('decomp-1', 'bacteria', {
        position: new THREE.Vector3(0, 0, 0),
        energy: 2,
      });

      const result = simulateStep([dying, decomposer], 25, 0.5);

      const decomposerUpdate = result.updates.find((u) => u.id === 'decomp-1');
      expect(decomposerUpdate?.updates.energy).toBeGreaterThan(2);
      expect(decomposerUpdate?.updates.state).toBe('eating');
    });

    it('should not seek dead when energy is high', () => {
      const decomposer = createTestOrganism('decomp-1', 'bacteria', {
        position: new THREE.Vector3(0, 0, 0),
        energy: 5,
      });
      const dying = createTestOrganism('dying-1', 'fish', {
        position: new THREE.Vector3(1, 0, 0),
        energy: 0,
      });

      const result = simulateStep([decomposer, dying], 25, 0.5);

      const decomposerUpdate = result.updates.find((u) => u.id === 'decomp-1');
      expect(decomposerUpdate?.updates.state).toBe('wandering');
    });

    it('should sleep at night', () => {
      const decomposer = createTestOrganism('decomp-1', 'bacteria');
      const result = simulateStep([decomposer], 25, 0.5, false);

      const update = result.updates.find((u) => u.id === 'decomp-1');
      expect(update?.updates.state).toBe('sleeping');
    });
  });

  describe('reproduction', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    it('should reproduce when energy is high enough and random chance succeeds', () => {
      const organism = createTestOrganism('org-1', 'seaweed', {
        energy: getSpeciesById('seaweed')!.energyValue * 1.2,
      });
      const result = simulateStep([organism], 22, 0.7, true, 1.0);

      expect(result.toAdd.length).toBeGreaterThan(0);
      expect(result.toAdd[0].speciesId).toBe('seaweed');
    });

    it('should reduce parent energy after reproduction', () => {
      const species = getSpeciesById('seaweed')!;
      const organism = createTestOrganism('org-1', 'seaweed', {
        energy: species.energyValue * 1.2,
      });
      const result = simulateStep([organism], 22, 0.7, true, 1.0);

      const update = result.updates.find((u) => u.id === 'org-1');
      expect(update?.updates.energy).toBeLessThan(species.energyValue * 1.2);
    });

    it('should not reproduce when energy is too low', () => {
      const organism = createTestOrganism('org-1', 'seaweed', {
        energy: 10,
      });
      const result = simulateStep([organism], 22, 0.7, true, 1.0);

      expect(result.toAdd).toEqual([]);
    });

    it('should not reproduce when population is at max', () => {
      const species = getSpeciesById('seaweed')!;
      const organisms: Organism[] = [];
      for (let i = 0; i < species.maxPopulation; i++) {
        organisms.push(
          createTestOrganism(`org-${i}`, 'seaweed', {
            energy: species.energyValue * 1.2,
          })
        );
      }

      const result = simulateStep(organisms, 22, 0.7, true, 1.0);

      expect(result.toAdd).toEqual([]);
    });

    it('should not reproduce when random chance fails', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999);
      const species = getSpeciesById('seaweed')!;
      const organism = createTestOrganism('org-1', 'seaweed', {
        energy: species.energyValue * 1.2,
      });

      const result = simulateStep([organism], 22, 0.7, true, 1.0);

      expect(result.toAdd).toEqual([]);
    });
  });

  describe('environmental effects', () => {
    it('should include environmental effects for each species', () => {
      const organisms = [
        createTestOrganism('1', 'seaweed'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'seaweed'),
      ];

      const result = simulateStep(organisms, 24, 0.6);

      expect(result.environmentalEffects).toHaveLength(2);
    });

    it('should include fitness, temp status, and light status', () => {
      const organism = createTestOrganism('1', 'fish');
      const result = simulateStep([organism], 24, 0.6);

      const effect = result.environmentalEffects.find((e) => e.speciesId === 'fish');
      expect(effect).toBeDefined();
      expect(effect?.fitness).toBeDefined();
      expect(effect?.tempStatus).toBeDefined();
      expect(effect?.lightStatus).toBeDefined();
    });
  });

  describe('movement', () => {
    it('should update position for moving organisms', () => {
      const organism = createTestOrganism('fish-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0.01, 0, 0.01),
      });
      const result = simulateStep([organism], 24, 0.6);

      const update = result.updates.find((u) => u.id === 'fish-1');
      expect(update?.updates.position).toBeDefined();
      expect(update?.updates.position?.x).not.toBe(0);
    });

    it('should update velocity for moving organisms', () => {
      const organism = createTestOrganism('fish-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0.01, 0, 0.01),
      });
      const result = simulateStep([organism], 24, 0.6);

      const update = result.updates.find((u) => u.id === 'fish-1');
      expect(update?.updates.velocity).toBeDefined();
    });

    it('should update rotation for moving organisms', () => {
      const organism = createTestOrganism('fish-1', 'fish', {
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0.05, 0, 0),
      });
      const result = simulateStep([organism], 24, 0.6);

      const update = result.updates.find((u) => u.id === 'fish-1');
      expect(update?.updates.rotation).toBeDefined();
    });

    it('should not update position for stationary producers', () => {
      const organism = createTestOrganism('seaweed-1', 'seaweed', {
        position: new THREE.Vector3(0, 0, 0),
      });
      const result = simulateStep([organism], 22, 0.7, true);

      const update = result.updates.find((u) => u.id === 'seaweed-1');
      expect(update?.updates.position).toBeUndefined();
    });
  });

  describe('multiple organisms', () => {
    it('should process all organisms', () => {
      const organisms = [
        createTestOrganism('1', 'seaweed'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'bigfish'),
      ];

      const result = simulateStep(organisms, 24, 0.6);

      expect(result.updates).toHaveLength(3);
    });

    it('should only eat each prey once', () => {
      const prey = createTestOrganism('prey-1', 'seaweed', {
        position: new THREE.Vector3(0, 0, 0),
      });
      const predator1 = createTestOrganism('pred-1', 'fish', {
        position: new THREE.Vector3(0.2, 0, 0),
        energy: 10,
      });
      const predator2 = createTestOrganism('pred-2', 'fish', {
        position: new THREE.Vector3(-0.2, 0, 0),
        energy: 10,
      });

      const result = simulateStep([prey, predator1, predator2], 24, 0.6);

      const eatingCount = result.updates.filter(
        (u) => u.updates.state === 'eating'
      ).length;
      expect(eatingCount).toBeLessThanOrEqual(1);
    });
  });
});
