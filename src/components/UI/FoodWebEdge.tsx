import { memo } from 'react';
import type { SpeciesPosition } from '@/hooks/useFoodWeb';

interface FoodWebEdgeProps {
  index: number;
  fromPosition: SpeciesPosition;
  toPosition: SpeciesPosition;
  predatorColor: string;
  isHighlighted: boolean;
  hasActiveHighlight: boolean;
}

export const FoodWebEdge = memo(function FoodWebEdge({
  index,
  fromPosition,
  toPosition,
  predatorColor,
  isHighlighted,
  hasActiveHighlight,
}: FoodWebEdgeProps) {
  const strokeWidth = isHighlighted ? 3 : 2;
  const opacity = hasActiveHighlight ? (isHighlighted ? 0.9 : 0.1) : 0.5;
  const markerId = `arrow-${index}`;

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path
            d="M0,0 L6,3 L0,6"
            fill={predatorColor}
            opacity={opacity}
          />
        </marker>
      </defs>
      <line
        x1={fromPosition.x}
        y1={fromPosition.y}
        x2={toPosition.x}
        y2={toPosition.y}
        stroke={predatorColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        markerEnd={`url(#${markerId})`}
        style={{ transition: 'all 0.2s ease' }}
      >
        {!hasActiveHighlight && (
          <animate
            attributeName="stroke-dasharray"
            from="4 4"
            to="8 8"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </line>
    </g>
  );
});
