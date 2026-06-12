import * as THREE from 'three';
import type { Organism } from '@/types/ecosystem';
import { getSpeciesById } from '@/data/species';
import { distance } from './math';

type OrganismFilter = (other: Organism, organism: Organism) => boolean;

function findNearest(
  organism: Organism,
  allOrganisms: Organism[],
  filter: OrganismFilter,
  maxDistance: number,
): Organism | null {
  let nearest: Organism | null = null;
  let minDist = Infinity;

  for (const other of allOrganisms) {
    if (other.id === organism.id) continue;
    if (!filter(other, organism)) continue;

    const dist = distance(organism.position, other.position);
    if (dist < minDist && dist < maxDistance) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

export function findNearestPrey(
  organism: Organism,
  allOrganisms: Organism[],
  excludedIds: Set<string>,
): Organism | null {
  const species = getSpeciesById(organism.speciesId);
  if (!species || species.diet.length === 0) return null;

  return findNearest(
    organism,
    allOrganisms,
    (other) => !excludedIds.has(other.id) && species.diet.includes(other.speciesId),
    3,
  );
}

export function findNearestPredator(
  organism: Organism,
  allOrganisms: Organism[],
): Organism | null {
  const species = getSpeciesById(organism.speciesId);
  if (!species || species.predators.length === 0) return null;

  return findNearest(
    organism,
    allOrganisms,
    (other) => species.predators.includes(other.speciesId),
    2.5,
  );
}

export function findNearestDead(
  organism: Organism,
  allOrganisms: Organism[],
  dyingIds: Set<string>,
): Organism | null {
  return findNearest(
    organism,
    allOrganisms,
    (other) => dyingIds.has(other.id),
    3,
  );
}

export function steerToward(
  organism: Organism,
  target: Organism,
  effectiveSpeed: number,
  velocity: THREE.Vector3,
  lerpFactor: number = 0.1,
): void {
  const dir = new THREE.Vector3()
    .subVectors(target.position, organism.position)
    .normalize();
  velocity.lerp(dir.multiplyScalar(effectiveSpeed), lerpFactor);
}

export function steerAway(
  organism: Organism,
  threat: Organism,
  effectiveSpeed: number,
  velocity: THREE.Vector3,
  lerpFactor: number = 0.1,
): void {
  const dir = new THREE.Vector3()
    .subVectors(organism.position, threat.position)
    .normalize();
  velocity.lerp(dir.multiplyScalar(effectiveSpeed), lerpFactor);
}
