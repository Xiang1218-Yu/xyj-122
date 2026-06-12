import { memo } from 'react';
import type { Species } from '@/types/ecosystem';
import type { SpeciesPosition } from '@/hooks/useFoodWeb';

interface FoodWebNodeProps {
  species: Species;
  position: SpeciesPosition;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  hasActiveHighlight: boolean;
  trophicColor: string;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const FoodWebNode = memo(function FoodWebNode({
  species,
  position,
  isSelected,
  isHovered,
  isHighlighted,
  hasActiveHighlight,
  trophicColor,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: FoodWebNodeProps) {
  const baseRadius = 16;
  const radius = isSelected || isHovered ? 20 : baseRadius;
  const opacity = hasActiveHighlight ? (isHighlighted ? 1 : 0.25) : 0.9;
  const glowIntensity = isSelected ? 12 : isHovered ? 8 : 0;

  return (
    <g
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
    >
      {(isSelected || isHovered) && (
        <circle
          cx={position.x}
          cy={position.y}
          r={radius + 6}
          fill="none"
          stroke={species.color}
          strokeWidth="2"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            values={`${radius + 4};${radius + 10};${radius + 4}`}
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0.2;0.6"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {glowIntensity > 0 && (
        <circle
          cx={position.x}
          cy={position.y}
          r={radius + 2}
          fill={species.color}
          opacity="0.3"
          style={{ filter: `blur(${glowIntensity}px)` }}
        />
      )}

      <circle
        cx={position.x}
        cy={position.y}
        r={radius}
        fill={trophicColor}
        opacity={opacity}
        stroke={isSelected ? species.color : 'transparent'}
        strokeWidth={isSelected ? 3 : 0}
        style={{ transition: 'all 0.2s ease' }}
      >
        {!isSelected && !isHovered && (
          <animate
            attributeName="r"
            values="16;18;16"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      <text
        x={position.x}
        y={position.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={isSelected || isHovered ? 16 : 14}
        style={{ pointerEvents: 'none', transition: 'font-size 0.2s ease' }}
      >
        {species.emoji}
      </text>

      <text
        x={position.x}
        y={position.y + 28}
        textAnchor="middle"
        fontSize="9"
        fill="white"
        opacity={opacity}
        fontWeight={isSelected || isHovered ? 600 : 400}
        style={{ pointerEvents: 'none', transition: 'all 0.2s ease' }}
      >
        {species.name}
      </text>
    </g>
  );
});
