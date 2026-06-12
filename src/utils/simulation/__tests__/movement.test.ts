import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  applyBoundaryConstraints,
  applyWanderingVelocity,
  computeRotation,
  moveOrganism,
} from '../movement';
import { AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';
import type { Organism } from '@/types/ecosystem';

describe('movement utilities', () => {
  describe('applyBoundaryConstraints', () => {
    it('should not change position when within bounds', () => {
      const position = new THREE.Vector3(0, 0, 0);
      const velocity = new THREE.Vector3(0.1, 0.1, 0.1);
      const originalPosition = position.clone();
      const originalVelocity = velocity.clone();

      applyBoundaryConstraints(position, velocity);

      expect(position.x).toBe(originalPosition.x);
      expect(position.y).toBe(originalPosition.y);
      expect(position.z).toBe(originalPosition.z);
      expect(velocity.x).toBe(originalVelocity.x);
      expect(velocity.y).toBe(originalVelocity.y);
      expect(velocity.z).toBe(originalVelocity.z);
    });

    it('should clamp position and reverse velocity at X min boundary', () => {
      const position = new THREE.Vector3(AQUARIUM_BOUNDS.minX - 1, 0, 0);
      const velocity = new THREE.Vector3(-0.5, 0.1, 0.1);

      applyBoundaryConstraints(position, velocity);

      expect(position.x).toBe(AQUARIUM_BOUNDS.minX + 0.3);
      expect(velocity.x).toBeGreaterThan(0);
    });

    it('should clamp position and reverse velocity at X max boundary', () => {
      const position = new THREE.Vector3(AQUARIUM_BOUNDS.maxX + 1, 0, 0);
      const velocity = new THREE.Vector3(0.5, 0.1, 0.1);

      applyBoundaryConstraints(position, velocity);

      expect(position.x).toBe(AQUARIUM_BOUNDS.maxX - 0.3);
      expect(velocity.x).toBeLessThan(0);
    });

    it('should clamp position and reverse velocity at Y min boundary', () => {
      const position = new THREE.Vector3(0, AQUARIUM_BOUNDS.minY - 1, 0);
      const velocity = new THREE.Vector3(0.1, -0.5, 0.1);

      applyBoundaryConstraints(position, velocity);

      expect(position.y).toBe(AQUARIUM_BOUNDS.minY + 0.2);
      expect(velocity.y).toBeGreaterThan(0);
    });

    it('should clamp position and reverse velocity at Y max boundary', () => {
      const position = new THREE.Vector3(0, AQUARIUM_BOUNDS.maxY + 1, 0);
      const velocity = new THREE.Vector3(0.1, 0.5, 0.1);

      applyBoundaryConstraints(position, velocity);

      expect(position.y).toBe(AQUARIUM_BOUNDS.maxY - 0.2);
      expect(velocity.y).toBeLessThan(0);
    });

    it('should clamp position and reverse velocity at Z min boundary', () => {
      const position = new THREE.Vector3(0, 0, AQUARIUM_BOUNDS.minZ - 1);
      const velocity = new THREE.Vector3(0.1, 0.1, -0.5);

      applyBoundaryConstraints(position, velocity);

      expect(position.z).toBe(AQUARIUM_BOUNDS.minZ + 0.3);
      expect(velocity.z).toBeGreaterThan(0);
    });

    it('should clamp position and reverse velocity at Z max boundary', () => {
      const position = new THREE.Vector3(0, 0, AQUARIUM_BOUNDS.maxZ + 1);
      const velocity = new THREE.Vector3(0.1, 0.1, 0.5);

      applyBoundaryConstraints(position, velocity);

      expect(position.z).toBe(AQUARIUM_BOUNDS.maxZ - 0.3);
      expect(velocity.z).toBeLessThan(0);
    });

    it('should use custom margin config', () => {
      const config = { marginX: 0.5, marginY: 0.5, marginZ: 0.5 };
      const position = new THREE.Vector3(AQUARIUM_BOUNDS.minX - 1, 0, 0);
      const velocity = new THREE.Vector3(-0.5, 0.1, 0.1);

      applyBoundaryConstraints(position, velocity, config);

      expect(position.x).toBe(AQUARIUM_BOUNDS.minX + 0.5);
    });

    it('should handle multiple boundary violations at once', () => {
      const position = new THREE.Vector3(
        AQUARIUM_BOUNDS.minX - 1,
        AQUARIUM_BOUNDS.maxY + 1,
        AQUARIUM_BOUNDS.minZ - 1
      );
      const velocity = new THREE.Vector3(-0.5, 0.5, -0.5);

      applyBoundaryConstraints(position, velocity);

      expect(position.x).toBe(AQUARIUM_BOUNDS.minX + 0.3);
      expect(position.y).toBe(AQUARIUM_BOUNDS.maxY - 0.2);
      expect(position.z).toBe(AQUARIUM_BOUNDS.minZ + 0.3);
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBeLessThan(0);
      expect(velocity.z).toBeGreaterThan(0);
    });
  });

  describe('applyWanderingVelocity', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should change velocity when random is below probability', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const velocity = new THREE.Vector3(0, 0, 0);
      const effectiveSpeed = 0.1;

      applyWanderingVelocity(velocity, effectiveSpeed, 1.0);

      expect(velocity.length()).toBeGreaterThan(0);
    });

    it('should not change velocity when random is above probability', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const velocity = new THREE.Vector3(0.1, 0.05, 0.1);
      const originalVelocity = velocity.clone();

      applyWanderingVelocity(velocity, 0.1, 0);

      expect(velocity.x).toBe(originalVelocity.x);
      expect(velocity.y).toBe(originalVelocity.y);
      expect(velocity.z).toBe(originalVelocity.z);
    });

    it('should use default probability of 0.02', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01);

      const velocity = new THREE.Vector3(0, 0, 0);

      applyWanderingVelocity(velocity, 0.1);

      expect(velocity.length()).toBeGreaterThan(0);
    });

    it('should have Y velocity at half the magnitude of X/Z', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const velocity = new THREE.Vector3(0, 0, 0);
      const effectiveSpeed = 0.1;

      applyWanderingVelocity(velocity, effectiveSpeed, 1.0);

      expect(Math.abs(velocity.y)).toBeLessThanOrEqual(effectiveSpeed * 0.5 + 0.001);
    });
  });

  describe('computeRotation', () => {
    it('should return 0 when moving along positive Z axis', () => {
      const velocity = new THREE.Vector3(0, 0, 1);
      expect(computeRotation(velocity)).toBe(0);
    });

    it('should return PI/2 when moving along positive X axis', () => {
      const velocity = new THREE.Vector3(1, 0, 0);
      expect(computeRotation(velocity)).toBe(Math.PI / 2);
    });

    it('should return PI when moving along negative Z axis', () => {
      const velocity = new THREE.Vector3(0, 0, -1);
      expect(computeRotation(velocity)).toBeCloseTo(Math.PI, 5);
    });

    it('should return -PI/2 when moving along negative X axis', () => {
      const velocity = new THREE.Vector3(-1, 0, 0);
      expect(computeRotation(velocity)).toBe(-Math.PI / 2);
    });

    it('should return undefined when velocity is very small', () => {
      const velocity = new THREE.Vector3(0.0001, 0, 0.0001);
      expect(computeRotation(velocity)).toBeUndefined();
    });

    it('should return undefined when velocity is zero', () => {
      const velocity = new THREE.Vector3(0, 0, 0);
      expect(computeRotation(velocity)).toBeUndefined();
    });

    it('should handle Y velocity without affecting rotation', () => {
      const velocity1 = new THREE.Vector3(1, 0, 0);
      const velocity2 = new THREE.Vector3(1, 0.5, 0);
      expect(computeRotation(velocity1)).toBe(computeRotation(velocity2));
    });
  });

  describe('moveOrganism', () => {
    it('should move organism by its velocity', () => {
      const organism: Organism = {
        id: 'test-1',
        speciesId: 'fish',
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0.1, 0.05, 0.1),
        energy: 50,
        age: 10,
        state: 'wandering',
        targetId: null,
        rotation: 0,
        scale: 1,
      };

      const result = moveOrganism(organism);

      expect(result.position.x).toBeCloseTo(0.1, 5);
      expect(result.position.y).toBeCloseTo(0.05, 5);
      expect(result.position.z).toBeCloseTo(0.1, 5);
    });

    it('should not mutate the original organism', () => {
      const originalPosition = new THREE.Vector3(0, 0, 0);
      const originalVelocity = new THREE.Vector3(0.1, 0.1, 0.1);
      const organism: Organism = {
        id: 'test-1',
        speciesId: 'fish',
        position: originalPosition,
        velocity: originalVelocity,
        energy: 50,
        age: 10,
        state: 'wandering',
        targetId: null,
        rotation: 0,
        scale: 1,
      };

      moveOrganism(organism);

      expect(organism.position.x).toBe(0);
      expect(organism.velocity.x).toBe(0.1);
    });

    it('should apply boundary constraints', () => {
      const organism: Organism = {
        id: 'test-1',
        speciesId: 'fish',
        position: new THREE.Vector3(AQUARIUM_BOUNDS.minX + 0.1, 0, 0),
        velocity: new THREE.Vector3(-0.5, 0, 0),
        energy: 50,
        age: 10,
        state: 'wandering',
        targetId: null,
        rotation: 0,
        scale: 1,
      };

      const result = moveOrganism(organism);

      expect(result.position.x).toBeGreaterThanOrEqual(AQUARIUM_BOUNDS.minX);
    });

    it('should return new velocity with boundary reflection', () => {
      const organism: Organism = {
        id: 'test-1',
        speciesId: 'fish',
        position: new THREE.Vector3(AQUARIUM_BOUNDS.maxX - 0.1, 0, 0),
        velocity: new THREE.Vector3(0.5, 0, 0),
        energy: 50,
        age: 10,
        state: 'wandering',
        targetId: null,
        rotation: 0,
        scale: 1,
      };

      const result = moveOrganism(organism);

      expect(result.velocity.x).toBeLessThan(0);
    });
  });
});
