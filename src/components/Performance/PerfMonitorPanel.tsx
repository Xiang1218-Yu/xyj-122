import { useEffect } from 'react';
import { Gauge, Cpu, Triangle, Clock, Zap, Minimize2, Maximize2 } from 'lucide-react';
import { usePerfStore } from '@/store/usePerfStore';

interface PerfMonitorPanelProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerfMonitorPanel({ position = 'top-right' }: PerfMonitorPanelProps) {
  const stats = usePerfStore((s) => s.stats);
  const visible = usePerfStore((s) => s.visible);
  const minimized = usePerfStore((s) => s.minimized);
  const toggleVisible = usePerfStore((s) => s.toggleVisible);
  const toggleMinimized = usePerfStore((s) => s.toggleMinimized);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleVisible();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVisible]);

  if (!visible) {
    return (
      <button
        onClick={toggleVisible}
        className="fixed z-50 bottom-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
        title="显示性能监控 (Ctrl+P)"
      >
        <Gauge size={18} />
      </button>
    );
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const fpsColor = stats.fps >= 55 ? 'text-green-400' : stats.fps >= 30 ? 'text-yellow-400' : 'text-red-400';
  const frameTimeColor = stats.frameTime <= 16 ? 'text-green-400' : stats.frameTime <= 32 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div
      className={`fixed z-50 ${positionClasses[position]} bg-black/70 backdrop-blur-md rounded-lg border border-white/10 text-white text-xs font-mono overflow-hidden transition-all duration-300 ${
        minimized ? 'w-24' : 'w-56'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-cyan-400" />
          <span className="font-bold text-cyan-400">3D 性能</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimized}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={minimized ? '展开' : '收起'}
          >
            {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
          <button
            onClick={toggleVisible}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/30 text-white/60 hover:text-red-400 transition-colors"
            title="隐藏 (Ctrl+P)"
          >
            ×
          </button>
        </div>
      </div>

      {minimized ? (
        <div className="px-3 py-2 text-center">
          <span className={`text-lg font-bold ${fpsColor}`}>{stats.fps}</span>
          <span className="text-white/50 ml-1">FPS</span>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Gauge size={12} />
              <span>FPS</span>
            </div>
            <span className={`font-bold ${fpsColor}`}>{stats.fps}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Clock size={12} />
              <span>帧时间</span>
            </div>
            <span className={`font-bold ${frameTimeColor}`}>{stats.frameTime.toFixed(1)} ms</span>
          </div>

          <div className="h-px bg-white/10 my-1" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Cpu size={12} />
              <span>Draw Calls</span>
            </div>
            <span className="font-bold text-white">{stats.drawCalls}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Triangle size={12} />
              <span>三角面</span>
            </div>
            <span className="font-bold text-white">{stats.triangles.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Zap size={12} />
              <span>着色器程序</span>
            </div>
            <span className="font-bold text-white">{stats.programCount}</span>
          </div>

          <div className="h-px bg-white/10 my-1" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Cpu size={12} />
              <span>GPU 资源</span>
            </div>
            <span className="font-bold text-white">{stats.memory}</span>
          </div>
        </div>
      )}

      <div className="px-3 py-1.5 border-t border-white/10 bg-white/5 text-[10px] text-white/40 text-center">
        Ctrl+P 切换显示
      </div>
    </div>
  );
}
