import { CollapsibleDraggablePanel } from '@/components/common/CollapsibleDraggablePanel';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { getSpeciesById, TROPHIC_LEVEL_COLORS, TROPHIC_LEVEL_LABELS } from '@/data/species';
import { Trash2, Crosshair, Eye, EyeOff } from 'lucide-react';

export function SpeciesInfoCard() {
  const selectedOrganismId = useEcosystemStore((s) => s.selectedOrganismId);
  const trackingOrganismId = useEcosystemStore((s) => s.trackingOrganismId);
  const organisms = useEcosystemStore((s) => s.organisms);
  const setSelectedOrganism = useEcosystemStore((s) => s.setSelectedOrganism);
  const toggleTracking = useEcosystemStore((s) => s.toggleTracking);
  const removeOrganism = useEcosystemStore((s) => s.removeOrganism);

  const organism = organisms.find((o) => o.id === selectedOrganismId);
  const species = organism ? getSpeciesById(organism.speciesId) : null;
  const isTracking = organism ? trackingOrganismId === organism.id : false;

  if (!organism || !species) return null;

  const energyPercent = (organism.energy / (species.energyValue * 1.5)) * 100;
  const agePercent = (organism.age / species.lifespan) * 100;

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      idle: '休息中',
      wandering: '漫游中',
      hunting: '捕猎中',
      fleeing: '逃跑中',
      eating: '进食中',
      reproducing: '繁殖中',
    };
    return labels[state] || state;
  };

  const headerExtra = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedOrganism(null);
      }}
      className="p-1 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/10 mr-1"
      title="关闭"
    >
      ✕
    </button>
  );

  return (
    <CollapsibleDraggablePanel
      id="species-info-card"
      title={species.name}
      emoji={species.emoji}
      defaultPosition={{ right: 16, top: 80 }}
      defaultExpanded={true}
      zIndex={40}
      width={288}
      contentClassName="p-5 pt-0"
      headerExtra={headerExtra}
      persistPosition={false}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${species.color}80, ${species.color}30)`,
                boxShadow: isTracking
                  ? `0 0 30px ${species.color}80, 0 0 60px ${species.color}40`
                  : `0 0 20px ${species.color}40`,
              }}
            >
              {species.emoji}
            </div>
            {isTracking && (
              <div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center animate-pulse"
                style={{ backgroundColor: species.color }}
              >
                <Crosshair size={14} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-xl">{species.name}</h3>
              {isTracking && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium animate-pulse"
                  style={{
                    backgroundColor: species.color + '40',
                    color: species.color,
                    boxShadow: `0 0 10px ${species.color}60`,
                  }}
                >
                  追踪中
                </span>
              )}
            </div>
            <div
              className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
              style={{
                backgroundColor: TROPHIC_LEVEL_COLORS[species.trophicLevel] + '40',
                color: TROPHIC_LEVEL_COLORS[species.trophicLevel],
              }}
            >
              {TROPHIC_LEVEL_LABELS[species.trophicLevel]}
            </div>
          </div>
        </div>
      </div>

      <p className="text-white/70 text-sm mb-4 leading-relaxed">{species.description}</p>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60">能量值</span>
            <span className="text-yellow-400 font-medium">{Math.round(organism.energy)} / {species.energyValue}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{
                width: `${energyPercent}%`,
                boxShadow: '0 0 8px #facc15',
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60">寿命</span>
            <span className="text-cyan-400 font-medium">{Math.round(organism.age)} / {species.lifespan}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{
                width: `${agePercent}%`,
                boxShadow: '0 0 8px #22d3ee',
              }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-white/60 text-xs">当前状态</span>
          <span className="text-white font-medium text-sm">{getStateLabel(organism.state)}</span>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-2">
        {species.diet.length > 0 && (
          <div>
            <div className="text-white/60 text-xs mb-1">食物</div>
            <div className="flex flex-wrap gap-1">
              {species.diet.map((id) => {
                const prey = getSpeciesById(id);
                if (!prey) return null;
                return (
                  <span
                    key={id}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: prey.color + '40', color: 'white' }}
                  >
                    {prey.emoji} {prey.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {species.predators.length > 0 && (
          <div>
            <div className="text-white/60 text-xs mb-1">天敌</div>
            <div className="flex flex-wrap gap-1">
              {species.predators.map((id) => {
                const pred = getSpeciesById(id);
                if (!pred) return null;
                return (
                  <span
                    key={id}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: pred.color + '40', color: 'white' }}
                  >
                    {pred.emoji} {pred.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => toggleTracking(organism.id)}
        className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all text-sm font-medium ${
          isTracking
            ? 'bg-white/10 text-white hover:bg-white/15 border border-white/20'
            : ''
        }`}
        style={
          !isTracking
            ? {
                backgroundColor: species.color + '30',
                color: species.color,
                boxShadow: `0 0 15px ${species.color}20`,
              }
            : undefined
        }
        onMouseEnter={(e) => {
          if (!isTracking) {
            e.currentTarget.style.backgroundColor = species.color + '45';
          }
        }}
        onMouseLeave={(e) => {
          if (!isTracking) {
            e.currentTarget.style.backgroundColor = species.color + '30';
          }
        }}
      >
        {isTracking ? (
          <>
            <EyeOff size={16} />
            取消追踪
          </>
        ) : (
          <>
            <Eye size={16} />
            开始追踪此生物
          </>
        )}
      </button>

      <button
        onClick={() => {
          removeOrganism(organism.id);
          setSelectedOrganism(null);
        }}
        className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
      >
        <Trash2 size={16} />
        移除此生物
      </button>
    </CollapsibleDraggablePanel>
  );
}
