import { useMemo, useState, useCallback } from 'react';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { computeFoodChainRelations } from '@/utils/ecosystemSimulator';
import { getSpeciesById, TROPHIC_LEVEL_COLORS } from '@/data/species';
import type { FoodChainRelation, Species } from '@/types/ecosystem';

export interface SpeciesPosition {
  x: number;
  y: number;
}

export interface FoodWebData {
  relations: FoodChainRelation[];
  presentSpecies: string[];
  positions: Record<string, SpeciesPosition>;
}

const LEVELS = ['producer', 'decomposer', 'herbivore', 'omnivore', 'carnivore'] as const;
const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 160;
const PADDING = 10;

function computePositions(presentSpecies: string[]): Record<string, SpeciesPosition> {
  const pos: Record<string, SpeciesPosition> = {};
  const byLevel: Record<string, string[]> = {
    producer: [],
    herbivore: [],
    omnivore: [],
    carnivore: [],
    decomposer: [],
  };

  presentSpecies.forEach((id) => {
    const sp = getSpeciesById(id);
    if (sp) byLevel[sp.trophicLevel].push(id);
  });

  LEVELS.forEach((level, levelIdx) => {
    const items = byLevel[level];
    const y = ((levelIdx + 0.5) / LEVELS.length) * CANVAS_HEIGHT + PADDING;
    items.forEach((id, itemIdx) => {
      const x = ((itemIdx + 0.5) / Math.max(items.length, 1)) * CANVAS_WIDTH + PADDING;
      pos[id] = { x, y };
    });
  });

  return pos;
}

function getRelatedSpecies(
  speciesId: string,
  relations: FoodChainRelation[]
): { preys: string[]; predators: string[] } {
  const preys: string[] = [];
  const predators: string[] = [];

  relations.forEach((rel) => {
    if (rel.predatorId === speciesId) {
      preys.push(rel.preyId);
    }
    if (rel.preyId === speciesId) {
      predators.push(rel.predatorId);
    }
  });

  return { preys, predators };
}

function isRelationHighlighted(
  rel: FoodChainRelation,
  highlightedId: string | null
): boolean {
  if (!highlightedId) return false;
  return rel.predatorId === highlightedId || rel.preyId === highlightedId;
}

function isNodeHighlighted(
  speciesId: string,
  highlightedId: string | null,
  relations: FoodChainRelation[]
): boolean {
  if (!highlightedId) return false;
  if (speciesId === highlightedId) return true;
  const { preys, predators } = getRelatedSpecies(highlightedId, relations);
  return preys.includes(speciesId) || predators.includes(speciesId);
}

export function useFoodWeb() {
  const organisms = useEcosystemStore((s) => s.organisms);
  const selectedSpeciesId = useEcosystemStore((s) => s.selectedSpeciesId);
  const setSelectedSpecies = useEcosystemStore((s) => s.setSelectedSpecies);

  const [hoveredSpeciesId, setHoveredSpeciesId] = useState<string | null>(null);

  const foodWebData = useMemo<FoodWebData>(() => {
    const relations = computeFoodChainRelations(organisms);
    const presentSpecies = [...new Set(organisms.map((o) => o.speciesId))];
    const positions = computePositions(presentSpecies);
    return { relations, presentSpecies, positions };
  }, [organisms]);

  const highlightedId = hoveredSpeciesId || selectedSpeciesId;

  const handleNodeClick = useCallback(
    (speciesId: string) => {
      setSelectedSpecies(selectedSpeciesId === speciesId ? null : speciesId);
    },
    [selectedSpeciesId, setSelectedSpecies]
  );

  const handleNodeHover = useCallback((speciesId: string | null) => {
    setHoveredSpeciesId(speciesId);
  }, []);

  const getNodeState = useCallback(
    (speciesId: string) => {
      return {
        isSelected: selectedSpeciesId === speciesId,
        isHovered: hoveredSpeciesId === speciesId,
        isHighlighted: isNodeHighlighted(speciesId, highlightedId, foodWebData.relations),
      };
    },
    [selectedSpeciesId, hoveredSpeciesId, highlightedId, foodWebData.relations]
  );

  const getEdgeState = useCallback(
    (rel: FoodChainRelation) => {
      return {
        isHighlighted: isRelationHighlighted(rel, highlightedId),
        hasHighlight: highlightedId !== null,
      };
    },
    [highlightedId]
  );

  const getSpeciesRelations = useCallback(
    (speciesId: string) => {
      return getRelatedSpecies(speciesId, foodWebData.relations);
    },
    [foodWebData.relations]
  );

  const getSpeciesInfo = useCallback((speciesId: string): Species | undefined => {
    return getSpeciesById(speciesId);
  }, []);

  return {
    ...foodWebData,
    highlightedId,
    hoveredSpeciesId,
    selectedSpeciesId,
    handleNodeClick,
    handleNodeHover,
    getNodeState,
    getEdgeState,
    getSpeciesRelations,
    getSpeciesInfo,
    getTrophicColor: (level: string) => TROPHIC_LEVEL_COLORS[level] || '#fff',
  };
}
