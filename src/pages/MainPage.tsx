import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Aquarium3D } from '@/components/Aquarium3D/Aquarium';
import { SpeciesToolbar } from '@/components/UI/SpeciesToolbar';
import { EcosystemStats } from '@/components/UI/EcosystemStats';
import { FoodWebPanel } from '@/components/UI/FoodWebPanel';
import { SpeciesInfoCard } from '@/components/UI/SpeciesInfoCard';
import { ControlButtons } from '@/components/UI/ControlButtons';
import { PresetSelector } from '@/components/UI/PresetSelector';
import { useEcosystemSimulation } from '@/hooks/useEcosystemSimulation';
import { useEcosystemStore, AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';
import { GlassCard } from '@/components/common/GlassCard';
import type { EcologicalEvent } from '@/types/ecosystem';

const EVENT_EMOJIS: Record<string, string> = {
  red_tide: '🌊',
  invasive_species: '🦑',
  water_purification: '✨',
};

function EventPulseOverlay({ event }: { event: EcologicalEvent | null }) {
  if (!event) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <div
        className="absolute inset-0 animate-edge-pulse"
        style={{
          boxShadow: `inset 0 0 80px 30px ${event.color}`,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-32 animate-edge-pulse"
        style={{
          background: `linear-gradient(to bottom, ${event.color}66, transparent)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-32 animate-edge-pulse"
        style={{
          background: `linear-gradient(to top, ${event.color}66, transparent)`,
        }}
      />
      <div
        className="absolute top-0 bottom-0 left-0 w-32 animate-edge-pulse"
        style={{
          background: `linear-gradient(to right, ${event.color}66, transparent)`,
        }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-32 animate-edge-pulse"
        style={{
          background: `linear-gradient(to left, ${event.color}66, transparent)`,
        }}
      />
    </div>
  );
}

function EventNotification({ event }: { event: EcologicalEvent | null }) {
  const [displayEvent, setDisplayEvent] = useState<EcologicalEvent | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (event && (!displayEvent || event.id !== displayEvent.id)) {
      setIsExiting(false);
      setDisplayEvent(event);
    } else if (!event && displayEvent) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setDisplayEvent(null);
        setIsExiting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [event, displayEvent]);

  if (!displayEvent) return null;

  const simulationTime = useEcosystemStore((s) => s.simulationTime);
  const progress = displayEvent
    ? Math.min(100, ((simulationTime - displayEvent.startTime) / displayEvent.duration) * 100)
    : 0;

  return (
    <div
      className={`absolute top-20 right-4 z-40 max-w-sm ${
        isExiting ? 'animate-event-slide-out' : 'animate-event-slide-in'
      }`}
    >
      <GlassCard className="p-4" style={{ borderColor: displayEvent.color }}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{EVENT_EMOJIS[displayEvent.type] || '⚠️'}</span>
          <div className="flex-1 min-w-0">
            <h4
              className="font-bold text-lg mb-1"
              style={{ color: displayEvent.color }}
            >
              {displayEvent.name}
            </h4>
            <p className="text-white/70 text-sm mb-3">
              {displayEvent.description}
            </p>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: displayEvent.color,
                  boxShadow: `0 0 8px ${displayEvent.color}`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-white/50">
              <span>进行中</span>
              <span>{Math.round(100 - progress)}% 剩余</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export function MainPage() {
  useEcosystemSimulation();

  const selectedSpeciesId = useEcosystemStore((s) => s.selectedSpeciesId);
  const addOrganism = useEcosystemStore((s) => s.addOrganism);
  const setSelectedSpecies = useEcosystemStore((s) => s.setSelectedSpecies);
  const backgroundColors = useEcosystemStore((s) => s.backgroundColors);
  const activeEvent = useEcosystemStore((s) => s.activeEvent);

  const backgroundStyle = useMemo(() => ({
    background: `linear-gradient(to bottom, ${backgroundColors[0]}, ${backgroundColors[1]}, ${backgroundColors[2]})`,
    transition: 'background 1.5s ease-in-out',
  }), [backgroundColors]);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.cursor = selectedSpeciesId ? 'crosshair' : 'grab';
      canvas.style.cursor = selectedSpeciesId ? 'crosshair' : '-webkit-grab';
    }
    return () => {
      if (canvas) {
        canvas.style.cursor = 'default';
      }
    };
  }, [selectedSpeciesId]);

  const handleAquariumClick = (point: THREE.Vector3) => {
    if (!selectedSpeciesId) return;

    const clampedPoint = new THREE.Vector3(
      THREE.MathUtils.clamp(point.x, AQUARIUM_BOUNDS.minX + 0.3, AQUARIUM_BOUNDS.maxX - 0.3),
      THREE.MathUtils.clamp(point.y, AQUARIUM_BOUNDS.minY + 0.2, AQUARIUM_BOUNDS.maxY - 0.2),
      THREE.MathUtils.clamp(point.z, AQUARIUM_BOUNDS.minZ + 0.3, AQUARIUM_BOUNDS.maxZ - 0.3),
    );

    addOrganism(selectedSpeciesId, clampedPoint);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={backgroundStyle}>
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(34, 211, 238, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(74, 222, 128, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.08) 0%, transparent 60%)
            `,
          }}
        />
      </div>

      <div className="relative w-full h-full">
        <Aquarium3D onAquariumClick={handleAquariumClick} />
      </div>

      <EventPulseOverlay event={activeEvent} />
      <EventNotification event={activeEvent} />

      <ControlButtons />
      <PresetSelector />
      <SpeciesToolbar />
      <EcosystemStats />
      <FoodWebPanel />
      <SpeciesInfoCard />

      {selectedSpeciesId && (
        <div className="absolute inset-0 pointer-events-none z-5">
          <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
        </div>
      )}
    </div>
  );
}
