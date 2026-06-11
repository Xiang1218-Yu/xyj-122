import { useRef, useState, useMemo, useCallback } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { History, Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import type { HistorySnapshot } from '@/types/ecosystem';

function formatTime(ticks: number): string {
  const totalSeconds = Math.floor(ticks / 16);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function Timeline() {
  const history = useEcosystemStore((s) => s.history);
  const simulationTime = useEcosystemStore((s) => s.simulationTime);
  const isRunning = useEcosystemStore((s) => s.isRunning);
  const isRewinding = useEcosystemStore((s) => s.isRewinding);
  const rewindTime = useEcosystemStore((s) => s.rewindTime);
  const toggleSimulation = useEcosystemStore((s) => s.toggleSimulation);
  const seekToTime = useEcosystemStore((s) => s.seekToTime);
  const exitRewind = useEcosystemStore((s) => s.exitRewind);

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSnapshot, setHoveredSnapshot] = useState<HistorySnapshot | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);

  const { minTime, maxTime, timeRange } = useMemo(() => {
    if (history.length === 0) {
      return { minTime: 0, maxTime: 0, timeRange: 0 };
    }
    const minTime = history[0].time;
    const maxTime = history[history.length - 1].time;
    return { minTime, maxTime, timeRange: Math.max(1, maxTime - minTime) };
  }, [history]);

  const currentDisplayTime = isRewinding ? rewindTime : simulationTime;

  const getTimeFromX = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || history.length === 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return minTime + ratio * timeRange;
    },
    [minTime, timeRange, history.length]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (history.length === 0) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    const targetTime = getTimeFromX(e.clientX);
    seekToTime(targetTime);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (history.length === 0) return;

    const timeAtPos = getTimeFromX(e.clientX);
    const rect = trackRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverPos(Math.max(0, Math.min(rect.width, e.clientX - rect.left)));
      if (history.length > 0) {
        let closest = history[0];
        let minDiff = Math.abs(timeAtPos - closest.time);
        for (let i = 1; i < history.length; i++) {
          const diff = Math.abs(timeAtPos - history[i].time);
          if (diff < minDiff) {
            minDiff = diff;
            closest = history[i];
          }
        }
        setHoveredSnapshot(closest);
      }
    }

    if (!isDragging) return;
    const targetTime = getTimeFromX(e.clientX);
    seekToTime(targetTime);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  const handlePointerLeave = () => {
    setHoveredSnapshot(null);
  };

  const handleJumpToStart = () => {
    if (history.length === 0) return;
    seekToTime(minTime);
  };

  const handleJumpToEnd = () => {
    if (isRewinding) {
      exitRewind();
    }
  };

  const progressPercent = timeRange > 0
    ? ((currentDisplayTime - minTime) / timeRange) * 100
    : 0;

  const chartPoints = useMemo(() => {
    if (history.length < 2) return '';
    const maxOrg = Math.max(1, ...history.map((h) => h.totalOrganisms));
    const step = 100 / (history.length - 1);
    return history
      .map((h, i) => {
        const x = i * step;
        const y = 100 - (h.totalOrganisms / maxOrg) * 80 - 10;
        return `${x},${y}`;
      })
      .join(' ');
  }, [history]);

  const balanceAreaPoints = useMemo(() => {
    if (history.length < 2) return '';
    const step = 100 / (history.length - 1);
    const points = history.map((h, i) => {
      const x = i * step;
      const y = 100 - (h.balanceIndex / 100) * 80 - 10;
      return `${x},${y}`;
    });
    return `0,100 ${points.join(' ')} 100,100`;
  }, [history]);

  const hasHistory = history.length > 0;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(90vw,900px)]">
      <GlassCard className="px-5 py-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isRewinding
                  ? 'bg-violet-500/30 box-shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                  : 'bg-cyan-500/20'
              }`}
            >
              <History
                size={16}
                className={isRewinding ? 'text-violet-300 animate-pulse' : 'text-cyan-300'}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white/70 text-[10px] uppercase tracking-wider">
                {isRewinding ? '历史回看模式' : hasHistory ? '可拖动时间轴回看' : '正在记录历史...'}
              </span>
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-white/50" />
                <span className="text-white font-mono text-sm font-bold">
                  {formatTime(currentDisplayTime)}
                </span>
                {hasHistory && (
                  <span className="text-white/40 font-mono text-xs">
                    / {formatTime(maxTime)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={handleJumpToStart}
              disabled={!hasHistory}
              className={`p-1.5 rounded-lg transition-colors ${
                hasHistory
                  ? 'hover:bg-white/10 text-white/70 hover:text-white'
                  : 'text-white/20 cursor-not-allowed'
              }`}
              title="跳到最早记录"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={toggleSimulation}
              disabled={!hasHistory && !isRunning}
              className={`p-2 rounded-xl transition-all ${
                isRewinding
                  ? 'bg-violet-500/30 text-violet-200 hover:bg-violet-500/50'
                  : isRunning
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
              title={isRewinding ? '回到实时' : isRunning ? '暂停模拟' : '继续模拟'}
            >
              {isRewinding || !isRunning ? <Play size={16} /> : <Pause size={16} />}
            </button>

            <button
              onClick={handleJumpToEnd}
              disabled={!isRewinding}
              className={`p-1.5 rounded-lg transition-colors ${
                isRewinding
                  ? 'hover:bg-white/10 text-white/70 hover:text-white'
                  : 'text-white/20 cursor-not-allowed'
              }`}
              title="回到实时"
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className={`relative h-20 rounded-xl overflow-hidden cursor-pointer select-none ${
            hasHistory
              ? isRewinding
                ? 'bg-violet-950/40 border border-violet-500/30'
                : 'bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20'
              : 'bg-white/5 border border-white/5 cursor-not-allowed'
          } transition-colors`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {hasHistory && (
              <polygon
                points={balanceAreaPoints}
                fill="url(#balanceGradient)"
                opacity={0.3}
              />
            )}
            {hasHistory && (
              <polyline
                points={chartPoints}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
                opacity={0.8}
              />
            )}
            <defs>
              <linearGradient id="balanceGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="50%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
            </defs>
          </svg>

          {hasHistory && (
            <div className="absolute inset-0 flex justify-between px-2 items-end pb-1 pointer-events-none">
              <span className="text-[9px] font-mono text-white/30">
                {formatTime(minTime)}
              </span>
              <span className="text-[9px] font-mono text-white/30">
                生物数量 & 平衡指数
              </span>
              <span className="text-[9px] font-mono text-white/30">
                {formatTime(maxTime)}
              </span>
            </div>
          )}

          {!hasHistory && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-white/30 text-xs">等待积累历史数据...</span>
              </div>
            </div>
          )}

          {hasHistory && (
            <>
              <div
                className={`absolute top-0 bottom-0 transition-opacity pointer-events-none ${
                  isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{
                  left: 0,
                  width: `${progressPercent}%`,
                  background: isRewinding
                    ? 'linear-gradient(to right, rgba(139,92,246,0.25), rgba(139,92,246,0.08))'
                    : 'linear-gradient(to right, rgba(34,211,238,0.2), rgba(34,211,238,0.05))',
                }}
              />

              <div
                className="absolute top-0 bottom-0 w-px pointer-events-none"
                style={{
                  left: `${progressPercent}%`,
                  background: isRewinding
                    ? 'linear-gradient(to bottom, transparent, #A78BFA, transparent)'
                    : 'linear-gradient(to bottom, transparent, #22D3EE, transparent)',
                }}
              >
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-transform ${
                    isRewinding
                      ? 'bg-violet-500 border-violet-200 shadow-[0_0_12px_rgba(167,139,250,0.8)]'
                      : 'bg-cyan-400 border-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                  } ${isDragging ? 'scale-125' : 'hover:scale-110'}`}
                />
              </div>

              {hoveredSnapshot && (
                <div
                  className="absolute bottom-full mb-2 -translate-x-1/2 pointer-events-none z-50"
                  style={{ left: `${hoverPos}px` }}
                >
                  <GlassCard className="px-3 py-2 !bg-slate-900/90 whitespace-nowrap border-white/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock size={11} className="text-cyan-400" />
                      <span className="font-mono font-bold text-white text-sm">
                        {formatTime(hoveredSnapshot.time)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-white/60">生物总数</span>
                        <span className="text-white font-bold ml-auto">
                          {hoveredSnapshot.totalOrganisms}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              hoveredSnapshot.balanceIndex > 70
                                ? '#4ADE80'
                                : hoveredSnapshot.balanceIndex > 40
                                ? '#FACC15'
                                : '#F87171',
                          }}
                        />
                        <span className="text-white/60">平衡指数</span>
                        <span className="text-white font-bold ml-auto">
                          {Math.round(hoveredSnapshot.balanceIndex)}
                        </span>
                      </div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 rotate-45 bg-slate-900/90 border-r border-b border-white/20" />
                  </GlassCard>
                </div>
              )}
            </>
          )}
        </div>

        {isRewinding && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              <span className="text-violet-300 text-xs">
                正在回看历史快照 — 点击播放按钮返回实时模拟
              </span>
            </div>
            <button
              onClick={exitRewind}
              className="text-xs text-violet-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              退出回看
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
