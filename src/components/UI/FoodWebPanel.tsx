import { CollapsibleDraggablePanel } from '@/components/common/CollapsibleDraggablePanel';
import { useFoodWeb } from '@/hooks/useFoodWeb';
import { FoodWebNode } from './FoodWebNode';
import { FoodWebEdge } from './FoodWebEdge';
import { SpeciesRelationTooltip } from './SpeciesRelationTooltip';
import { SPECIES } from '@/data/species';

export function FoodWebPanel() {
  const {
    relations,
    presentSpecies,
    positions,
    highlightedId,
    hoveredSpeciesId,
    handleNodeClick,
    handleNodeHover,
    getNodeState,
    getEdgeState,
    getSpeciesRelations,
    getSpeciesInfo,
    getTrophicColor,
  } = useFoodWeb();

  const hasActiveHighlight = highlightedId !== null;
  const hoveredSpecies = hoveredSpeciesId ? getSpeciesInfo(hoveredSpeciesId) : null;
  const hoveredPosition = hoveredSpeciesId ? positions[hoveredSpeciesId] : null;
  const hoveredRelations = hoveredSpeciesId ? getSpeciesRelations(hoveredSpeciesId) : null;

  return (
    <CollapsibleDraggablePanel
      id="food-web-panel"
      title="食物链网络"
      emoji="🔗"
      defaultPosition={{ right: 16, bottom: 144 }}
      defaultExpanded={true}
      zIndex={30}
      width={260}
      contentClassName="p-4 pt-0"
    >
      {presentSpecies.length === 0 ? (
        <div className="w-full h-44 flex items-center justify-center text-white/40 text-sm">
          放入物种后查看食物链
        </div>
      ) : (
        <svg width="220" height="180" className="overflow-visible mx-auto">
          {relations.map((rel, idx) => {
            const from = positions[rel.preyId];
            const to = positions[rel.predatorId];
            if (!from || !to) return null;

            const sp = getSpeciesInfo(rel.predatorId);
            const edgeState = getEdgeState(rel);

            return (
              <FoodWebEdge
                key={idx}
                index={idx}
                fromPosition={from}
                toPosition={to}
                predatorColor={sp?.color || '#fff'}
                isHighlighted={edgeState.isHighlighted}
                hasActiveHighlight={edgeState.hasHighlight}
              />
            );
          })}

          {presentSpecies.map((id) => {
            const sp = getSpeciesInfo(id);
            const pos = positions[id];
            if (!sp || !pos) return null;

            const nodeState = getNodeState(id);

            return (
              <FoodWebNode
                key={id}
                species={sp}
                position={pos}
                isSelected={nodeState.isSelected}
                isHovered={nodeState.isHovered}
                isHighlighted={nodeState.isHighlighted}
                hasActiveHighlight={hasActiveHighlight}
                trophicColor={getTrophicColor(sp.trophicLevel)}
                onClick={() => handleNodeClick(id)}
                onMouseEnter={() => handleNodeHover(id)}
                onMouseLeave={() => handleNodeHover(null)}
              />
            );
          })}

          {hoveredSpecies && hoveredPosition && hoveredRelations && (
            <SpeciesRelationTooltip
              species={hoveredSpecies}
              preys={hoveredRelations.preys}
              predators={hoveredRelations.predators}
              position={hoveredPosition}
            />
          )}
        </svg>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        {SPECIES.filter((s) => presentSpecies.includes(s.id)).map((sp) => {
          const isHighlighted = hasActiveHighlight
            ? highlightedId === sp.id ||
              (hoveredRelations &&
                (hoveredRelations.preys.includes(sp.id) ||
                  hoveredRelations.predators.includes(sp.id)))
            : true;

          return (
            <div
              key={sp.id}
              className="text-[10px] px-2 py-0.5 rounded-full text-white transition-opacity duration-200 cursor-pointer"
              style={{
                backgroundColor: sp.color + '60',
                opacity: isHighlighted ? 1 : 0.3,
              }}
              onClick={() => handleNodeClick(sp.id)}
              onMouseEnter={() => handleNodeHover(sp.id)}
              onMouseLeave={() => handleNodeHover(null)}
            >
              {sp.emoji} {sp.name}
            </div>
          );
        })}
      </div>
    </CollapsibleDraggablePanel>
  );
}
