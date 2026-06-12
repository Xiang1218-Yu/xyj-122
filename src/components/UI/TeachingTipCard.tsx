import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { BookOpen, X, ChevronRight } from 'lucide-react';

export function TeachingTipCard() {
  const activeTip = useEcosystemStore((s) => s.activeTip);
  const dismissTeachingTip = useEcosystemStore((s) => s.dismissTeachingTip);
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (activeTip) {
      setShow(true);
      setExpanded(false);
    }
  }, [activeTip]);

  useEffect(() => {
    if (show && activeTip && !expanded) {
      const timer = setTimeout(() => {
        setExpanded(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [show, activeTip, expanded]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      dismissTeachingTip();
    }, 400);
  };

  if (!activeTip) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center pb-8 transition-all duration-400 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-400"
        onClick={handleClose}
      />

      <div
        className={`relative z-10 w-full max-w-lg mx-4 transition-all duration-500 ${
          show ? 'translate-y-0' : 'translate-y-16'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard
          className="relative overflow-hidden"
          style={{ borderColor: activeTip.color + '60' }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 20% 50%, ${activeTip.color}40 0%, transparent 60%)`,
            }}
          />

          <div className="relative p-5">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all"
            >
              <X size={14} />
            </button>

            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 animate-bounce-in"
                style={{
                  backgroundColor: activeTip.color + '25',
                  boxShadow: `0 0 24px ${activeTip.color}30`,
                }}
              >
                {activeTip.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={14} style={{ color: activeTip.color }} />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: activeTip.color }}
                  >
                    生态教学
                  </span>
                </div>
                <h3 className="text-white font-bold text-base mb-2 pr-6">
                  {activeTip.title}
                </h3>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-white/70 text-sm leading-relaxed">
                    {activeTip.content}
                  </p>
                </div>

                {!expanded && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="flex items-center gap-1 mt-1 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: activeTip.color }}
                  >
                    <span>了解更多</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-xl text-white font-medium text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: activeTip.color + '30',
                  border: `1px solid ${activeTip.color}50`,
                }}
              >
                知道了
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
