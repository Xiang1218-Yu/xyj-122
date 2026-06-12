import type { Species } from '@/types/ecosystem';

export interface EnvironmentFitness {
  temperatureFactor: number;
  lightFactor: number;
  overallFitness: number;
}

export function calculateEnvironmentFitness(
  species: Species,
  waterTemperature: number,
  lightIntensity: number,
): EnvironmentFitness {
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

export function getTemperatureStatusLabel(temp: number, species: Species): string {
  const prefs = species.environmentalPrefs;
  if (temp < prefs.minTemperature - 3) return '过冷';
  if (temp < prefs.optimalTemperature - 2) return '偏冷';
  if (temp <= prefs.optimalTemperature + 2) return '适宜';
  if (temp <= prefs.maxTemperature + 3) return '偏热';
  return '过热';
}

export function getLightStatusLabel(light: number, species: Species): string {
  const prefs = species.environmentalPrefs;
  if (light < prefs.minLight - 0.1) return '过暗';
  if (light < prefs.optimalLight - 0.15) return '偏暗';
  if (light <= prefs.optimalLight + 0.15) return '适宜';
  if (light <= prefs.maxLight + 0.1) return '偏亮';
  return '过亮';
}

export function computeEnergyCost(baseCost: number, overallFitness: number): number {
  const multiplier = 1 + (1 - overallFitness) * 1.5;
  return baseCost * multiplier;
}

export function computeEffectiveSpeed(
  speciesSpeed: number,
  isNocturnal: boolean,
  isDaytime: boolean,
): { effectiveSpeed: number; shouldSleep: boolean } {
  const shouldSleep = !isDaytime && !isNocturnal;
  const speedMultiplier = shouldSleep ? 0.15 : (isDaytime && isNocturnal ? 0.3 : 1.0);
  const effectiveSpeed = speciesSpeed * speedMultiplier;
  return { effectiveSpeed, shouldSleep };
}
