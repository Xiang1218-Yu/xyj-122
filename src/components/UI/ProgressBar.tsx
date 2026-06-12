import { cn } from '@/lib/utils';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  showValue?: boolean;
  valueSuffix?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({
  label,
  value,
  max,
  color,
  showValue = true,
  valueSuffix = '',
  className,
  size = 'md',
}: ProgressBarProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/60">{label}</span>
        {showValue && (
          <span className="font-medium" style={{ color }}>
            {Math.round(value)} / {max}{valueSuffix}
          </span>
        )}
      </div>
      <div className={cn('bg-white/10 rounded-full overflow-hidden', height)}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}
