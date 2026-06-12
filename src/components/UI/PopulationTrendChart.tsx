import { useState, useMemo, useRef } from 'react';
import { CollapsibleDraggablePanel } from '@/components/common/CollapsibleDraggablePanel';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { TROPHIC_LEVEL_COLORS, TROPHIC_LEVEL_LABELS, getSpeciesById } from '@/data/species';
import type { TrophicLevel, HistorySnapshot } from '@/types/ecosystem';
import { Eye, EyeOff, Layers } from 'lucide-react';

type ViewMode = 'species' | 'trophic';

const TROPHIC_LEVELS: TrophicLevel[] = ['producer', 'herbivore', 'omnivore', 'carnivore', 'decomposer'];

const CHART_WIDTH = 360;
const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 12, right: 12, bottom: 28, left: 36 };
const INNER_WIDTH = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

function aggregateByTrophicLevel(snapshot: HistorySnapshot): Record<TrophicLevel, number> {
  const counts: Record<TrophicLevel, number> = {
    producer: 0,
    herbivore: 0,
    omnivore: 0,
    carnivore: 0,
    decomposer: 0,
  };
  Object.entries(snapshot.populationBySpecies).forEach(([speciesId, count]) => {
    const species = getSpeciesById(speciesId);
    if (species) {
      counts[species.trophicLevel] += count;
    }
  });
  return counts;
}

function getPresentSpecies(history: HistorySnapshot[]): string[] {
  const present = new Set<string>();
  history.forEach((snapshot) => {
    Object.entries(snapshot.populationBySpecies).forEach(([speciesId, count]) => {
      if (count > 0) present.add(speciesId);
    });
  });
  return [...present];
}

function getYAxisSteps(maxValue: number): number[] {
  if (maxValue <= 0) return [0];
  const steps: number[] = [];
  const targetSteps = 4;
  const rawStep = maxValue / targetSteps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let niceStep: number;
  if (normalized <= 1.5) niceStep = magnitude;
  else if (normalized <= 3) niceStep = 2 * magnitude;
  else if (normalized <= 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  for (let v = 0; v <= maxValue + niceStep; v += niceStep) {
    steps.push(Math.round(v));
    if (steps.length > targetSteps + 2) break;
  }
  return steps;
}

export function PopulationTrendChart() {
  const history = useEcosystemStore((s) => s.history);
  const isRewinding = useEcosystemStore((s) => s.isRewinding);
  const rewindTime = useEcosystemStore((s) => s.rewindTime);
  const simulationTime = useEcosystemStore((s) => s.simulationTime);

  const [viewMode, setViewMode] = useState<ViewMode>('species');
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [hoverInfo, setHoverInfo] = useState<{ x: number; snapshot: HistorySnapshot; seriesKey: string } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const effectiveHistory = useMemo(() => {
    if (history.length === 0) return [];
    const displayTime = isRewinding ? rewindTime : simulationTime;
    return history.filter((s) => s.time <= displayTime);
  }, [history, isRewinding, rewindTime, simulationTime]);

  const seriesData = useMemo(() => {
    if (effectiveHistory.length === 0) return { keys: [], dataPoints: [], maxY: 0 };

    if (viewMode === 'species') {
      const presentSpecies = getPresentSpecies(effectiveHistory);
      const maxY = Math.max(
        5,
        ...effectiveHistory.map((s) =>
          Math.max(...presentSpecies.map((id) => s.populationBySpecies[id] || 0)),
        ),
      );
      return {
        keys: presentSpecies,
        dataPoints: effectiveHistory,
        maxY,
      };
    } else {
      const maxY = Math.max(
        5,
        ...effectiveHistory.map((s) => {
          const agg = aggregateByTrophicLevel(s);
          return Math.max(...TROPHIC_LEVELS.map((l) => agg[l]));
        }),
      );
      return {
        keys: [...TROPHIC_LEVELS],
        dataPoints: effectiveHistory,
        maxY,
      };
    }
  }, [effectiveHistory, viewMode]);

  const yAxisSteps = useMemo(() => getYAxisSteps(seriesData.maxY), [seriesData.maxY]);
  const displayMaxY = yAxisSteps[yAxisSteps.length - 1] || 5;

  const getSeriesValue = (snapshot: HistorySnapshot, key: string): number => {
    if (viewMode === 'species') {
      return snapshot.populationBySpecies[key] || 0;
    } else {
      return aggregateByTrophicLevel(snapshot)[key as TrophicLevel] || 0;
    }
  };

  const getSeriesColor = (key: string): string => {
    if (viewMode === 'species') {
      const species = getSpeciesById(key);
      return species?.color || '#888';
    } else {
      return TROPHIC_LEVEL_COLORS[key] || '#888';
    }
  };

  const getSeriesLabel = (key: string): string => {
    if (viewMode === 'species') {
      const species = getSpeciesById(key);
      return species ? `${species.emoji} ${species.name}` : key;
    } else {
      return TROPHIC_LEVEL_LABELS[key] || key;
    }
  };

  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getX = (index: number): number => {
    if (seriesData.dataPoints.length <= 1) return CHART_PADDING.left;
    return CHART_PADDING.left + (index / (seriesData.dataPoints.length - 1)) * INNER_WIDTH;
  };

  const getY = (value: number): number => {
    if (displayMaxY <= 0) return CHART_PADDING.top + INNER_HEIGHT;
    return CHART_PADDING.top + INNER_HEIGHT - (value / displayMaxY) * INNER_HEIGHT;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (seriesData.dataPoints.length === 0 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = CHART_WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    if (
      mouseX < CHART_PADDING.left - 4 ||
      mouseX > CHART_PADDING.left + INNER_WIDTH + 4
    ) {
      setHoverInfo(null);
      return;
    }

    const relativeX = (mouseX - CHART_PADDING.left) / INNER_WIDTH;
    const index = Math.round(relativeX * (seriesData.dataPoints.length - 1));
    const clampedIndex = Math.max(0, Math.min(seriesData.dataPoints.length - 1, index));
    const snapshot = seriesData.dataPoints[clampedIndex];

    let nearestKey = seriesData.keys[0];
    let nearestDist = Infinity;
    const mouseY = (e.clientY - rect.top) * (CHART_HEIGHT / rect.height);
    seriesData.keys.forEach((key) => {
      if (hiddenSeries.has(key)) return;
      const val = getSeriesValue(snapshot, key);
      const y = getY(val);
      const dist = Math.abs(y - mouseY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestKey = key;
      }
    });

    setHoverInfo({
      x: getX(clampedIndex),
      snapshot,
      seriesKey: nearestKey,
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  const buildPath = (key: string): string => {
    const points: string[] = [];
    seriesData.dataPoints.forEach((snapshot, i) => {
      const val = getSeriesValue(snapshot, key);
      const x = getX(i);
      const y = getY(val);
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
    });
    return points.join(' ');
  };

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 100);
    const secs = t % 100;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const visibleKeys = seriesData.keys.filter((k) => !hiddenSeries.has(k));

  return (
    <CollapsibleDraggablePanel
      id="population-trend-chart"
      title="种群数量趋势"
      emoji="📈"
      defaultPosition={{ right: 16, top: 80 }}
      defaultExpanded={true}
      zIndex={30}
      width={400}
      contentClassName="p-4 pt-0"
      headerExtra={
        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewMode((prev) => (prev === 'species' ? 'trophic' : 'species'));
            setHiddenSeries(new Set());
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs"
          title={viewMode === 'species' ? '切换到营养级视图' : '切换到物种视图'}
        >
          <Layers size={13} />
          <span>{viewMode === 'species' ? '按物种' : '按营养级'}</span>
        </button>
      }
    >
      <div className="mb-3">
        <div
          className="text-xs text-white/50 mb-2"
          style={{ height: CHART_HEIGHT, position: 'relative', width: '100%' }}
        >
          {seriesData.dataPoints.length < 3 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
              正在收集数据...请稍候
            </div>
          ) : (
            <>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="w-full h-full"
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  {visibleKeys.map((key) => {
                    const color = getSeriesColor(key);
                    return (
                      <linearGradient
                        key={`grad-${key}`}
                        id={`area-grad-${key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                      </linearGradient>
                    );
                  })}
                </defs>

                {yAxisSteps.map((step, i) => {
                  const y = getY(step);
                  return (
                    <g key={`grid-${i}`}>
                      <line
                        x1={CHART_PADDING.left}
                        y1={y}
                        x2={CHART_PADDING.left + INNER_WIDTH}
                        y2={y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray={i === 0 ? '' : '3 3'}
                      />
                      <text
                        x={CHART_PADDING.left - 6}
                        y={y + 3}
                        fill="rgba(255,255,255,0.45)"
                        fontSize="9"
                        textAnchor="end"
                      >
                        {step}
                      </text>
                    </g>
                  );
                })}

                {(() => {
                  const len = seriesData.dataPoints.length;
                  if (len < 2) return null;
                  const labelIndices: number[] = [0, Math.floor(len / 2), len - 1];
                  return labelIndices.map((idx) => {
                    const snapshot = seriesData.dataPoints[idx];
                    const x = getX(idx);
                    return (
                      <text
                        key={`xlabel-${idx}`}
                        x={x}
                        y={CHART_PADDING.top + INNER_HEIGHT + 16}
                        fill="rgba(255,255,255,0.45)"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {formatTime(snapshot.time)}
                      </text>
                    );
                  });
                })()}

                {visibleKeys.map((key) => {
                  const path = buildPath(key);
                  if (!path) return null;
                  const color = getSeriesColor(key);
                  const lastPoint = seriesData.dataPoints[seriesData.dataPoints.length - 1];
                  const lastVal = getSeriesValue(lastPoint, key);
                  const startX = getX(0);
                  const endX = getX(seriesData.dataPoints.length - 1);
                  const bottomY = CHART_PADDING.top + INNER_HEIGHT;
                  const areaPath = `${path} L${endX.toFixed(2)},${bottomY.toFixed(2)} L${startX.toFixed(2)},${bottomY.toFixed(2)} Z`;

                  return (
                    <g key={`series-${key}`}>
                      <path
                        d={areaPath}
                        fill={`url(#area-grad-${key})`}
                        opacity={0.5}
                      />
                      <path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
                      />
                      <circle
                        cx={endX}
                        cy={getY(lastVal)}
                        r="3.5"
                        fill={color}
                        stroke="#fff"
                        strokeOpacity="0.3"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}

                {hoverInfo && (
                  <g pointerEvents="none">
                    <line
                      x1={hoverInfo.x}
                      y1={CHART_PADDING.top}
                      x2={hoverInfo.x}
                      y2={CHART_PADDING.top + INNER_HEIGHT}
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />
                    {seriesData.keys.map((key) => {
                      if (hiddenSeries.has(key)) return null;
                      const val = getSeriesValue(hoverInfo.snapshot, key);
                      const y = getY(val);
                      const color = getSeriesColor(key);
                      const isHighlighted = key === hoverInfo.seriesKey;
                      return (
                        <circle
                          key={`hover-${key}`}
                          cx={hoverInfo.x}
                          cy={y}
                          r={isHighlighted ? 5 : 3}
                          fill={color}
                          stroke="#fff"
                          strokeWidth={isHighlighted ? 2 : 1}
                          opacity={isHighlighted ? 1 : 0.7}
                        />
                      );
                    })}
                  </g>
                )}
              </svg>

              {hoverInfo && (
                <div
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${((hoverInfo.x + 10) / CHART_WIDTH) * 100}%`,
                    top: '4px',
                    maxWidth: '180px',
                    transform:
                      hoverInfo.x > CHART_WIDTH * 0.6 ? 'translateX(-110%)' : 'none',
                  }}
                >
                  <div
                    className="bg-slate-900/95 backdrop-blur-sm rounded-lg px-2.5 py-2 text-xs border border-white/10 shadow-xl"
                    style={{
                      borderColor: `${getSeriesColor(hoverInfo.seriesKey)}55`,
                    }}
                  >
                    <div className="text-white/50 mb-1.5 font-mono">
                      ⏱️ {formatTime(hoverInfo.snapshot.time)}
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto overflow-x-hidden">
                      {seriesData.keys
                        .filter((k) => !hiddenSeries.has(k))
                        .map((key) => {
                          const val = getSeriesValue(hoverInfo.snapshot, key);
                          const color = getSeriesColor(key);
                          const isHighlighted = key === hoverInfo.seriesKey;
                          return (
                            <div
                              key={`tip-${key}`}
                              className={`flex items-center justify-between gap-2 ${isHighlighted ? 'bg-white/10 -mx-1 px-1 py-0.5 rounded' : ''}`}
                            >
                              <span
                                className="truncate"
                                style={{ color: isHighlighted ? color : 'rgba(255,255,255,0.8)' }}
                              >
                                <span
                                  className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                                  style={{ backgroundColor: color }}
                                />
                                {getSeriesLabel(key)}
                              </span>
                              <span
                                className="font-mono font-bold shrink-0"
                                style={{ color }}
                              >
                                {val}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-white/10 text-white/40 flex justify-between">
                      <span>总生物</span>
                      <span className="font-mono font-bold text-white/70">
                        {hoverInfo.snapshot.totalOrganisms}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {seriesData.keys.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          <div className="text-white/40 text-xs mb-1.5 flex items-center justify-between">
            <span>{viewMode === 'species' ? '物种图例' : '营养级图例'}</span>
            <span className="text-white/30">点击显示/隐藏</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {seriesData.keys.map((key) => {
              const color = getSeriesColor(key);
              const isHidden = hiddenSeries.has(key);
              const currentValue =
                seriesData.dataPoints.length > 0
                  ? getSeriesValue(
                      seriesData.dataPoints[seriesData.dataPoints.length - 1],
                      key,
                    )
                  : 0;
              return (
                <button
                  key={`legend-${key}`}
                  onClick={() => toggleSeries(key)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-all ${
                    isHidden
                      ? 'opacity-40 hover:opacity-60 bg-white/5'
                      : 'hover:bg-white/10 bg-white/[0.02]'
                  }`}
                  style={{
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    {isHidden ? (
                      <EyeOff size={12} className="text-white/40 shrink-0" />
                    ) : (
                      <Eye size={12} style={{ color }} className="shrink-0" />
                    )}
                    <span
                      className={`truncate ${isHidden ? 'text-white/40' : 'text-white/85'}`}
                    >
                      {getSeriesLabel(key)}
                    </span>
                  </span>
                  <span
                    className="font-mono font-bold shrink-0 ml-2"
                    style={{ color: isHidden ? 'rgba(255,255,255,0.3)' : color }}
                  >
                    {currentValue}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </CollapsibleDraggablePanel>
  );
}
