import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  getPresentSpecies,
  computeFoodChainRelations,
  computeLongestFoodChain,
  countTrophicLevels,
  getTrophicLevelCounts,
} from '../foodChain';
import type { Organism } from '@/types/ecosystem';

function createTestOrganism(id: string, speciesId: string): Organism {
  return {
    id,
    speciesId,
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    energy: 50,
    age: 10,
    state: 'idle',
    targetId: null,
    rotation: 0,
    scale: 1,
  };
}

describe('foodChain utilities', () => {
  describe('getPresentSpecies', () => {
    it('should return empty array when no organisms', () => {
      const result = getPresentSpecies([]);
      expect(result).toEqual([]);
    });

    it('should return unique species IDs', () => {
      const organisms = [
        createTestOrganism('1', 'seaweed'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'seaweed'),
        createTestOrganism('4', 'bigfish'),
        createTestOrganism('5', 'fish'),
      ];

      const result = getPresentSpecies(organisms);
      expect(result).toHaveLength(3);
      expect(result).toContain('seaweed');
      expect(result).toContain('fish');
      expect(result).toContain('bigfish');
    });

    it('should return single species when all organisms are same species', () => {
      const organisms = [
        createTestOrganism('1', 'fish'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'fish'),
      ];

      const result = getPresentSpecies(organisms);
      expect(result).toEqual(['fish']);
    });
  });

  describe('computeFoodChainRelations', () => {
    it('should return empty array when no organisms', () => {
      const result = computeFoodChainRelations([]);
      expect(result).toEqual([]);
    });

    it('should find predator-prey relations', () => {
      const organisms = [
        createTestOrganism('1', 'bigfish'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'seaweed'),
      ];

      const result = computeFoodChainRelations(organisms);

      const bigfishEatsFish = result.some(
        (r) => r.predatorId === 'bigfish' && r.preyId === 'fish'
      );
      const fishEatsSeaweed = result.some(
        (r) => r.predatorId === 'fish' && r.preyId === 'seaweed'
      );

      expect(bigfishEatsFish).toBe(true);
      expect(fishEatsSeaweed).toBe(true);
    });

    it('should not include relations where prey is not present', () => {
      const organisms = [
        createTestOrganism('1', 'bigfish'),
        createTestOrganism('2', 'seaweed'),
      ];

      const result = computeFoodChainRelations(organisms);

      const bigfishEatsFish = result.some(
        (r) => r.predatorId === 'bigfish' && r.preyId === 'fish'
      );

      expect(bigfishEatsFish).toBe(false);
    });

    it('should not have duplicate relations', () => {
      const organisms = [
        createTestOrganism('1', 'fish'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'seaweed'),
        createTestOrganism('4', 'seaweed'),
      ];

      const result = computeFoodChainRelations(organisms);
      const fishEatsSeaweed = result.filter(
        (r) => r.predatorId === 'fish' && r.preyId === 'seaweed'
      );

      expect(fishEatsSeaweed).toHaveLength(1);
    });

    it('should handle producers with no diet', () => {
      const organisms = [createTestOrganism('1', 'seaweed')];

      const result = computeFoodChainRelations(organisms);
      expect(result).toEqual([]);
    });
  });

  describe('computeLongestFoodChain', () => {
    it('should return 0 when no organisms', () => {
      const result = computeLongestFoodChain([]);
      expect(result).toBe(0);
    });

    it('should return 1 for single species with no prey', () => {
      const organisms = [createTestOrganism('1', 'seaweed')];

      const result = computeLongestFoodChain(organisms);
      expect(result).toBe(1);
    });

    it('should return 2 for simple two-level chain', () => {
      const organisms = [
        createTestOrganism('1', 'fish'),
        createTestOrganism('2', 'seaweed'),
      ];

      const result = computeLongestFoodChain(organisms);
      expect(result).toBe(2);
    });

    it('should return 3 for three-level chain', () => {
      const organisms = [
        createTestOrganism('1', 'bigfish'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'seaweed'),
      ];

      const result = computeLongestFoodChain(organisms);
      expect(result).toBe(3);
    });

    it('should find the longest chain among multiple chains', () => {
      const organisms = [
        createTestOrganism('1', 'bigfish'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'seaweed'),
        createTestOrganism('4', 'snail'),
        createTestOrganism('5', 'grass'),
      ];

      const result = computeLongestFoodChain(organisms);
      expect(result).toBe(3);
    });
  });

  describe('countTrophicLevels', () => {
    it('should return 0 when no organisms', () => {
      const result = countTrophicLevels([]);
      expect(result).toBe(0);
    });

    it('should return 1 for single trophic level', () => {
      const organisms = [
        createTestOrganism('1', 'seaweed'),
        createTestOrganism('2', 'grass'),
      ];

      const result = countTrophicLevels(organisms);
      expect(result).toBe(1);
    });

    it('should count multiple trophic levels', () => {
      const organisms = [
        createTestOrganism('1', 'seaweed'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'bigfish'),
        createTestOrganism('4', 'bacteria'),
      ];

      const result = countTrophicLevels(organisms);
      expect(result).toBe(4);
    });

    it('should return 5 for all five trophic levels', () => {
      const organisms = [
        createTestOrganism('1', 'seaweed'),
        createTestOrganism('2', 'fish'),
        createTestOrganism('3', 'ant'),
        createTestOrganism('4', 'bigfish'),
        createTestOrganism('5', 'bacteria'),
      ];

      const result = countTrophicLevels(organisms);
      expect(result).toBe(5);
    });
  });

  describe('getTrophicLevelCounts', () => {
    it('should return all zeros when no organisms', () => {
      const result = getTrophicLevelCounts([]);
      expect(result.producer).toBe(0);
      expect(result.herbivore).toBe(0);
      expect(result.carnivore).toBe(0);
      expect(result.decomposer).toBe(0);
      expect(result.omnivore).toBe(0);
    });

    it('should count organisms by trophic level', () => {
      const organisms = [
        createTestOrganism('1', 'seaweed'),
        createTestOrganism('2', 'grass'),
        createTestOrganism('3', 'fish'),
        createTestOrganism('4', 'bigfish'),
        createTestOrganism('5', 'bacteria'),
        createTestOrganism('6', 'ant'),
        createTestOrganism('7', 'snail'),
      ];

      const result = getTrophicLevelCounts(organisms);
      expect(result.producer).toBe(2);
      expect(result.herbivore).toBe(2);
      expect(result.carnivore).toBe(1);
      expect(result.decomposer).toBe(1);
      expect(result.omnivore).toBe(1);
    });

    it('should always return all five trophic level keys', () => {
      const organisms = [createTestOrganism('1', 'seaweed')];

      const result = getTrophicLevelCounts(organisms);
      expect(Object.keys(result)).toEqual([
        'producer',
        'herbivore',
        'omnivore',
        'carnivore',
        'decomposer',
      ]);
    });
  });
});
