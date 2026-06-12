import * as THREE from 'three';
import type { Organism, Species } from '@/types/ecosystem';
import { getSpeciesById, SPECIES } from '@/data/species';
import { AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: THREE.Vector3, b: THREE.Vector3): number {
  return a.distanceTo(b);
}

function calculateEnvironmentFitness(
  species: Species,
  waterTemperature: number,
  lightIntensity: number,
): { temperatureFactor: number; lightFactor: number; overallFitness: number } {
  const prefs = species.environmentalPrefs;

  const tempDeviation = Math.abs(waterTemperature - prefs.optimalTemperature);
  const tempRange = prefs.maxTemperature - prefs.minTemperature;
  const tempTolerance = tempRange * 0.5;
  let temperatureFactor = 1 - Math.min(1, tempDeviation / tempTolerance);
  temperatureFactor = Math.max(0.3, temperatureFactor);

  const lightDeviation = Math.abs(lightIntensity - prefs.optimalLight);
  const lightRange = prefs.maxLight - prefs.minLight;
  const lightTolerance = lightRange * 0.5;
  let lightFactor = 1 - Math.min(1, lightDeviation / lightTolerance);
  lightFactor = Math.max(0.3, lightFactor);

  if (waterTemperature < prefs.minTemperature || waterTemperature > prefs.maxTemperature) {
    temperatureFactor = Math.max(0.1, temperatureFactor * 0.5);
  }
  if (lightIntensity < prefs.minLight || lightIntensity > prefs.maxLight) {
    lightFactor = Math.max(0.1, lightFactor * 0.5);
  }

  const overallFitness = (temperatureFactor + lightFactor) / 2;

  return { temperatureFactor, lightFactor, overallFitness };
}

function getTemperatureStatusLabel(temp: number, species: Species): string {
  const prefs = species.environmentalPrefs;
  if (temp < prefs.minTemperature - 3) return '过冷';
  if (temp < prefs.optimalTemperature - 2) return '偏冷';
  if (temp <= prefs.optimalTemperature + 2) return '适宜';
  if (temp <= prefs.maxTemperature + 3) return '偏热';
  return '过热';
}

function getLightStatusLabel(light: number, species: Species): string {
  const prefs = species.environmentalPrefs;
  if (light < prefs.minLight - 0.1) return '过暗';
  if (light < prefs.optimalLight - 0.15) return '偏暗';
  if (light <= prefs.optimalLight + 0.15) return '适宜';
  if (light <= prefs.maxLight + 0.1) return '偏亮';
  return '过亮';
}

function findNearestPrey(
  organism: Organism,
  allOrganisms: Organism[],
  excludedIds: Set<string>,
): Organism | null {
  const species = getSpeciesById(organism.speciesId);
  if (!species || species.diet.length === 0) return null;

  let nearest: Organism | null = null;
  let minDist = Infinity;

  for (const other of allOrganisms) {
    if (other.id === organism.id) continue;
    if (excludedIds.has(other.id)) continue;
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

function findNearestDead(
  organism: Organism,
  allOrganisms: Organism[],
  dyingIds: Set<string>,
): Organism | null {
  let nearest: Organism | null = null;
  let minDist = Infinity;

  for (const other of allOrganisms) {
    if (other.id === organism.id) continue;
    if (!dyingIds.has(other.id)) continue;

    const dist = distance(organism.position, other.position);
    if (dist < minDist && dist < 3) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

export function simulateStep(
  organisms: Organism[],
  waterTemperature: number,
  lightIntensity: number,
  isDaytime: boolean = true,
  lightFactor: number = 1.0,
): {
  updates: { id: string; updates: Partial<Organism> }[];
  toRemove: string[];
  toAdd: { speciesId: string; position: THREE.Vector3 }[];
  environmentalEffects: { speciesId: string; fitness: number; tempStatus: string; lightStatus: string }[];
} {
  const updates: Map<string, Partial<Organism>> = new Map();
  const toRemove: Set<string> = new Set();
  const toAdd: { speciesId: string; position: THREE.Vector3 }[] = [];
  const eatenPrey: Set<string> = new Set();
  const environmentalEffects: { speciesId: string; fitness: number; tempStatus: string; lightStatus: string }[] = [];

  const seenSpecies = new Set<string>();

  for (const organism of organisms) {
    const species = getSpeciesById(organism.speciesId);
    if (!species) continue;

    const envFitness = calculateEnvironmentFitness(species, waterTemperature, lightIntensity);

    if (!seenSpecies.has(species.id)) {
      seenSpecies.add(species.id);
      environmentalEffects.push({
        speciesId: species.id,
        fitness: envFitness.overallFitness,
        tempStatus: getTemperatureStatusLabel(waterTemperature, species),
        lightStatus: getLightStatusLabel(lightIntensity, species),
      });
    }

    let energy = organism.energy;
    const age = organism.age + 1;

    if (age >= species.lifespan * envFitness.overallFitness || energy <= 0) {
      toRemove.add(organism.id);
      continue;
    }

    const baseEnergyCost = 0.05 + species.size * 0.02;
    const energyCostMultiplier = 1 + (1 - envFitness.overallFitness) * 1.5;
    energy -= baseEnergyCost * energyCostMultiplier;

    const organismUpdate: Partial<Organism> = {};
    const newPosition = organism.position.clone();
    const newVelocity = organism.velocity.clone();

    const isNocturnal = species.isNocturnal || false;
    const shouldSleep = !isDaytime && !isNocturnal;
    const speedMultiplier = shouldSleep ? 0.15 : (isDaytime && isNocturnal ? 0.3 : 1.0);
    const effectiveSpeed = species.speed * speedMultiplier;

    if (species.trophicLevel === 'decomposer') {
      if (shouldSleep) {
        organismUpdate.state = 'sleeping';
        newVelocity.multiplyScalar(0.85);
        energy += 0.01;
      } else {
        const deadOrganism = findNearestDead(organism, organisms, toRemove);

        if (deadOrganism && energy < species.energyValue * 0.8) {
          organismUpdate.state = 'hunting';
          organismUpdate.targetId = deadOrganism.id;
          const huntDir = new THREE.Vector3()
            .subVectors(deadOrganism.position, organism.position)
            .normalize();
          newVelocity.lerp(huntDir.multiplyScalar(effectiveSpeed), 0.1);

          if (distance(organism.position, deadOrganism.position) < species.size * 1.5) {
            energy += getSpeciesById(deadOrganism.speciesId)?.energyValue || 20;
            organismUpdate.state = 'eating';
          }
        } else {
          organismUpdate.state = 'wandering';
          if (Math.random() < 0.02) {
            newVelocity.set(
              (Math.random() - 0.5) * effectiveSpeed,
              (Math.random() - 0.5) * effectiveSpeed * 0.5,
              (Math.random() - 0.5) * effectiveSpeed,
            );
          }
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

      organismUpdate.position = newPosition;
      organismUpdate.velocity = newVelocity;
      if (Math.abs(newVelocity.x) > 0.001 || Math.abs(newVelocity.z) > 0.001) {
        organismUpdate.rotation = Math.atan2(newVelocity.x, newVelocity.z);
      }
    } else if (species.trophicLevel !== 'producer' && species.speed > 0) {
      if (shouldSleep) {
        organismUpdate.state = 'sleeping';
        newVelocity.multiplyScalar(0.85);
        energy += 0.01;
      } else {
        const prey = findNearestPrey(organism, organisms, eatenPrey);
        const predator = findNearestPredator(organism, organisms);

        if (predator) {
          organismUpdate.state = 'fleeing';
          const fleeDir = new THREE.Vector3()
            .subVectors(organism.position, predator.position)
            .normalize();
          newVelocity.lerp(fleeDir.multiplyScalar(effectiveSpeed), 0.1);
        } else if (prey && energy < species.energyValue * 0.7) {
          organismUpdate.state = 'hunting';
          organismUpdate.targetId = prey.id;
          const huntDir = new THREE.Vector3()
            .subVectors(prey.position, organism.position)
            .normalize();
          newVelocity.lerp(huntDir.multiplyScalar(effectiveSpeed), 0.1);

          if (distance(organism.position, prey.position) < species.size * 0.8) {
            energy += getSpeciesById(prey.speciesId)?.energyValue || 20;
            eatenPrey.add(prey.id);
            toRemove.add(prey.id);
            organismUpdate.state = 'eating';
          }
        } else {
          organismUpdate.state = 'wandering';
          if (Math.random() < 0.02) {
            newVelocity.set(
              (Math.random() - 0.5) * effectiveSpeed,
              (Math.random() - 0.5) * effectiveSpeed * 0.5,
              (Math.random() - 0.5) * effectiveSpeed,
            );
          }
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

      organismUpdate.position = newPosition;
      organismUpdate.velocity = newVelocity;
      if (Math.abs(newVelocity.x) > 0.001 || Math.abs(newVelocity.z) > 0.001) {
        organismUpdate.rotation = Math.atan2(newVelocity.x, newVelocity.z);
      }
    } else if (species.trophicLevel === 'producer') {
      if (!isDaytime) {
        organismUpdate.state = 'sleeping';
        const baseCost = 0.02;
        energy -= baseCost;
      } else {
        organismUpdate.state = 'idle';
        const baseProduction = 0.1;
        const lightBonus = envFitness.lightFactor * lightFactor;
        const tempBonus = envFitness.temperatureFactor;
        energy += baseProduction * lightBonus * tempBonus * 1.5;
      }
    }

    energy = clamp(energy, 0, species.energyValue * 1.5);
    organismUpdate.energy = energy;
    organismUpdate.age = age;

    const effectiveReproductionRate = species.reproductionRate * envFitness.overallFitness;
    if (
      energy > species.energyValue * 0.8 &&
      Math.random() < effectiveReproductionRate * 0.1
    ) {
      const aliveCount = organisms.filter(
        (o) => o.speciesId === organism.speciesId && !toRemove.has(o.id),
      ).length;
      if (aliveCount < species.maxPopulation) {
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
        organismUpdate.energy = energy * 0.5;
      }
    }

    updates.set(organism.id, organismUpdate);
  }

  const updatesArray: { id: string; updates: Partial<Organism> }[] = [];
  updates.forEach((u, id) => {
    if (!toRemove.has(id)) {
      updatesArray.push({ id, updates: u });
    }
  });

  return { updates: updatesArray, toRemove: Array.from(toRemove), toAdd, environmentalEffects };
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

export function computeLongestFoodChain(organisms: Organism[]): number {
  const presentSpecies = getPresentSpecies(organisms);
  if (presentSpecies.length === 0) return 0;

  const relations = computeFoodChainRelations(organisms);

  const preyMap: Record<string, string[]> = {};
  relations.forEach((rel) => {
    if (!preyMap[rel.predatorId]) preyMap[rel.predatorId] = [];
    preyMap[rel.predatorId].push(rel.preyId);
  });

  const memo: Record<string, number> = {};

  function getChainLength(speciesId: string): number {
    if (memo[speciesId] !== undefined) return memo[speciesId];

    const preys = preyMap[speciesId] || [];
    if (preys.length === 0) {
      memo[speciesId] = 1;
      return 1;
    }

    let maxPreyChain = 0;
    preys.forEach((preyId) => {
      const preyChain = getChainLength(preyId);
      if (preyChain > maxPreyChain) maxPreyChain = preyChain;
    });

    memo[speciesId] = maxPreyChain + 1;
    return memo[speciesId];
  }

  let maxChain = 0;
  presentSpecies.forEach((speciesId) => {
    const chainLength = getChainLength(speciesId);
    if (chainLength > maxChain) maxChain = chainLength;
  });

  return maxChain;
}

export function countTrophicLevels(organisms: Organism[]): number {
  const presentSpecies = getPresentSpecies(organisms);
  const levels = new Set<string>();

  presentSpecies.forEach((speciesId) => {
    const sp = getSpeciesById(speciesId);
    if (sp) levels.add(sp.trophicLevel);
  });

  return levels.size;
}

export function getTrophicLevelCounts(organisms: Organism[]): Record<string, number> {
  const counts: Record<string, number> = {
    producer: 0,
    herbivore: 0,
    omnivore: 0,
    carnivore: 0,
    decomposer: 0,
  };

  organisms.forEach((organism) => {
    const sp = getSpeciesById(organism.speciesId);
    if (sp) counts[sp.trophicLevel]++;
  });

  return counts;
}

export { SPECIES };
