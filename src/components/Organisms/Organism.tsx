import { useRef, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Organism, Species } from '@/types/ecosystem';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { ProducerModel } from './Producer';
import { HerbivoreModel } from './Herbivore';
import { CarnivoreModel } from './Carnivore';
import { DecomposerModel } from './Decomposer';

interface Organism3DProps {
  organism: Organism;
  species: Species;
}

export function Organism3D({ organism, species }: Organism3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringOuterRef = useRef<THREE.Mesh>(null);
  const ringInnerRef = useRef<THREE.Mesh>(null);
  const ringPulseRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);
  const setSelectedOrganism = useEcosystemStore((s) => s.setSelectedOrganism);
  const selectedOrganismId = useEcosystemStore((s) => s.selectedOrganismId);
  const trackingOrganismId = useEcosystemStore((s) => s.trackingOrganismId);
  const showLabels = useEcosystemStore((s) => s.showLabels);
  const isSelected = selectedOrganismId === organism.id;
  const isTracking = trackingOrganismId === organism.id;

  const trackingParticles = useMemo(() => {
    const count = 24;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = species.size * 1.0;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, phases, count };
  }, [species.size]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.copy(organism.position);

      const targetRotation = organism.rotation;
      const currentRotation = groupRef.current.rotation.y;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        currentRotation,
        targetRotation,
        0.1,
      );

      if (species.trophicLevel === 'producer') {
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + organism.position.x) * 0.08;
      } else if (species.speed > 0) {
        const swimPhase = state.clock.elapsedTime * 4 + organism.position.x * 2;
        groupRef.current.position.y += Math.sin(swimPhase) * 0.002;
      }

      const highlightMultiplier = isTracking ? 1.25 : hovered || isSelected ? 1.15 : 1;
      const targetScale = organism.scale * highlightMultiplier;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }

    const t = state.clock.elapsedTime;

    if (isTracking) {
      if (ringOuterRef.current) {
        ringOuterRef.current.rotation.z = t * 0.8;
        const pulseScale = 1 + Math.sin(t * 3) * 0.06;
        ringOuterRef.current.scale.setScalar(pulseScale);
        const mat = ringOuterRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.35 + Math.sin(t * 2) * 0.1;
      }
      if (ringInnerRef.current) {
        ringInnerRef.current.rotation.z = -t * 1.2;
        const pulseScale = 0.85 + Math.sin(t * 4 + 1) * 0.05;
        ringInnerRef.current.scale.setScalar(pulseScale);
        const mat = ringInnerRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.55 + Math.sin(t * 3 + 0.5) * 0.12;
      }
      if (ringPulseRef.current) {
        const expandPhase = (t * 0.6) % 1;
        ringPulseRef.current.scale.setScalar(0.6 + expandPhase * 0.9);
        const mat = ringPulseRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - expandPhase) * 0.6;
      }
      if (particlesRef.current) {
        const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < trackingParticles.count; i++) {
          const angle = (i / trackingParticles.count) * Math.PI * 2 + t * 1.5;
          const radius = species.size * (0.9 + Math.sin(t * 2 + trackingParticles.phases[i]) * 0.15);
          const yOffset = Math.sin(t * 2.5 + trackingParticles.phases[i]) * species.size * 0.3;
          posAttr.array[i * 3] = Math.cos(angle) * radius;
          posAttr.array[i * 3 + 1] = yOffset;
          posAttr.array[i * 3 + 2] = Math.sin(angle) * radius;
        }
        posAttr.needsUpdate = true;
      }
    } else if (isSelected) {
      if (ringOuterRef.current) {
        ringOuterRef.current.rotation.z = t * 0.3;
        const mat = ringOuterRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.4;
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedOrganism(organism.id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const renderModel = () => {
    switch (species.trophicLevel) {
      case 'producer':
        return <ProducerModel species={species} organism={organism} />;
      case 'herbivore':
        return <HerbivoreModel species={species} organism={organism} />;
      case 'carnivore':
        return <CarnivoreModel species={species} organism={organism} />;
      case 'decomposer':
        return <DecomposerModel species={species} organism={organism} />;
      default:
        return null;
    }
  };

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {renderModel()}

      {(isSelected || hovered) && showLabels && (
        <Html
          position={[0, species.size + 0.3, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="px-3 py-1.5 rounded-full text-white text-xs font-bold whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: species.color,
              boxShadow: `0 0 12px ${species.color}80`,
            }}
          >
            {species.emoji} {species.name}
          </div>
        </Html>
      )}

      {(isSelected || isTracking) && (
        <>
          <mesh ref={ringOuterRef} position={[0, 0, 0]}>
            <ringGeometry args={[species.size * 1.0, species.size * 1.25, 48]} />
            <meshBasicMaterial
              color={species.color}
              transparent
              opacity={isTracking ? 0.4 : 0.5}
              side={THREE.DoubleSide}
            />
          </mesh>

          {isTracking && (
            <>
              <mesh ref={ringInnerRef} position={[0, 0, 0]}>
                <torusGeometry args={[species.size * 0.75, species.size * 0.05, 16, 48]} />
                <meshBasicMaterial
                  color={species.color}
                  transparent
                  opacity={0.6}
                />
              </mesh>

              <mesh ref={ringPulseRef} position={[0, 0, 0]}>
                <ringGeometry args={[species.size * 0.95, species.size * 1.0, 48]} />
                <meshBasicMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.5}
                  side={THREE.DoubleSide}
                />
              </mesh>

              <points ref={particlesRef}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={trackingParticles.count}
                    array={trackingParticles.positions}
                    itemSize={3}
                  />
                </bufferGeometry>
                <pointsMaterial
                  color={species.color}
                  size={species.size * 0.12}
                  transparent
                  opacity={0.8}
                  sizeAttenuation
                />
              </points>

              <mesh position={[0, species.size * 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[species.size * 0.2, species.size * 0.3, 24]} />
                <meshBasicMaterial
                  color={species.color}
                  transparent
                  opacity={0.3}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </>
          )}
        </>
      )}
    </group>
  );
}
