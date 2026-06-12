import type { Organism } from '@/types/ecosystem';
import { getSpeciesById } from '@/data/species';

export function getPresentSpecies(organisms: Organism[]): string[] {
  return [...new Set(organisms.map((o) => o.speciesId))];
}

export function computeFoodChainRelations(organisms: Organism[]): {
  predatorId: string;
  preyId: string;
}[] {
  const relations: { predatorId: string; preyId: string }[] = [];
  const seen = new Set<string>();

  for (const organism of organisms) {
    const species = getSpeciesById(organism.speciesId);
    if (!species) continue;

    for (const preyId of species.diet) {
      const hasPrey = organisms.some((o) => o.speciesId === preyId);
      if (hasPrey) {
        const key = `${organism.speciesId}-${preyId}`;
        if (!seen.has(key)) {
          seen.add(key);
          relations.push({ predatorId: organism.speciesId, preyId });
        }
      }
    }
  }

  return relations;
}

export function computeLongestFoodChain(organisms: Organism[]): number {
  const presentSpecies = getPresentSpecies(organisms);
  if (presentSpecies.length === 0) return 0;

  const relations = computeFoodChainRelations(organisms);

  const preyMap: Record<string, string[]> = {};
  relations.forEach((rel) => {
    if (!preyMap[rel.predatorId]) preyMap[rel.predatorId] = [];
    preyMap[rel.predatorId].push(rel.preyId);
  });

  const memo: Record<string, number> = {};

  function getChainLength(speciesId: string): number {
    if (memo[speciesId] !== undefined) return memo[speciesId];

    const preys = preyMap[speciesId] || [];
    if (preys.length === 0) {
      memo[speciesId] = 1;
      return 1;
    }

    let maxPreyChain = 0;
    preys.forEach((preyId) => {
      const preyChain = getChainLength(preyId);
      if (preyChain > maxPreyChain) maxPreyChain = preyChain;
    });

    memo[speciesId] = maxPreyChain + 1;
    return memo[speciesId];
  }

  let maxChain = 0;
  presentSpecies.forEach((speciesId) => {
    const chainLength = getChainLength(speciesId);
    if (chainLength > maxChain) maxChain = chainLength;
  });

  return maxChain;
}

export function countTrophicLevels(organisms: Organism[]): number {
  const presentSpecies = getPresentSpecies(organisms);
  const levels = new Set<string>();

  presentSpecies.forEach((speciesId) => {
    const sp = getSpeciesById(speciesId);
    if (sp) levels.add(sp.trophicLevel);
  });

  return levels.size;
}

export function getTrophicLevelCounts(organisms: Organism[]): Record<string, number> {
  const counts: Record<string, number> = {
    producer: 0,
    herbivore: 0,
    omnivore: 0,
    carnivore: 0,
    decomposer: 0,
  };

  organisms.forEach((organism) => {
    const sp = getSpeciesById(organism.speciesId);
    if (sp) counts[sp.trophicLevel]++;
  });

  return counts;
}
