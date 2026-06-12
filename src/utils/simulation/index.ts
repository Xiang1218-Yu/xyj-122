export { clamp, distance } from './math';
export { calculateEnvironmentFitness, getTemperatureStatusLabel, getLightStatusLabel, computeEnergyCost, computeEffectiveSpeed } from './environment';
export type { EnvironmentFitness } from './environment';
export { applyBoundaryConstraints, applyWanderingVelocity, computeRotation, moveOrganism } from './movement';
export { findNearestPrey, findNearestPredator, findNearestDead, steerToward, steerAway } from './organismSearch';
export { simulateStep } from './simulationStep';
export type { SimulationResult } from './simulationStep';
export { getPresentSpecies, computeFoodChainRelations, computeLongestFoodChain, countTrophicLevels, getTrophicLevelCounts } from './foodChain';
