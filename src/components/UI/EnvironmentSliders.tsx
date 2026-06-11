import { useMemo } from 'react';
import { CollapsibleDraggablePanel } from '@/components/common/CollapsibleDraggablePanel';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { getSpeciesById } from '@/data/species';
import { Info } from 'lucide-react';

function getTemperatureColor(temp: number): string {
  if (temp < 12) return '#60A5FA';
  if (temp < 20) return '#34D399';
  if (temp < 28) return '#FBBF24';
  if (temp < 34) return '#F97316';
  return '#EF4444';
}

function getTemperatureEmoji(temp: number): string {
  if (temp < 12) return '❄️';
  if (temp < 20) return '🌊';
  if (temp < 28) return '🌡️';
  if (temp < 34) return '🔥';
  return '☀️';
}

function getLightColor(light: number): string {
  if (light < 0.2) return '#4B5563';
  if (light < 0.4) return '#6B7280';
  if (light < 0.6) return '#FCD34D';
  if (light < 0.8) return '#FBBF24';
  return '#FEF3C7';
}

function getLightEmoji(light: number): string {
  if (light < 0.2) return '🌑';
  if (light < 0.4) return '🌙';
  if (light < 0.6) return '⛅';
  if (light < 0.8) return '☀️';
  return '🔆';
}

function getFitnessColor(fitness: number): string {
  if (fitness >= 0.8) return '#22C55E';
  if (fitness >= 0.6) return '#84CC16';
  if (fitness >= 0.4) return '#EAB308';
  if (fitness >= 0.25) return '#F97316';
  return '#EF4444';
}

function getStatusColor(status: string): string {
  switch (status) {
    case '适宜':
      return '#22C55E';
    case '偏冷':
    case '偏暗':
    case '偏热':
    case '偏亮':
      return '#EAB308';
    case '过冷':
    case '过热':
    case '过暗':
    case '过亮':
      return '#EF4444';
    default:
      return '#9CA3AF';
  }
}

export function EnvironmentSliders() {
  const waterTemperature = useEcosystemStore((s) => s.waterTemperature);
  const lightIntensity = useEcosystemStore((s) => s.lightIntensity);
  const setWaterTemperature = useEcosystemStore((s) => s.setWaterTemperature);
  const setLightIntensity = useEcosystemStore((s) => s.setLightIntensity);
  const organisms = useEcosystemStore((s) => s.organisms);
  const selectedOrganismId = useEcosystemStore((s) => s.selectedOrganismId);

  const presentSpeciesIds = useMemo(() => {
    return [...new Set(organisms.map((o) => o.speciesId))];
  }, [organisms]);

  const selectedOrganism = useMemo(() => {
    return organisms.find((o) => o.id === selectedOrganismId);
  }, [organisms, selectedOrganismId]);

  const speciesFitnessInfo = useMemo(() => {
    return presentSpeciesIds.map((speciesId) => {
      const species = getSpeciesById(speciesId);
      if (!species) return null;

      const prefs = species.environmentalPrefs;
      const tempDeviation = Math.abs(waterTemperature - prefs.optimalTemperature);
      const tempRange = prefs.maxTemperature - prefs.minTemperature;
      const tempTolerance = tempRange * 0.5;
      let temperatureFactor = 1 - Math.min(1, tempDeviation / tempTolerance);
      temperatureFactor = Math.max(0.3, temperatureFactor);

      if (waterTemperature < prefs.minTemperature || waterTemperature > prefs.maxTemperature) {
        temperatureFactor = Math.max(0.1, temperatureFactor * 0.5);
      }

      const lightDeviation = Math.abs(lightIntensity - prefs.optimalLight);
      const lightRange = prefs.maxLight - prefs.minLight;
      const lightTolerance = lightRange * 0.5;
      let lightFactor = 1 - Math.min(1, lightDeviation / lightTolerance);
      lightFactor = Math.max(0.3, lightFactor);

      if (lightIntensity < prefs.minLight || lightIntensity > prefs.maxLight) {
        lightFactor = Math.max(0.1, lightFactor * 0.5);
      }

      const overallFitness = (temperatureFactor + lightFactor) / 2;

      let tempStatus = '适宜';
      if (waterTemperature < prefs.minTemperature - 3) tempStatus = '过冷';
      else if (waterTemperature < prefs.optimalTemperature - 2) tempStatus = '偏冷';
      else if (waterTemperature > prefs.optimalTemperature + 2) tempStatus = '偏热';
      else if (waterTemperature > prefs.maxTemperature + 3) tempStatus = '过热';

      let lightStatus = '适宜';
      if (lightIntensity < prefs.minLight - 0.1) lightStatus = '过暗';
      else if (lightIntensity < prefs.optimalLight - 0.15) lightStatus = '偏暗';
      else if (lightIntensity > prefs.optimalLight + 0.15) lightStatus = '偏亮';
      else if (lightIntensity > prefs.maxLight + 0.1) lightStatus = '过亮';

      return {
        species,
        fitness: overallFitness,
        tempStatus,
        lightStatus,
        isSelected: selectedOrganism?.speciesId === speciesId,
      };
    }).filter(Boolean);
  }, [presentSpeciesIds, waterTemperature, lightIntensity, selectedOrganism]);

  const averageFitness = useMemo(() => {
    if (speciesFitnessInfo.length === 0) return 0;
    const sum = speciesFitnessInfo.reduce((acc, info) => acc + (info?.fitness || 0), 0);
    return sum / speciesFitnessInfo.length;
  }, [speciesFitnessInfo]);

  const headerExtra = (
    <div className="text-xs text-white/60 mr-1">
      <span style={{ color: getFitnessColor(averageFitness) }} className="font-bold">
        {Math.round(averageFitness * 100)}%
      </span>
    </div>
  );

  return (
    <CollapsibleDraggablePanel
      id="environment-sliders"
      title="环境参数"
      emoji="🌡️"
      defaultPosition={{ right: 16, bottom: 16 }}
      defaultExpanded={false}
      zIndex={40}
      width={320}
      contentClassName="px-4 pb-4 space-y-4"
      headerExtra={headerExtra}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getTemperatureEmoji(waterTemperature)}</span>
            <span className="text-white font-medium text-sm">水温</span>
          </div>
          <span
            className="font-bold text-lg"
            style={{ color: getTemperatureColor(waterTemperature) }}
          >
            {waterTemperature.toFixed(0)}°C
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="40"
          step="1"
          value={waterTemperature}
          onChange={(e) => setWaterTemperature(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${getTemperatureColor(0)} 0%, ${getTemperatureColor(20)} 50%, ${getTemperatureColor(40)} 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-white/40">
          <span>0°C 冰冻</span>
          <span>20°C 温和</span>
          <span>40°C 高温</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getLightEmoji(lightIntensity)}</span>
            <span className="text-white font-medium text-sm">光照强度</span>
          </div>
          <span
            className="font-bold text-lg"
            style={{ color: getLightColor(lightIntensity) }}
          >
            {Math.round(lightIntensity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={lightIntensity}
          onChange={(e) => setLightIntensity(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #1F2937 0%, ${getLightColor(0.5)} 50%, ${getLightColor(1)} 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-white/40">
          <span>0% 黑暗</span>
          <span>50% 适中</span>
          <span>100% 强光</span>
        </div>
      </div>

      {speciesFitnessInfo.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center gap-1 mb-2 text-white/60 text-xs">
            <Info size={12} />
            <span>当前物种适应情况</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {speciesFitnessInfo.map((info) => {
              if (!info) return null;
              const { species, fitness, tempStatus, lightStatus, isSelected } = info;
              return (
                <div
                  key={species.id}
                  className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{species.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">
                        {species.name}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: getFitnessColor(fitness) }}
                      >
                        {Math.round(fitness * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="px-1.5 py-0.5 rounded text-white/80"
                        style={{
                          backgroundColor: getStatusColor(tempStatus) + '30',
                          color: getStatusColor(tempStatus),
                        }}
                      >
                        {tempStatus}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-white/80"
                        style={{
                          backgroundColor: getStatusColor(lightStatus) + '30',
                          color: getStatusColor(lightStatus),
                        }}
                      >
                        {lightStatus}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${fitness * 100}%`,
                        backgroundColor: getFitnessColor(fitness),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-white/10">
        <p className="text-white/50 text-xs leading-relaxed">
          💡 调节水温和光照强度，观察不同物种的适应情况。
          环境不适宜会导致生物能量消耗增加、繁殖率下降，甚至死亡。
        </p>
      </div>
    </CollapsibleDraggablePanel>
  );
}
