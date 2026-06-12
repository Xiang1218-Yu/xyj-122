import { create } from 'zustand';

interface PerfStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  memory: number;
  frameTime: number;
  programCount: number;
}

interface PerfStore {
  stats: PerfStats;
  setStats: (stats: PerfStats) => void;
  visible: boolean;
  toggleVisible: () => void;
  minimized: boolean;
  toggleMinimized: () => void;
}

export const usePerfStore = create<PerfStore>((set) => ({
  stats: {
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
    frameTime: 0,
    programCount: 0,
  },
  setStats: (stats) => set({ stats }),
  visible: true,
  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  minimized: false,
  toggleMinimized: () => set((state) => ({ minimized: !state.minimized })),
}));
