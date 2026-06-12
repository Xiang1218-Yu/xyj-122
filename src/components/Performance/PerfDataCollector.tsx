import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { usePerfStore } from '@/store/usePerfStore';

export function PerfDataCollector() {
  const { gl } = useThree();
  const setStats = usePerfStore((s) => s.setStats);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const lastFrameTimeRef = useRef(performance.now());

  useFrame(() => {
    frameCountRef.current++;
    const now = performance.now();
    const frameTime = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    if (now - lastTimeRef.current >= 500) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      frameCountRef.current = 0;
      lastTimeRef.current = now;

      const info = gl.info;
      const memoryInfo = (info as any).memory;
      const memory = memoryInfo
        ? memoryInfo.geometries + memoryInfo.textures
        : 0;

      setStats({
        fps,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        memory,
        frameTime,
        programCount: (info as any).programs?.length || 0,
      });

      gl.info.reset();
    }
  });

  return null;
}
