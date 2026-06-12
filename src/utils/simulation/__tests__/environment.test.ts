import { describe, it, expect } from 'vitest';
import {
  calculateEnvironmentFitness,
  getTemperatureStatusLabel,
  getLightStatusLabel,
  computeEnergyCost,
  computeEffectiveSpeed,
} from '../environment';
import type { Species } from '@/types/ecosystem';

const mockSpecies: Species = {
  id: 'test-species',
  name: 'Test Species',
  emoji: '🐟',
  trophicLevel: 'herbivore',
  color: '#000000',
  description: 'Test species for unit testing',
  habitat: 'water',
  diet: [],
  predators: [],
  reproductionRate: 0.01,
  lifespan: 100,
  speed: 0.05,
  size: 0.5,
  energyValue: 50,
  maxPopulation: 10,
  environmentalPrefs: {
    optimalTemperature: 24,
    minTemperature: 14,
    maxTemperature: 34,
    optimalLight: 0.6,
    minLight: 0.1,
    maxLight: 0.9,
  },
};

describe('environment utilities', () => {
  describe('calculateEnvironmentFitness', () => {
    it('should return maximum fitness at optimal conditions', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 24, 0.6);
      expect(result.temperatureFactor).toBe(1);
      expect(result.lightFactor).toBe(1);
      expect(result.overallFitness).toBe(1);
    });

    it('should have reduced fitness when temperature deviates from optimal', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 19, 0.6);
      expect(result.temperatureFactor).toBeLessThan(1);
      expect(result.temperatureFactor).toBeGreaterThan(0.3);
      expect(result.lightFactor).toBe(1);
      expect(result.overallFitness).toBeLessThan(1);
    });

    it('should have reduced fitness when light deviates from optimal', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 24, 0.35);
      expect(result.temperatureFactor).toBe(1);
      expect(result.lightFactor).toBeLessThan(1);
      expect(result.lightFactor).toBeGreaterThan(0.3);
      expect(result.overallFitness).toBeLessThan(1);
    });

    it('should floor temperature factor at 0.3 within tolerance range', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 14, 0.6);
      expect(result.temperatureFactor).toBe(0.3);
    });

    it('should floor light factor at 0.3 within tolerance range', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 24, 0.1);
      expect(result.lightFactor).toBe(0.3);
    });

    it('should apply extra penalty when temperature is below min', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 10, 0.6);
      expect(result.temperatureFactor).toBeLessThan(0.3);
      expect(result.temperatureFactor).toBeGreaterThanOrEqual(0.1);
    });

    it('should apply extra penalty when temperature is above max', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 38, 0.6);
      expect(result.temperatureFactor).toBeLessThan(0.3);
      expect(result.temperatureFactor).toBeGreaterThanOrEqual(0.1);
    });

    it('should apply extra penalty when light is below min', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 24, 0.05);
      expect(result.lightFactor).toBeLessThan(0.3);
      expect(result.lightFactor).toBeGreaterThanOrEqual(0.1);
    });

    it('should apply extra penalty when light is above max', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 24, 0.95);
      expect(result.lightFactor).toBeLessThan(0.3);
      expect(result.lightFactor).toBeGreaterThanOrEqual(0.1);
    });

    it('should have overall fitness as average of temp and light factors', () => {
      const result = calculateEnvironmentFitness(mockSpecies, 19, 0.85);
      const expectedOverall = (result.temperatureFactor + result.lightFactor) / 2;
      expect(result.overallFitness).toBeCloseTo(expectedOverall, 5);
    });
  });

  describe('getTemperatureStatusLabel', () => {
    it('should return 适宜 when temperature is optimal', () => {
      expect(getTemperatureStatusLabel(24, mockSpecies)).toBe('适宜');
      expect(getTemperatureStatusLabel(22, mockSpecies)).toBe('适宜');
      expect(getTemperatureStatusLabel(26, mockSpecies)).toBe('适宜');
    });

    it('should return 偏冷 when temperature is slightly below optimal', () => {
      expect(getTemperatureStatusLabel(20, mockSpecies)).toBe('偏冷');
    });

    it('should return 偏热 when temperature is slightly above optimal', () => {
      expect(getTemperatureStatusLabel(28, mockSpecies)).toBe('偏热');
    });

    it('should return 过冷 when temperature is far below min', () => {
      expect(getTemperatureStatusLabel(10, mockSpecies)).toBe('过冷');
    });

    it('should return 过热 when temperature is far above max', () => {
      expect(getTemperatureStatusLabel(38, mockSpecies)).toBe('过热');
    });
  });

  describe('getLightStatusLabel', () => {
    it('should return 适宜 when light is optimal', () => {
      expect(getLightStatusLabel(0.6, mockSpecies)).toBe('适宜');
      expect(getLightStatusLabel(0.5, mockSpecies)).toBe('适宜');
      expect(getLightStatusLabel(0.7, mockSpecies)).toBe('适宜');
    });

    it('should return 偏暗 when light is slightly below optimal', () => {
      expect(getLightStatusLabel(0.3, mockSpecies)).toBe('偏暗');
    });

    it('should return 偏亮 when light is slightly above optimal', () => {
      expect(getLightStatusLabel(0.8, mockSpecies)).toBe('偏亮');
    });

    it('should return 过暗 when light is far below min', () => {
      expect(getLightStatusLabel(-0.2, mockSpecies)).toBe('过暗');
    });

    it('should return 过亮 when light is far above max', () => {
      expect(getLightStatusLabel(1.1, mockSpecies)).toBe('过亮');
    });
  });

  describe('computeEnergyCost', () => {
    it('should return base cost when fitness is perfect', () => {
      expect(computeEnergyCost(10, 1)).toBe(10);
    });

    it('should increase cost when fitness is lower', () => {
      const cost1 = computeEnergyCost(10, 1);
      const cost2 = computeEnergyCost(10, 0.5);
      expect(cost2).toBeGreaterThan(cost1);
    });

    it('should have maximum cost when fitness is 0', () => {
      const cost = computeEnergyCost(10, 0);
      expect(cost).toBe(25);
    });

    it('should scale linearly with base cost', () => {
      const cost1 = computeEnergyCost(10, 0.5);
      const cost2 = computeEnergyCost(20, 0.5);
      expect(cost2).toBe(cost1 * 2);
    });
  });

  describe('computeEffectiveSpeed', () => {
    it('should return full speed for diurnal species during daytime', () => {
      const result = computeEffectiveSpeed(0.1, false, true);
      expect(result.effectiveSpeed).toBe(0.1);
      expect(result.shouldSleep).toBe(false);
    });

    it('should return reduced speed for diurnal species at night', () => {
      const result = computeEffectiveSpeed(0.1, false, false);
      expect(result.effectiveSpeed).toBe(0.015);
      expect(result.shouldSleep).toBe(true);
    });

    it('should return reduced speed for nocturnal species during daytime', () => {
      const result = computeEffectiveSpeed(0.1, true, true);
      expect(result.effectiveSpeed).toBe(0.03);
      expect(result.shouldSleep).toBe(false);
    });

    it('should return full speed for nocturnal species at night', () => {
      const result = computeEffectiveSpeed(0.1, true, false);
      expect(result.effectiveSpeed).toBe(0.1);
      expect(result.shouldSleep).toBe(false);
    });

    it('should handle zero speed', () => {
      const result = computeEffectiveSpeed(0, false, true);
      expect(result.effectiveSpeed).toBe(0);
      expect(result.shouldSleep).toBe(false);
    });
  });
});
