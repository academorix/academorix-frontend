/**
 * @file devtools-panel-frame.component.tsx
 * @module @stackra/devtools/react/components
 * @description Wraps a single panel with a title bar, optional badge,
 *   and the auth-gate handling. Dispatches to
 *   {@link DevtoolsPanelView} for the actual body.
 *
 *   When the panel's `requireAuth` gate denies access, the frame
 *   renders {@link DevtoolsPanelLocked} instead of the view — this
 *   keeps the auth-gate handling in one place.
 */

import { useEffect, useMemo, type ReactElement } from 'react';
import { Chip } from '@stackra/ui/react';

import { useDevtoolsAuthGuard } from '../../hooks/use-devtools-auth-guard.hook';
import { useDevtoolsContext } from '../../hooks/use-devtools-context.hook';
import { formatPanelBadge } from '../../utils/format-panel-badge.util';
import { DevtoolsPanelLocked } from '../devtools-panel-locked';
import { DevtoolsPanelView } from '../devtools-panel-view';
import type { DevtoolsPanelFrameProps } from './devtools-panel-frame.interface';

/**
 * Renders the current panel — header, optional badge, gate, view.
 */
export function DevtoolsPanelFrame({ panel }: DevtoolsPanelFrameProps): ReactElement {
  const guard = useDevtoolsAuthGuard(panel.requireAuth);
  const { analytics } = useDevtoolsContext();

  // Emit `PANEL_ACTIVATED` once per panel activation. The parent
  // shell mounts / unmounts the frame around a single panel; a
  // panel switch is a fresh mount so this fires exactly once.
  useEffect(() => {
    analytics.panelActivated(panel.id);
    // Panel `onActivate` lifecycle — swallow any error so a broken
    // hook doesn't stall the shell.
    if (panel.onActivate) {
      try {
        void panel.onActivate();
      } catch {
        // fail-soft — see docblock.
      }
    }
    return () => {
      // Panel `onDeactivate` lifecycle — same fail-soft policy.
      if (panel.onDeactivate) {
        try {
          panel.onDeactivate();
        } catch {
          // fail-soft
        }
      }
    };
  }, [panel, analytics]);

  const badge = useMemo(() => {
    // Compute the badge once per render — panel authors are free
    // to return a stateful value from `badge()`, in which case the
    // consuming rail should also re-render around the panel.
    if (!panel.badge) return null;
    try {
      return formatPanelBadge(panel.badge());
    } catch {
      // fail-soft — a broken badge shouldn't hide the whole panel.
      return null;
    }
  }, [panel]);

  return (
    <div className="flex h-full w-full flex-col" data-devtools-panel-frame={panel.id}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-foreground">{panel.title}</h2>
          {badge ? (
            <Chip size="sm" variant="secondary">
              <Chip.Label>{badge}</Chip.Label>
            </Chip>
          ) : null}
        </div>
      </header>
      <div className="min-h-0 flex-1">
        {guard.allowed || !panel.requireAuth ? (
          <DevtoolsPanelView panel={panel} />
        ) : (
          <DevtoolsPanelLocked gate={panel.requireAuth} reason={guard.reason ?? 'forbidden'} />
        )}
      </div>
    </div>
  );
}
