import { SPECIES, TROPHIC_LEVEL_LABELS, TROPHIC_LEVEL_COLORS } from '@/data/species';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { GlassCard } from '@/components/common/GlassCard';
import type { TrophicLevel } from '@/types/ecosystem';

const LEVEL_ORDER: TrophicLevel[] = ['producer', 'herbivore', 'carnivore', 'decomposer'];

export function SpeciesToolbar() {
  const selectedSpeciesId = useEcosystemStore((s) => s.selectedSpeciesId);
  const setSelectedSpecies = useEcosystemStore((s) => s.setSelectedSpecies);
  const organisms = useEcosystemStore((s) => s.organisms);

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
      {LEVEL_ORDER.map((level) => {
        const levelSpecies = SPECIES.filter((s) => s.trophicLevel === level);
        return (
          <div key={level} className="flex flex-col gap-2">
            <div
              className="text-xs font-bold text-center px-2 py-1 rounded-full"
              style={{
                backgroundColor: TROPHIC_LEVEL_COLORS[level] + '40',
                color: TROPHIC_LEVEL_COLORS[level],
              }}
            >
              {TROPHIC_LEVEL_LABELS[level]}
            </div>
            <div className="flex flex-col gap-2">
              {levelSpecies.map((species) => {
                const isSelected = selectedSpeciesId === species.id;
                const count = organisms.filter((o) => o.speciesId === species.id).length;
                return (
                  <GlassCard
                    key={species.id}
                    className={`p-2 transition-all duration-300 ${
                      isSelected ? 'scale-110 ring-2 ring-white' : ''
                    }`}
                    onClick={() => setSelectedSpecies(isSelected ? null : species.id)}
                  >
                    <div className="relative">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-transform hover:scale-110"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${species.color}60, ${species.color}20)`,
                          boxShadow: isSelected ? `0 0 20px ${species.color}80` : 'none',
                        }}
                      >
                        {species.emoji}
                      </div>
                      <div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                        style={{ backgroundColor: species.color }}
                      >
                        {count}
                      </div>
                    </div>
                    <div className="text-center text-white text-xs mt-1 font-medium">
                      {species.name}
                    </div>
                    <div className="text-center text-white/50 text-[10px]">
                      上限 {species.maxPopulation}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
