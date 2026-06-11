import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { RARITY_LABELS, RARITY_COLORS } from '@/data/challenges';
import { Trophy, Sparkles, X } from 'lucide-react';

export function ChallengeSuccessModal() {
  const newlyCompletedChallenge = useEcosystemStore((s) => s.newlyCompletedChallenge);
  const clearNewlyCompletedChallenge = useEcosystemStore((s) => s.clearNewlyCompletedChallenge);
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    if (newlyCompletedChallenge) {
      setShow(true);
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: newlyCompletedChallenge.badge.color,
      }));
      setParticles(newParticles);
    }
  }, [newlyCompletedChallenge]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      clearNewlyCompletedChallenge();
    }, 300);
  };

  if (!newlyCompletedChallenge) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full animate-float-up"
            style={{
              left: `${particle.x}%`,
              bottom: '-10%',
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div
        className={`relative z-10 transition-all duration-500 ${
          show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute -inset-8 rounded-3xl opacity-30 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${newlyCompletedChallenge.badge.color} 0%, transparent 70%)`,
          }}
        />

        <GlassCard className="relative p-8 w-80 text-center">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all"
          >
            <X size={14} />
          </button>

          <div className="flex justify-center mb-4">
            <div className="relative">
              <Sparkles
                size={24}
                className="absolute -top-2 -right-2 text-yellow-400 animate-spin"
                style={{ animationDuration: '3s' }}
              />
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl animate-bounce"
                style={{
                  backgroundColor: newlyCompletedChallenge.badge.color + '30',
                  boxShadow: `0 0 40px ${newlyCompletedChallenge.badge.color}60`,
                  animationDuration: '2s',
                }}
              >
                {newlyCompletedChallenge.badge.emoji}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy size={18} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">
              挑战完成！
            </span>
          </div>

          <h2 className="text-white font-bold text-2xl mb-1">
            {newlyCompletedChallenge.name}
          </h2>

          <p className="text-white/60 text-sm mb-4">
            {newlyCompletedChallenge.description}
          </p>

          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-white/40 text-xs mb-1">获得徽章</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{newlyCompletedChallenge.badge.emoji}</span>
              <div className="text-left">
                <p className="text-white font-bold text-sm">
                  {newlyCompletedChallenge.badge.name}
                </p>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: RARITY_COLORS[newlyCompletedChallenge.badge.rarity] + '30',
                    color: RARITY_COLORS[newlyCompletedChallenge.badge.rarity],
                  }}
                >
                  {RARITY_LABELS[newlyCompletedChallenge.badge.rarity]}
                </span>
              </div>
            </div>
            <p className="text-white/50 text-xs mt-2">
              {newlyCompletedChallenge.badge.description}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: newlyCompletedChallenge.badge.color,
              boxShadow: `0 0 20px ${newlyCompletedChallenge.badge.color}60`,
            }}
          >
            太棒了！
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
