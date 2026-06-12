import { memo } from 'react';
import { getSpeciesById, TROPHIC_LEVEL_COLORS, TROPHIC_LEVEL_LABELS } from '@/data/species';
import type { Species } from '@/types/ecosystem';

interface SpeciesRelationTooltipProps {
  species: Species;
  preys: string[];
  predators: string[];
  position: { x: number; y: number };
}

export const SpeciesRelationTooltip = memo(function SpeciesRelationTooltip({
  species,
  preys,
  predators,
  position,
}: SpeciesRelationTooltipProps) {
  const tooltipX = position.x + 30;
  const tooltipY = position.y - 20;

  return (
    <foreignObject x={tooltipX} y={tooltipY} width="180" style={{ overflow: 'visible' }}>
      <div
        className="rounded-lg p-3 text-xs text-white shadow-lg backdrop-blur-sm border border-white/10"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          minWidth: '160px',
          pointerEvents: 'none',
        }}
      >
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
          <span className="text-lg">{species.emoji}</span>
          <div>
            <div className="font-semibold text-sm">{species.name}</div>
            <div
              className="text-[10px] px-1.5 py-0.5 rounded inline-block"
              style={{
                backgroundColor: TROPHIC_LEVEL_COLORS[species.trophicLevel] + '40',
                color: TROPHIC_LEVEL_COLORS[species.trophicLevel],
              }}
            >
              {TROPHIC_LEVEL_LABELS[species.trophicLevel]}
            </div>
          </div>
        </div>

        {preys.length > 0 && (
          <div className="mb-2">
            <div className="text-white/60 text-[10px] mb-1 font-medium">🍽️ 捕食</div>
            <div className="flex flex-wrap gap-1">
              {preys.map((preyId) => {
                const prey = getSpeciesById(preyId);
                if (!prey) return null;
                return (
                  <span
                    key={preyId}
                    className="px-1.5 py-0.5 rounded text-[10px]"
                    style={{ backgroundColor: prey.color + '30', color: 'white' }}
                  >
                    {prey.emoji} {prey.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {predators.length > 0 && (
          <div>
            <div className="text-white/60 text-[10px] mb-1 font-medium">⚠️ 天敌</div>
            <div className="flex flex-wrap gap-1">
              {predators.map((predId) => {
                const pred = getSpeciesById(predId);
                if (!pred) return null;
                return (
                  <span
                    key={predId}
                    className="px-1.5 py-0.5 rounded text-[10px]"
                    style={{ backgroundColor: pred.color + '30', color: 'white' }}
                  >
                    {pred.emoji} {pred.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {preys.length === 0 && predators.length === 0 && (
          <div className="text-white/40 text-[10px]">暂无捕食关系</div>
        )}
      </div>
    </foreignObject>
  );
});
