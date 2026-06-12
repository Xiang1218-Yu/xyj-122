import type { OrganismState } from '@/types/ecosystem';
import { cn } from '@/lib/utils';

interface StatusItem {
  state: OrganismState;
  count: number;
  label: string;
  color: string;
}

interface StatusDistributionProps {
  data: Record<OrganismState, number>;
  title?: string;
  className?: string;
}

const STATE_LABELS: Record<OrganismState, string> = {
  idle: '休息中',
  wandering: '漫游中',
  hunting: '捕猎中',
  fleeing: '逃跑中',
  eating: '进食中',
  reproducing: '繁殖中',
  sleeping: '睡眠中',
};

const STATE_COLORS: Record<OrganismState, string> = {
  idle: '#94A3B8',
  wandering: '#60A5FA',
  hunting: '#F87171',
  fleeing: '#FBBF24',
  eating: '#34D399',
  reproducing: '#F472B6',
  sleeping: '#A78BFA',
};

export function StatusDistribution({ data, title, className }: StatusDistributionProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  const items: StatusItem[] = (Object.keys(data) as OrganismState[])
    .filter((state) => data[state] > 0)
    .map((state) => ({
      state,
      count: data[state],
      label: STATE_LABELS[state] || state,
      color: STATE_COLORS[state] || '#888',
    }))
    .sort((a, b) => b.count - a.count);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <div className="text-white/70 text-xs font-medium mb-2">{title}</div>
      )}
      <div className="space-y-1.5">
        {items.map((item) => {
          const percent = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.state} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color, boxShadow: `0 0 4px ${item.color}80` }}
              />
              <span className="text-white/60 text-xs w-14 shrink-0">{item.label}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span
                className="text-xs font-mono font-bold w-6 text-right shrink-0"
                style={{ color: item.color }}
              >
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
