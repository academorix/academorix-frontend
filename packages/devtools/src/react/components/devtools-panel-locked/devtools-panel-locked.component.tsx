/**
 * @file devtools-panel-locked.component.tsx
 * @module @stackra/devtools/react/components
 * @description The locked-panel screen — rendered inside the panel
 *   viewport when the panel's `requireAuth` gate denies access.
 *
 *   The affordance branches on the deny reason:
 *   - `unauthenticated` → "Sign in" button.
 *   - `forbidden` → "Contact your admin" message.
 */

import { type ReactElement } from 'react';
import { Button, Card } from '@stackra/ui/react';
import { LockClosedIcon } from '@stackra/ui/icons/heroicon/outline';

import type { DevtoolsPanelLockedProps } from './devtools-panel-locked.interface';

/** Fallback copy for each deny reason. */
const DEFAULT_MESSAGES: Record<
  DevtoolsPanelLockedProps['reason'],
  { title: string; description: string }
> = {
  unauthenticated: {
    title: 'Sign in required',
    description:
      'This panel is gated. Sign in with an account that has access to view its contents.',
  },
  forbidden: {
    title: "You don't have permission",
    description:
      "This panel is gated behind an ability your current account doesn't have. Contact an admin if you believe this is a mistake.",
  },
};

/**
 * The locked-panel screen.
 */
export function DevtoolsPanelLocked({ gate, reason }: DevtoolsPanelLockedProps): ReactElement {
  const defaults = DEFAULT_MESSAGES[reason];
  const description = gate.message ?? defaults.description;

  return (
    <div
      className="flex h-full w-full items-center justify-center p-6"
      data-devtools-panel-locked=""
    >
      <Card className="w-full max-w-md">
        <Card.Header className="flex items-center gap-3">
          <LockClosedIcon aria-hidden="true" className="size-6 text-warning" />
          <Card.Title>{defaults.title}</Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-muted">{description}</p>
          <div className="mt-3 rounded-md bg-surface-secondary p-3">
            <p className="text-xs text-muted">
              Required ability: <span className="font-mono text-foreground">{gate.ability}</span>
              {gate.resource ? (
                <>
                  {' · resource '}
                  <span className="font-mono text-foreground">{String(gate.resource)}</span>
                </>
              ) : null}
            </p>
          </div>
        </Card.Content>
        {reason === 'unauthenticated' ? (
          <Card.Footer>
            <Button size="sm" variant="primary" isDisabled>
              Sign in
            </Button>
          </Card.Footer>
        ) : null}
      </Card>
    </div>
  );
}
