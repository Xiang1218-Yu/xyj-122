import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GlassCard } from './GlassCard';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanelPosition {
  x: number;
  y: number;
}

interface DefaultPosition {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

interface CollapsibleDraggablePanelProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  emoji?: string;
  children: React.ReactNode;
  defaultPosition?: DefaultPosition;
  defaultExpanded?: boolean;
  expanded?: boolean;
  className?: string;
  contentClassName?: string;
  headerExtra?: React.ReactNode;
  zIndex?: number;
  onExpandChange?: (expanded: boolean) => void;
  persistPosition?: boolean;
  persistExpanded?: boolean;
  width?: number;
}

const STORAGE_KEY_PREFIX = 'panel_state_';

function loadPanelState(id: string): { position?: PanelPosition; expanded?: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + id);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return {};
}

function savePanelState(id: string, state: { position: PanelPosition; expanded: boolean }) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function computeInitialPosition(defaultPos: DefaultPosition | undefined, panelWidth: number, panelHeight: number): PanelPosition {
  const { left, right, top, bottom } = defaultPos || {};
  let x = left ?? 16;
  let y = top ?? 80;

  if (right !== undefined) {
    x = window.innerWidth - right - panelWidth;
  }
  if (bottom !== undefined) {
    y = window.innerHeight - bottom - panelHeight;
  }

  return { x, y };
}

export function CollapsibleDraggablePanel({
  id,
  title,
  icon,
  emoji,
  children,
  defaultPosition,
  defaultExpanded = true,
  expanded: expandedProp,
  className,
  contentClassName,
  headerExtra,
  zIndex = 30,
  onExpandChange,
  persistPosition = true,
  persistExpanded = false,
  width = 288,
}: CollapsibleDraggablePanelProps) {
  const savedState = (persistPosition || persistExpanded) ? loadPanelState(id) : {};
  const [internalExpanded, setInternalExpanded] = useState<boolean>(
    persistExpanded && savedState.expanded !== undefined
      ? savedState.expanded
      : defaultExpanded,
  );
  const isControlled = expandedProp !== undefined;
  const isExpanded = isControlled ? expandedProp : internalExpanded;

  const [position, setPosition] = useState<PanelPosition>(() => {
    if (savedState.position) {
      return savedState.position;
    }
    return computeInitialPosition(defaultPosition, width, 48);
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    if (persistPosition || persistExpanded) {
      savePanelState(id, {
        position,
        expanded: isExpanded,
      });
    }
  }, [position, isExpanded, id, persistPosition, persistExpanded]);

  useEffect(() => {
    if (!isControlled) {
      onExpandChange?.(isExpanded);
    }
  }, [isExpanded, onExpandChange, isControlled]);

  const setIsExpanded = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    if (isControlled) {
      const nextValue = typeof value === 'function' ? (value as (prev: boolean) => boolean)(isExpanded) : value;
      onExpandChange?.(nextValue);
    } else {
      setInternalExpanded(value);
    }
  }, [isControlled, isExpanded, onExpandChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: position.x,
      y: position.y,
      startX: e.clientX,
      startY: e.clientY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      hasMovedRef.current = true;
    }

    const newX = dragStartRef.current.x + dx;
    const newY = dragStartRef.current.y + dy;

    const panelW = isExpanded ? width : 120;
    const panelH = isExpanded ? 200 : 44;
    const maxX = window.innerWidth - panelW - 4;
    const maxY = window.innerHeight - panelH - 4;
    const minX = 4;
    const minY = 4;

    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    });
  }, [isDragging, isExpanded, width]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, [isDragging]);

  const handleToggle = useCallback(() => {
    if (hasMovedRef.current) return;
    setIsExpanded((prev) => !prev);
  }, [setIsExpanded]);

  if (!isExpanded) {
    return (
      <div
        ref={panelRef}
        className="fixed select-none"
        style={{
          left: position.x,
          top: position.y,
          zIndex,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <GlassCard
          className={cn(
            'px-3 py-2 flex items-center gap-2 cursor-grab active:cursor-grabbing',
            'hover:bg-white/20 transition-all duration-200',
            isDragging && 'scale-105 shadow-2xl',
            className,
          )}
          onClick={handleToggle}
        >
          <GripVertical size={14} className="text-white/40 shrink-0" />
          {emoji && <span className="text-lg shrink-0">{emoji}</span>}
          {icon && <span className="text-white/80 shrink-0">{icon}</span>}
          <span className="text-white font-medium text-sm whitespace-nowrap">{title}</span>
          <ChevronUp size={16} className="text-white/60 shrink-0 ml-1" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={cn('fixed select-none', className)}
      style={{
        left: position.x,
        top: position.y,
        zIndex,
        width: width,
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <GlassCard className="overflow-hidden">
        <div
          className="px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors"
          onPointerDown={handlePointerDown}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripVertical size={14} className="text-white/40 shrink-0" />
            {emoji && <span className="text-xl shrink-0">{emoji}</span>}
            {icon && <span className="text-white/80 shrink-0">{icon}</span>}
            <h3 className="text-white font-bold text-sm truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {headerExtra}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="p-1 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/10"
              title="收起面板"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>
        <div className={cn(contentClassName, 'select-text')} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </GlassCard>
    </div>
  );
}
