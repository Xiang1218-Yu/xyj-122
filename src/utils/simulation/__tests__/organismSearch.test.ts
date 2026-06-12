import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  findNearestPrey,
  findNearestPredator,
  findNearestDead,
  steerToward,
  steerAway,
} from '../organismSearch';
import type { Organism } from '@/types/ecosystem';

function createTestOrganism(
  id: string,
  speciesId: string,
  x: number,
  y: number,
  z: number
): Organism {
  return {
    id,
    speciesId,
    position: new THREE.Vector3(x, y, z),
    velocity: new THREE.Vector3(0, 0, 0),
    energy: 50,
    age: 10,
    state: 'idle',
    targetId: null,
    rotation: 0,
    scale: 1,
  };
}

describe('organismSearch utilities', () => {
  describe('findNearestPrey', () => {
    it('should return null when species has no diet', () => {
      const organism = createTestOrganism('predator-1', 'seaweed', 0, 0, 0);
      const allOrganisms = [organism];
      const excludedIds = new Set<string>();

      const result = findNearestPrey(organism, allOrganisms, excludedIds);
      expect(result).toBeNull();
    });

    it('should return null when no prey is in range', () => {
      const predator = createTestOrganism('predator-1', 'fish', 0, 0, 0);
      const prey = createTestOrganism('prey-1', 'seaweed', 10, 0, 0);
      const allOrganisms = [predator, prey];
      const excludedIds = new Set<string>();

      const result = findNearestPrey(predator, allOrganisms, excludedIds);
      expect(result).toBeNull();
    });

    it('should find the nearest prey', () => {
      const predator = createTestOrganism('predator-1', 'fish', 0, 0, 0);
      const prey1 = createTestOrganism('prey-1', 'seaweed', 2, 0, 0);
      const prey2 = createTestOrganism('prey-2', 'seaweed', 1, 0, 0);
      const allOrganisms = [predator, prey1, prey2];
      const excludedIds = new Set<string>();

      const result = findNearestPrey(predator, allOrganisms, excludedIds);
      expect(result?.id).toBe('prey-2');
    });

    it('should exclude specified prey IDs', () => {
      const predator = createTestOrganism('predator-1', 'fish', 0, 0, 0);
      const prey1 = createTestOrganism('prey-1', 'seaweed', 1, 0, 0);
      const prey2 = createTestOrganism('prey-2', 'seaweed', 2, 0, 0);
      const allOrganisms = [predator, prey1, prey2];
      const excludedIds = new Set(['prey-1']);

      const result = findNearestPrey(predator, allOrganisms, excludedIds);
      expect(result?.id).toBe('prey-2');
    });

    it('should return null when all prey are excluded', () => {
      const predator = createTestOrganism('predator-1', 'fish', 0, 0, 0);
      const prey1 = createTestOrganism('prey-1', 'seaweed', 1, 0, 0);
      const prey2 = createTestOrganism('prey-2', 'seaweed', 2, 0, 0);
      const allOrganisms = [predator, prey1, prey2];
      const excludedIds = new Set(['prey-1', 'prey-2']);

      const result = findNearestPrey(predator, allOrganisms, excludedIds);
      expect(result).toBeNull();
    });

    it('should not include the organism itself', () => {
      const predator = createTestOrganism('predator-1', 'fish', 0, 0, 0);
      const allOrganisms = [predator];
      const excludedIds = new Set<string>();

      const result = findNearestPrey(predator, allOrganisms, excludedIds);
      expect(result).toBeNull();
    });
  });

  describe('findNearestPredator', () => {
    it('should return null when species has no predators', () => {
      const organism = createTestOrganism('org-1', 'bigfish', 0, 0, 0);
      const allOrganisms = [organism];

      const result = findNearestPredator(organism, allOrganisms);
      expect(result).toBeNull();
    });

    it('should find the nearest predator', () => {
      const prey = createTestOrganism('prey-1', 'fish', 0, 0, 0);
      const predator1 = createTestOrganism('pred-1', 'bigfish', 3, 0, 0);
      const predator2 = createTestOrganism('pred-2', 'bigfish', 2, 0, 0);
      const allOrganisms = [prey, predator1, predator2];

      const result = findNearestPredator(prey, allOrganisms);
      expect(result?.id).toBe('pred-2');
    });

    it('should return null when no predator is in range', () => {
      const prey = createTestOrganism('prey-1', 'fish', 0, 0, 0);
      const predator = createTestOrganism('pred-1', 'bigfish', 10, 0, 0);
      const allOrganisms = [prey, predator];

      const result = findNearestPredator(prey, allOrganisms);
      expect(result).toBeNull();
    });

    it('should not include the organism itself', () => {
      const predator = createTestOrganism('pred-1', 'bigfish', 0, 0, 0);
      const allOrganisms = [predator];

      const result = findNearestPredator(predator, allOrganisms);
      expect(result).toBeNull();
    });
  });

  describe('findNearestDead', () => {
    it('should return null when no dying organisms', () => {
      const organism = createTestOrganism('org-1', 'bacteria', 0, 0, 0);
      const allOrganisms = [organism];
      const dyingIds = new Set<string>();

      const result = findNearestDead(organism, allOrganisms, dyingIds);
      expect(result).toBeNull();
    });

    it('should find the nearest dead organism', () => {
      const decomposer = createTestOrganism('decomp-1', 'bacteria', 0, 0, 0);
      const dead1 = createTestOrganism('dead-1', 'fish', 2, 0, 0);
      const dead2 = createTestOrganism('dead-2', 'fish', 1, 0, 0);
      const allOrganisms = [decomposer, dead1, dead2];
      const dyingIds = new Set(['dead-1', 'dead-2']);

      const result = findNearestDead(decomposer, allOrganisms, dyingIds);
      expect(result?.id).toBe('dead-2');
    });

    it('should return null when dead organism is out of range', () => {
      const decomposer = createTestOrganism('decomp-1', 'bacteria', 0, 0, 0);
      const dead = createTestOrganism('dead-1', 'fish', 10, 0, 0);
      const allOrganisms = [decomposer, dead];
      const dyingIds = new Set(['dead-1']);

      const result = findNearestDead(decomposer, allOrganisms, dyingIds);
      expect(result).toBeNull();
    });

    it('should only return organisms in dying set', () => {
      const decomposer = createTestOrganism('decomp-1', 'bacteria', 0, 0, 0);
      const alive = createTestOrganism('alive-1', 'fish', 1, 0, 0);
      const dead = createTestOrganism('dead-1', 'fish', 2, 0, 0);
      const allOrganisms = [decomposer, alive, dead];
      const dyingIds = new Set(['dead-1']);

      const result = findNearestDead(decomposer, allOrganisms, dyingIds);
      expect(result?.id).toBe('dead-1');
    });
  });

  describe('steerToward', () => {
    it('should adjust velocity toward the target', () => {
      const organism = createTestOrganism('org-1', 'fish', 0, 0, 0);
      const target = createTestOrganism('target-1', 'seaweed', 1, 0, 0);
      const velocity = new THREE.Vector3(0, 0, 0);
      const effectiveSpeed = 0.1;

      steerToward(organism, target, effectiveSpeed, velocity);

      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBeCloseTo(0, 5);
      expect(velocity.z).toBeCloseTo(0, 5);
    });

    it('should not have velocity exceed effective speed', () => {
      const organism = createTestOrganism('org-1', 'fish', 0, 0, 0);
      const target = createTestOrganism('target-1', 'seaweed', 1, 1, 1);
      const velocity = new THREE.Vector3(0, 0, 0);
      const effectiveSpeed = 0.1;

      steerToward(organism, target, effectiveSpeed, velocity, 1.0);

      expect(velocity.length()).toBeCloseTo(effectiveSpeed, 5);
    });

    it('should apply lerp factor correctly', () => {
      const organism = createTestOrganism('org-1', 'fish', 0, 0, 0);
      const target = createTestOrganism('target-1', 'seaweed', 1, 0, 0);
      const velocity = new THREE.Vector3(0, 0, 0);
      const effectiveSpeed = 0.1;

      const smallLerpVelocity = velocity.clone();
      steerToward(organism, target, effectiveSpeed, smallLerpVelocity, 0.1);

      const largeLerpVelocity = new THREE.Vector3(0, 0, 0);
      steerToward(organism, target, effectiveSpeed, largeLerpVelocity, 0.5);

      expect(Math.abs(smallLerpVelocity.x)).toBeLessThan(Math.abs(largeLerpVelocity.x));
    });
  });

  describe('steerAway', () => {
    it('should adjust velocity away from the threat', () => {
      const organism = createTestOrganism('org-1', 'fish', 0, 0, 0);
      const threat = createTestOrganism('threat-1', 'bigfish', 1, 0, 0);
      const velocity = new THREE.Vector3(0, 0, 0);
      const effectiveSpeed = 0.1;

      steerAway(organism, threat, effectiveSpeed, velocity);

      expect(velocity.x).toBeLessThan(0);
      expect(velocity.y).toBeCloseTo(0, 5);
      expect(velocity.z).toBeCloseTo(0, 5);
    });

    it('should not have velocity exceed effective speed', () => {
      const organism = createTestOrganism('org-1', 'fish', 0, 0, 0);
      const threat = createTestOrganism('threat-1', 'bigfish', 1, 1, 1);
      const velocity = new THREE.Vector3(0, 0, 0);
      const effectiveSpeed = 0.1;

      steerAway(organism, threat, effectiveSpeed, velocity, 1.0);

      expect(velocity.length()).toBeCloseTo(effectiveSpeed, 5);
    });

    it('should steer in opposite direction of steerToward', () => {
      const organism = createTestOrganism('org-1', 'fish', 0, 0, 0);
      const other = createTestOrganism('other-1', 'fish', 1, 0, 0);
      const velocityToward = new THREE.Vector3(0, 0, 0);
      const velocityAway = new THREE.Vector3(0, 0, 0);
      const effectiveSpeed = 0.1;

      steerToward(organism, other, effectiveSpeed, velocityToward, 1.0);
      steerAway(organism, other, effectiveSpeed, velocityAway, 1.0);

      expect(velocityToward.x).toBeCloseTo(-velocityAway.x, 5);
      expect(velocityToward.y).toBeCloseTo(-velocityAway.y, 5);
      expect(velocityToward.z).toBeCloseTo(-velocityAway.z, 5);
    });
  });
});
