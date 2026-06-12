import * as THREE from 'three';
import type { Organism } from '@/types/ecosystem';
import { AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';

interface BoundsConfig {
  marginX: number;
  marginY: number;
  marginZ: number;
}

const DEFAULT_BOUNDS: BoundsConfig = {
  marginX: 0.3,
  marginY: 0.2,
  marginZ: 0.3,
};

export function applyBoundaryConstraints(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  config: BoundsConfig = DEFAULT_BOUNDS,
): void {
  const { marginX, marginY, marginZ } = config;

  if (position.x < AQUARIUM_BOUNDS.minX + marginX) {
    position.x = AQUARIUM_BOUNDS.minX + marginX;
    velocity.x = Math.abs(velocity.x);
  }
  if (position.x > AQUARIUM_BOUNDS.maxX - marginX) {
    position.x = AQUARIUM_BOUNDS.maxX - marginX;
    velocity.x = -Math.abs(velocity.x);
  }
  if (position.y < AQUARIUM_BOUNDS.minY + marginY) {
    position.y = AQUARIUM_BOUNDS.minY + marginY;
    velocity.y = Math.abs(velocity.y);
  }
  if (position.y > AQUARIUM_BOUNDS.maxY - marginY) {
    position.y = AQUARIUM_BOUNDS.maxY - marginY;
    velocity.y = -Math.abs(velocity.y);
  }
  if (position.z < AQUARIUM_BOUNDS.minZ + marginZ) {
    position.z = AQUARIUM_BOUNDS.minZ + marginZ;
    velocity.z = Math.abs(velocity.z);
  }
  if (position.z > AQUARIUM_BOUNDS.maxZ - marginZ) {
    position.z = AQUARIUM_BOUNDS.maxZ - marginZ;
    velocity.z = -Math.abs(velocity.z);
  }
}

export function applyWanderingVelocity(
  velocity: THREE.Vector3,
  effectiveSpeed: number,
  probability: number = 0.02,
): void {
  if (Math.random() < probability) {
    velocity.set(
      (Math.random() - 0.5) * effectiveSpeed,
      (Math.random() - 0.5) * effectiveSpeed * 0.5,
      (Math.random() - 0.5) * effectiveSpeed,
    );
  }
}

export function computeRotation(velocity: THREE.Vector3): number | undefined {
  if (Math.abs(velocity.x) > 0.001 || Math.abs(velocity.z) > 0.001) {
    return Math.atan2(velocity.x, velocity.z);
  }
  return undefined;
}

export function moveOrganism(organism: Organism): { position: THREE.Vector3; velocity: THREE.Vector3 } {
  const position = organism.position.clone();
  const velocity = organism.velocity.clone();
  position.add(velocity);
  applyBoundaryConstraints(position, velocity);
  return { position, velocity };
}
