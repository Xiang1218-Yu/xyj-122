import { useMemo, useState } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { RARITY_LABELS, RARITY_COLORS } from '@/data/challenges';
import { X, Award, Lock } from 'lucide-react';
import type { Badge } from '@/types/ecosystem';

export function BadgeCollection() {
  const showBadgeCollection = useEcosystemStore((s) => s.showBadgeCollection);
  const toggleBadgeCollection = useEcosystemStore((s) => s.toggleBadgeCollection);
  const challenges = useEcosystemStore((s) => s.challenges);
  const challengeProgress = useEcosystemStore((s) => s.challengeProgress);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const badges = useMemo(() => {
    return challenges.map((c) => ({
      badge: c.badge,
      unlocked: challengeProgress[c.id]?.completed || false,
      challengeName: c.name,
    }));
  }, [challenges, challengeProgress]);

  const sortedBadges = useMemo(() => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return [...badges].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return rarityOrder[a.badge.rarity] - rarityOrder[b.badge.rarity];
    });
  }, [badges]);

  const unlockedCount = useMemo(() => {
    return badges.filter((b) => b.unlocked).length;
  }, [badges]);

  if (!showBadgeCollection) return null;

  return (
    <div className="absolute top-20 left-4 z-40 w-80 animate-in slide-in-from-left-4 duration-300">
      <GlassCard className="p-4 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-amber-400" />
            <h3 className="text-white font-bold text-lg">徽章收藏</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">
              {unlockedCount}/{badges.length}
            </span>
            <button
              onClick={toggleBadgeCollection}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-2">
            {sortedBadges.map(({ badge, unlocked, challengeName }) => (
              <div
                key={badge.id}
                onClick={() => unlocked && setSelectedBadge(badge)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  unlocked
                    ? 'bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10'
                    : 'bg-white/5 cursor-not-allowed opacity-60'
                }`}
                style={{
                  boxShadow: unlocked
                    ? `inset 0 0 20px ${badge.color}20, 0 0 10px ${badge.color}10`
                    : 'none',
                }}
              >
                <div
                  className="text-2xl mb-1"
                  style={{
                    filter: unlocked ? 'none' : 'grayscale(100%)',
                  }}
                >
                  {unlocked ? badge.emoji : <Lock size={20} className="text-white/30" />}
                </div>
                <span
                  className={`text-[10px] text-center px-1 ${
                    unlocked ? 'text-white/80' : 'text-white/30'
                  }`}
                >
                  {unlocked ? badge.name : '???'}
                </span>
                {unlocked && (
                  <span
                    className="text-[8px] mt-0.5 px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: RARITY_COLORS[badge.rarity] + '30',
                      color: RARITY_COLORS[badge.rarity],
                    }}
                  >
                    {RARITY_LABELS[badge.rarity]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedBadge && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedBadge(null)}
          >
            <div
              className="animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6 w-72 text-center">
                <div
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-4"
                  style={{
                    backgroundColor: selectedBadge.color + '30',
                    boxShadow: `0 0 30px ${selectedBadge.color}40`,
                  }}
                >
                  {selectedBadge.emoji}
                </div>
                <h3 className="text-white font-bold text-xl mb-1">
                  {selectedBadge.name}
                </h3>
                <span
                  className="inline-block text-xs px-2 py-0.5 rounded-full mb-3"
                  style={{
                    backgroundColor: RARITY_COLORS[selectedBadge.rarity] + '30',
                    color: RARITY_COLORS[selectedBadge.rarity],
                  }}
                >
                  {RARITY_LABELS[selectedBadge.rarity]}
                </span>
                <p className="text-white/60 text-sm">
                  {selectedBadge.description}
                </p>
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="mt-4 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  关闭
                </button>
              </GlassCard>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
