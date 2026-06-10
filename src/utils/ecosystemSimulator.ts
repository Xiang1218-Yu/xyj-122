import * as THREE from 'three';
import type { Organism } from '@/types/ecosystem';
import { getSpeciesById, SPECIES } from '@/data/species';
import { AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: THREE.Vector3, b: THREE.Vector3): number {
  return a.distanceTo(b);
}

function findNearestPrey(
  organism: Organism,
  allOrganisms: Organism[],
): Organism | null {
  const species = getSpeciesById(organism.speciesId);
  if (!species || species.diet.length === 0) return null;

  let nearest: Organism | null = null;
  let minDist = Infinity;

  for (const other of allOrganisms) {
    if (other.id === organism.id) continue;
    if (!species.diet.includes(other.speciesId)) continue;

    const dist = distance(organism.position, other.position);
    if (dist < minDist && dist < 3) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

function findNearestPredator(
  organism: Organism,
  allOrganisms: Organism[],
): Organism | null {
  const species = getSpeciesById(organism.speciesId);
  if (!species || species.predators.length === 0) return null;

  let nearest: Organism | null = null;
  let minDist = Infinity;

  for (const other of allOrganisms) {
    if (other.id === organism.id) continue;
    if (!species.predators.includes(other.speciesId)) continue;

    const dist = distance(organism.position, other.position);
    if (dist < minDist && dist < 2.5) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

export function simulateStep(
  organisms: Organism[],
): {
  updates: { id: string; updates: Partial<Organism> }[];
  toRemove: string[];
  toAdd: { speciesId: string; position: THREE.Vector3 }[];
} {
  const updates: { id: string; updates: Partial<Organism> }[] = [];
  const toRemove: string[] = [];
  const toAdd: { speciesId: string; position: THREE.Vector3 }[] = [];

  for (const organism of organisms) {
    const species = getSpeciesById(organism.speciesId);
    if (!species) continue;

    const newState: Partial<Organism> = {};
    let energy = organism.energy;
    let age = organism.age + 1;

    if (age >= species.lifespan || energy <= 0) {
      toRemove.push(organism.id);
      continue;
    }

    energy -= 0.05 + species.size * 0.02;

    const newPosition = organism.position.clone();
    const newVelocity = organism.velocity.clone();

    if (species.trophicLevel !== 'producer' && species.speed > 0) {
      const prey = findNearestPrey(organism, organisms);
      const predator = findNearestPredator(organism, organisms);

      if (predator) {
        newState.state = 'fleeing';
        const fleeDir = new THREE.Vector3()
          .subVectors(organism.position, predator.position)
          .normalize();
        newVelocity.lerp(fleeDir.multiplyScalar(species.speed), 0.1);
      } else if (prey && energy < species.energyValue * 0.7) {
        newState.state = 'hunting';
        newState.targetId = prey.id;
        const huntDir = new THREE.Vector3()
          .subVectors(prey.position, organism.position)
          .normalize();
        newVelocity.lerp(huntDir.multiplyScalar(species.speed), 0.1);

        if (distance(organism.position, prey.position) < species.size * 0.8) {
          energy += getSpeciesById(prey.speciesId)?.energyValue || 20;
          toRemove.push(prey.id);
          newState.state = 'eating';
        }
      } else {
        newState.state = 'wandering';
        if (Math.random() < 0.02) {
          newVelocity.set(
            (Math.random() - 0.5) * species.speed,
            (Math.random() - 0.5) * species.speed * 0.5,
            (Math.random() - 0.5) * species.speed,
          );
        }
      }

      newPosition.add(newVelocity);

      if (newPosition.x < AQUARIUM_BOUNDS.minX + 0.3) {
        newPosition.x = AQUARIUM_BOUNDS.minX + 0.3;
        newVelocity.x = Math.abs(newVelocity.x);
      }
      if (newPosition.x > AQUARIUM_BOUNDS.maxX - 0.3) {
        newPosition.x = AQUARIUM_BOUNDS.maxX - 0.3;
        newVelocity.x = -Math.abs(newVelocity.x);
      }
      if (newPosition.y < AQUARIUM_BOUNDS.minY + 0.2) {
        newPosition.y = AQUARIUM_BOUNDS.minY + 0.2;
        newVelocity.y = Math.abs(newVelocity.y);
      }
      if (newPosition.y > AQUARIUM_BOUNDS.maxY - 0.2) {
        newPosition.y = AQUARIUM_BOUNDS.maxY - 0.2;
        newVelocity.y = -Math.abs(newVelocity.y);
      }
      if (newPosition.z < AQUARIUM_BOUNDS.minZ + 0.3) {
        newPosition.z = AQUARIUM_BOUNDS.minZ + 0.3;
        newVelocity.z = Math.abs(newVelocity.z);
      }
      if (newPosition.z > AQUARIUM_BOUNDS.maxZ - 0.3) {
        newPosition.z = AQUARIUM_BOUNDS.maxZ - 0.3;
        newVelocity.z = -Math.abs(newVelocity.z);
      }

      newState.position = newPosition;
      newState.velocity = newVelocity;
      if (Math.abs(newVelocity.x) > 0.001 || Math.abs(newVelocity.z) > 0.001) {
        newState.rotation = Math.atan2(newVelocity.x, newVelocity.z);
      }
    } else if (species.trophicLevel === 'producer') {
      newState.state = 'idle';
      energy += 0.1;
    }

    energy = clamp(energy, 0, species.energyValue * 1.5);
    newState.energy = energy;
    newState.age = age;

    if (
      energy > species.energyValue * 0.8 &&
      Math.random() < species.reproductionRate * 0.1
    ) {
      const currentCount = organisms.filter(
        (o) => o.speciesId === organism.speciesId && !toRemove.includes(o.id),
      ).length;
      if (currentCount < species.maxPopulation) {
        const offspringPos = organism.position
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 1.5,
              Math.random() * 0.5,
              (Math.random() - 0.5) * 1.5,
            ),
          );
        toAdd.push({ speciesId: organism.speciesId, position: offspringPos });
        newState.energy = energy * 0.5;
      }
    }

    updates.push({ id: organism.id, updates: newState });
  }

  return { updates, toRemove, toAdd };
}

export function computeFoodChainRelations(organisms: Organism[]): {
  predatorId: string;
  preyId: string;
}[] {
  const relations: { predatorId: string; preyId: string }[] = [];
  const seen = new Set<string>();

  for (const organism of organisms) {
    const species = getSpeciesById(organism.speciesId);
    if (!species) continue;

    for (const preyId of species.diet) {
      const hasPrey = organisms.some((o) => o.speciesId === preyId);
      if (hasPrey) {
        const key = `${organism.speciesId}-${preyId}`;
        if (!seen.has(key)) {
          seen.add(key);
          relations.push({ predatorId: organism.speciesId, preyId });
        }
      }
    }
  }

  return relations;
}

export function getPresentSpecies(organisms: Organism[]): string[] {
  return [...new Set(organisms.map((o) => o.speciesId))];
}

export { SPECIES };
