import { useMemo } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { Play, Pause, RotateCcw, Eye, EyeOff, Sparkles, ChevronDown, ChevronUp, Trophy, Award } from 'lucide-react';

export function ControlButtons() {
  const isRunning = useEcosystemStore((s) => s.isRunning);
  const toggleSimulation = useEcosystemStore((s) => s.toggleSimulation);
  const resetEcosystem = useEcosystemStore((s) => s.resetEcosystem);
  const showLabels = useEcosystemStore((s) => s.showLabels);
  const toggleLabels = useEcosystemStore((s) => s.toggleLabels);
  const showTimeline = useEcosystemStore((s) => s.showTimeline);
  const toggleTimeline = useEcosystemStore((s) => s.toggleTimeline);
  const selectedSpeciesId = useEcosystemStore((s) => s.selectedSpeciesId);
  const toggleChallengePanel = useEcosystemStore((s) => s.toggleChallengePanel);
  const toggleBadgeCollection = useEcosystemStore((s) => s.toggleBadgeCollection);
  const showChallengePanel = useEcosystemStore((s) => s.showChallengePanel);
  const showBadgeCollection = useEcosystemStore((s) => s.showBadgeCollection);
  const challengeProgress = useEcosystemStore((s) => s.challengeProgress);

  const completedCount = useMemo(() => {
    return Object.values(challengeProgress).filter((p) => p.completed).length;
  }, [challengeProgress]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
      <GlassCard className="px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-2 pr-3 border-r border-white/20">
          <Sparkles size={18} className="text-cyan-400" />
          <span className="text-white font-bold text-lg tracking-wide">
            3D 虚拟生态缸
          </span>
        </div>

        {selectedSpeciesId && (
          <div className="px-3 py-1 rounded-full bg-cyan-500/30 text-cyan-300 text-sm animate-pulse">
            👆 点击缸内任意位置放置物种
          </div>
        )}

        <div className="flex items-center gap-1 pl-2 border-l border-white/20">
          <button
            onClick={toggleSimulation}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
            title={isRunning ? '暂停模拟' : '开始模拟'}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={toggleLabels}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
            title={showLabels ? '隐藏标签' : '显示标签'}
          >
            {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          <button
            onClick={resetEcosystem}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
            title="重置生态缸"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={toggleTimeline}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
            title={showTimeline ? '收起时间轴' : '展开时间轴'}
          >
            {showTimeline ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>

        <div className="flex items-center gap-1 pl-2 border-l border-white/20">
          <button
            onClick={toggleChallengePanel}
            className={`p-2 rounded-xl transition-colors relative ${
              showChallengePanel ? 'bg-yellow-500/30 text-yellow-300' : 'hover:bg-white/10 text-white'
            }`}
            title="挑战任务"
          >
            <Trophy size={18} />
            {completedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-[10px] font-bold flex items-center justify-center text-black">
                {completedCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleBadgeCollection}
            className={`p-2 rounded-xl transition-colors ${
              showBadgeCollection ? 'bg-amber-500/30 text-amber-300' : 'hover:bg-white/10 text-white'
            }`}
            title="徽章收藏"
          >
            <Award size={18} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
