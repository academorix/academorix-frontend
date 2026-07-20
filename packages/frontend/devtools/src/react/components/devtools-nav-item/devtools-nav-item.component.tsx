/**
 * @file devtools-nav-item.component.tsx
 * @module @stackra/devtools/react/components
 * @description A single row inside the {@link DevtoolsNavRail} — a
 *   `PressableFeedback` button that selects the panel and shows an
 *   optional badge.
 */

import { useMemo, type ReactElement } from 'react';
import { Chip, PressableFeedback } from '@stackra/ui/react';

import { formatPanelBadge } from '../../utils/format-panel-badge.util';
import type { DevtoolsNavItemProps } from './devtools-nav-item.interface';

/**
 * A single nav-rail item.
 */
export function DevtoolsNavItem({ panel, isActive, onSelect }: DevtoolsNavItemProps): ReactElement {
  const badge = useMemo(() => {
    if (!panel.badge) return null;
    try {
      return formatPanelBadge(panel.badge());
    } catch {
      return null;
    }
  }, [panel]);

  return (
    <PressableFeedback
      aria-label={`Open panel ${panel.title}`}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onSelect(panel.id)}
      className={
        isActive
          ? 'flex w-full items-center justify-between rounded-md bg-surface-secondary px-3 py-2 text-sm text-foreground shadow-surface'
          : 'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-secondary hover:text-foreground'
      }
      data-devtools-nav-item={panel.id}
    >
      <span className="truncate">{panel.title}</span>
      {badge ? (
        <Chip size="sm" variant={isActive ? 'primary' : 'secondary'}>
          <Chip.Label>{badge}</Chip.Label>
        </Chip>
      ) : null}
    </PressableFeedback>
  );
}
