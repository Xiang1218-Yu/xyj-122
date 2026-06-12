import { useMemo } from 'react';

interface HistogramBin {
  value: number;
  label?: string;
}

interface HistogramChartProps {
  bins: HistogramBin[];
  color: string;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showValues?: boolean;
  height?: number;
}

export function HistogramChart({
  bins,
  color,
  title,
  xAxisLabel,
  showValues = true,
  height = 120,
}: HistogramChartProps) {
  const CHART_PADDING = { top: 16, right: 8, bottom: 28, left: 28 };

  const { maxValue, innerHeight, yAxisSteps } = useMemo(() => {
    const maxVal = Math.max(...bins.map((b) => b.value), 1);
    const innerH = height - CHART_PADDING.top - CHART_PADDING.bottom;

    const targetSteps = 3;
    const rawStep = maxVal / targetSteps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
    const normalized = rawStep / magnitude;
    let niceStep: number;
    if (normalized <= 1.5) niceStep = magnitude;
    else if (normalized <= 3) niceStep = 2 * magnitude;
    else if (normalized <= 7) niceStep = 5 * magnitude;
    else niceStep = 10 * magnitude;

    const steps: number[] = [];
    for (let v = 0; v <= maxVal + niceStep; v += niceStep) {
      steps.push(Math.round(v));
      if (steps.length > targetSteps + 1) break;
    }

    return { maxValue: steps[steps.length - 1] || maxVal, innerHeight: innerH, yAxisSteps: steps };
  }, [bins, height]);

  const barCount = bins.length;
  const barGap = 2;
  const totalGapWidth = barGap * (barCount + 1);

  const getBarX = (index: number, totalWidth: number): number => {
    const innerWidth = totalWidth - CHART_PADDING.left - CHART_PADDING.right;
    const barWidth = Math.max(1, (innerWidth - totalGapWidth) / barCount);
    return CHART_PADDING.left + barGap + index * (barWidth + barGap);
  };

  const getBarWidth = (totalWidth: number): number => {
    const innerWidth = totalWidth - CHART_PADDING.left - CHART_PADDING.right;
    return Math.max(1, (innerWidth - totalGapWidth) / barCount);
  };

  const getBarHeight = (value: number): number => {
    if (maxValue <= 0) return 0;
    return (value / maxValue) * innerHeight;
  };

  const getY = (value: number): number => {
    return CHART_PADDING.top + innerHeight - getBarHeight(value);
  };

  const viewWidth = 240;
  const barWidth = getBarWidth(viewWidth);

  return (
    <div className="w-full">
      {title && (
        <div className="text-white/70 text-xs font-medium mb-2">{title}</div>
      )}
      <div className="w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${viewWidth} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`hist-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {yAxisSteps.map((step, i) => {
            const y = getY(step);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={viewWidth - CHART_PADDING.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray={i === 0 ? '' : '2 2'}
                />
                <text
                  x={CHART_PADDING.left - 4}
                  y={y + 3}
                  fill="rgba(255,255,255,0.35)"
                  fontSize="8"
                  textAnchor="end"
                >
                  {step}
                </text>
              </g>
            );
          })}

          {bins.map((bin, i) => {
            const x = getBarX(i, viewWidth);
            const barH = getBarHeight(bin.value);
            const y = CHART_PADDING.top + innerHeight - barH;
            return (
              <g key={`bar-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill={`url(#hist-grad-${color.replace('#', '')})`}
                  rx={1}
                  style={{ filter: `drop-shadow(0 0 2px ${color}40)` }}
                />
                {showValues && barH > 12 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 2}
                    fill="rgba(255,255,255,0.7)"
                    fontSize="8"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {bin.value}
                  </text>
                )}
                {bin.label && (
                  <text
                    x={x + barWidth / 2}
                    y={height - CHART_PADDING.bottom + 12}
                    fill="rgba(255,255,255,0.35)"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {bin.label}
                  </text>
                )}
              </g>
            );
          })}

          {xAxisLabel && (
            <text
              x={viewWidth / 2}
              y={height - 4}
              fill="rgba(255,255,255,0.4)"
              fontSize="8"
              textAnchor="middle"
            >
              {xAxisLabel}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
