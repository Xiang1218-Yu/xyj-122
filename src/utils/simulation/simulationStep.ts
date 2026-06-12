import * as THREE from 'three';
import type { Organism } from '@/types/ecosystem';
import { getSpeciesById } from '@/data/species';
import { clamp, distance } from './math';
import {
  calculateEnvironmentFitness,
  computeEnergyCost,
  computeEffectiveSpeed,
  getTemperatureStatusLabel,
  getLightStatusLabel,
} from './environment';
import { moveOrganism, applyWanderingVelocity, computeRotation } from './movement';
import { findNearestPrey, findNearestPredator, findNearestDead, steerToward, steerAway } from './organismSearch';

interface OrganismUpdate {
  id: string;
  updates: Partial<Organism>;
}

interface EnvironmentalEffect {
  speciesId: string;
  fitness: number;
  tempStatus: string;
  lightStatus: string;
}

export interface SimulationResult {
  updates: OrganismUpdate[];
  toRemove: string[];
  toAdd: { speciesId: string; position: THREE.Vector3 }[];
  environmentalEffects: EnvironmentalEffect[];
}

function simulateDecomposer(
  organism: Organism,
  species: ReturnType<typeof getSpeciesById>,
  organisms: Organism[],
  toRemove: Set<string>,
  energy: number,
  effectiveSpeed: number,
  shouldSleep: boolean,
): { state: Organism['state']; targetId: string | null; energy: number; velocity: THREE.Vector3; moved: boolean } {
  const newVelocity = organism.velocity.clone();

  if (shouldSleep) {
    newVelocity.multiplyScalar(0.85);
    return { state: 'sleeping', targetId: null, energy: energy + 0.01, velocity: newVelocity, moved: true };
  }

  const deadOrganism = findNearestDead(organism, organisms, toRemove);

  if (deadOrganism && energy < species!.energyValue * 0.8) {
    steerToward(organism, deadOrganism, effectiveSpeed, newVelocity);

    if (distance(organism.position, deadOrganism.position) < species!.size * 1.5) {
      const gained = getSpeciesById(deadOrganism.speciesId)?.energyValue || 20;
      return { state: 'eating', targetId: deadOrganism.id, energy: energy + gained, velocity: newVelocity, moved: true };
    }

    return { state: 'hunting', targetId: deadOrganism.id, energy, velocity: newVelocity, moved: true };
  }

  applyWanderingVelocity(newVelocity, effectiveSpeed);
  return { state: 'wandering', targetId: null, energy, velocity: newVelocity, moved: true };
}

function simulateConsumer(
  organism: Organism,
  species: ReturnType<typeof getSpeciesById>,
  organisms: Organism[],
  eatenPrey: Set<string>,
  energy: number,
  effectiveSpeed: number,
  shouldSleep: boolean,
): { state: Organism['state']; targetId: string | null; energy: number; velocity: THREE.Vector3; moved: boolean; preyToRemove?: string } {
  const newVelocity = organism.velocity.clone();

  if (shouldSleep) {
    newVelocity.multiplyScalar(0.85);
    return { state: 'sleeping', targetId: null, energy: energy + 0.01, velocity: newVelocity, moved: true };
  }

  const prey = findNearestPrey(organism, organisms, eatenPrey);
  const predator = findNearestPredator(organism, organisms);

  if (predator) {
    steerAway(organism, predator, effectiveSpeed, newVelocity);
    return { state: 'fleeing', targetId: null, energy, velocity: newVelocity, moved: true };
  }

  if (prey && energy < species!.energyValue * 0.7) {
    steerToward(organism, prey, effectiveSpeed, newVelocity);

    if (distance(organism.position, prey.position) < species!.size * 0.8) {
      const gained = getSpeciesById(prey.speciesId)?.energyValue || 20;
      eatenPrey.add(prey.id);
      return { state: 'eating', targetId: prey.id, energy: energy + gained, velocity: newVelocity, moved: true, preyToRemove: prey.id };
    }

    return { state: 'hunting', targetId: prey.id, energy, velocity: newVelocity, moved: true };
  }

  applyWanderingVelocity(newVelocity, effectiveSpeed);
  return { state: 'wandering', targetId: null, energy, velocity: newVelocity, moved: true };
}

function simulateProducer(
  organism: Organism,
  envFitness: ReturnType<typeof calculateEnvironmentFitness>,
  lightFactor: number,
  isDaytime: boolean,
): { state: Organism['state']; energy: number } {
  if (!isDaytime) {
    return { state: 'sleeping', energy: organism.energy - 0.02 };
  }

  const baseProduction = 0.1;
  const lightBonus = envFitness.lightFactor * lightFactor;
  const tempBonus = envFitness.temperatureFactor;
  return { state: 'idle', energy: organism.energy + baseProduction * lightBonus * tempBonus * 1.5 };
}

export function simulateStep(
  organisms: Organism[],
  waterTemperature: number,
  lightIntensity: number,
  isDaytime: boolean = true,
  lightFactor: number = 1.0,
): SimulationResult {
  const updates: Map<string, Partial<Organism>> = new Map();
  const toRemove: Set<string> = new Set();
  const toAdd: { speciesId: string; position: THREE.Vector3 }[] = [];
  const eatenPrey: Set<string> = new Set();
  const environmentalEffects: EnvironmentalEffect[] = [];
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
    energy -= computeEnergyCost(baseEnergyCost, envFitness.overallFitness);

    const organismUpdate: Partial<Organism> = {};
    const { effectiveSpeed, shouldSleep } = computeEffectiveSpeed(
      species.speed,
      species.isNocturnal || false,
      isDaytime,
    );

    if (species.trophicLevel === 'producer') {
      const result = simulateProducer(organism, envFitness, lightFactor, isDaytime);
      organismUpdate.state = result.state;
      energy = result.energy;
    } else if (species.trophicLevel === 'decomposer') {
      const result = simulateDecomposer(organism, species, organisms, toRemove, energy, effectiveSpeed, shouldSleep);
      organismUpdate.state = result.state;
      organismUpdate.targetId = result.targetId;
      energy = result.energy;

      const { position, velocity } = moveOrganism({
        ...organism,
        velocity: result.velocity,
      });
      organismUpdate.position = position;
      organismUpdate.velocity = velocity;
      const rotation = computeRotation(velocity);
      if (rotation !== undefined) organismUpdate.rotation = rotation;
    } else if (species.speed > 0) {
      const result = simulateConsumer(organism, species, organisms, eatenPrey, energy, effectiveSpeed, shouldSleep);
      organismUpdate.state = result.state;
      organismUpdate.targetId = result.targetId;
      energy = result.energy;
      if (result.preyToRemove) toRemove.add(result.preyToRemove);

      const { position, velocity } = moveOrganism({
        ...organism,
        velocity: result.velocity,
      });
      organismUpdate.position = position;
      organismUpdate.velocity = velocity;
      const rotation = computeRotation(velocity);
      if (rotation !== undefined) organismUpdate.rotation = rotation;
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

  const updatesArray: OrganismUpdate[] = [];
  updates.forEach((u, id) => {
    if (!toRemove.has(id)) {
      updatesArray.push({ id, updates: u });
    }
  });

  return { updates: updatesArray, toRemove: Array.from(toRemove), toAdd, environmentalEffects };
}
