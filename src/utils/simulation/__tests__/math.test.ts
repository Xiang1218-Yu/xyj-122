import { describe, it, expect } from 'vitest';
import { clamp, distance } from '../math';

describe('math utilities', () => {
  describe('clamp', () => {
    it('should return the value when it is within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should return min when value is below min', () => {
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(-100, 0, 10)).toBe(0);
    });

    it('should return max when value is above max', () => {
      expect(clamp(11, 0, 10)).toBe(10);
      expect(clamp(100, 0, 10)).toBe(10);
    });

    it('should handle negative bounds correctly', () => {
      expect(clamp(-5, -10, 0)).toBe(-5);
      expect(clamp(-15, -10, 0)).toBe(-10);
      expect(clamp(5, -10, 0)).toBe(0);
    });

    it('should handle float values correctly', () => {
      expect(clamp(3.14, 0, 5)).toBe(3.14);
      expect(clamp(5.5, 0, 5)).toBe(5);
      expect(clamp(-0.5, 0, 5)).toBe(0);
    });
  });

  describe('distance', () => {
    it('should return 0 when points are the same', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 0, y: 0, z: 0 };
      expect(distance(a, b)).toBe(0);
    });

    it('should calculate distance along X axis', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 3, y: 0, z: 0 };
      expect(distance(a, b)).toBe(3);
    });

    it('should calculate distance along Y axis', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 0, y: 4, z: 0 };
      expect(distance(a, b)).toBe(4);
    });

    it('should calculate distance along Z axis', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 0, y: 0, z: 5 };
      expect(distance(a, b)).toBe(5);
    });

    it('should calculate 3D distance correctly', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 3, y: 4, z: 0 };
      expect(distance(a, b)).toBe(5);

      const c = { x: 1, y: 2, z: 2 };
      const d = { x: 4, y: 6, z: -2 };
      expect(distance(c, d)).toBeCloseTo(6.403, 3);
    });

    it('should handle negative coordinates', () => {
      const a = { x: -1, y: -2, z: -3 };
      const b = { x: 2, y: 2, z: 1 };
      expect(distance(a, b)).toBeCloseTo(6.403, 3);
    });

    it('should be commutative', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 4, y: 5, z: 6 };
      expect(distance(a, b)).toBe(distance(b, a));
    });
  });
});
