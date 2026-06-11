import { useMemo } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/data/challenges';
import { X, Trophy, Target, Zap } from 'lucide-react';

export function ChallengePanel() {
  const showChallengePanel = useEcosystemStore((s) => s.showChallengePanel);
  const toggleChallengePanel = useEcosystemStore((s) => s.toggleChallengePanel);
  const challenges = useEcosystemStore((s) => s.challenges);
  const challengeProgress = useEcosystemStore((s) => s.challengeProgress);

  const sortedChallenges = useMemo(() => {
    return [...challenges].sort((a, b) => {
      const aProgress = challengeProgress[a.id];
      const bProgress = challengeProgress[b.id];
      if (aProgress?.completed && !bProgress?.completed) return 1;
      if (!aProgress?.completed && bProgress?.completed) return -1;
      const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  }, [challenges, challengeProgress]);

  const completedCount = useMemo(() => {
    return Object.values(challengeProgress).filter((p) => p.completed).length;
  }, [challengeProgress]);

  if (!showChallengePanel) return null;

  return (
    <div className="absolute top-20 left-4 z-40 w-80 animate-in slide-in-from-left-4 duration-300">
      <GlassCard className="p-4 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" />
            <h3 className="text-white font-bold text-lg">生态挑战</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">
              {completedCount}/{challenges.length}
            </span>
            <button
              onClick={toggleChallengePanel}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {sortedChallenges.map((challenge) => {
            const progress = challengeProgress[challenge.id];
            const isCompleted = progress?.completed;
            const currentValue = progress?.currentValue || 0;
            const progressPercent = Math.min(100, (currentValue / challenge.target) * 100);

            return (
              <div
                key={challenge.id}
                className={`p-3 rounded-xl transition-all ${
                  isCompleted
                    ? 'bg-green-500/20 border border-green-500/40'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      backgroundColor: isCompleted
                        ? challenge.badge.color + '40'
                        : 'rgba(255,255,255,0.1)',
                      boxShadow: isCompleted
                        ? `0 0 12px ${challenge.badge.color}40`
                        : 'none',
                    }}
                  >
                    {isCompleted ? challenge.badge.emoji : <Target size={16} className="text-white/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-bold text-sm ${
                          isCompleted ? 'text-green-300' : 'text-white'
                        }`}
                      >
                        {challenge.name}
                      </h4>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + '30',
                          color: DIFFICULTY_COLORS[challenge.difficulty],
                        }}
                      >
                        {DIFFICULTY_LABELS[challenge.difficulty]}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs mb-2">
                      {challenge.description}
                    </p>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: isCompleted
                            ? '#4ADE80'
                            : challenge.badge.color,
                          boxShadow: isCompleted
                            ? '0 0 6px #4ADE80'
                            : `0 0 6px ${challenge.badge.color}80`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-white/40">
                      <span>
                        {currentValue} / {challenge.target}
                      </span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                  </div>
                </div>
                {challenge.hint && !isCompleted && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-start gap-1.5">
                    <Zap size={12} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-yellow-200/70">
                      {challenge.hint}
                    </p>
                  </div>
                )}
                {isCompleted && (
                  <div className="mt-2 pt-2 border-t border-green-500/20 flex items-center gap-1.5">
                    <Trophy size={12} className="text-green-400" />
                    <span className="text-[10px] text-green-300">
                      获得徽章：{challenge.badge.name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
