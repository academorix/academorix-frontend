/**
 * @file devtools-position-menu.component.tsx
 * @module @stackra/devtools/react/components
 * @description Dropdown menu that changes the shell's edge
 *   (`left | right | top | bottom`).
 *
 *   Wraps a HeroUI `Dropdown` compound around a `ghost` variant
 *   button — the design-taste rule "wrap dropdown triggers in a
 *   ghost-variant Button" applies here.
 */

import { type ReactElement } from 'react';
import { Button, Dropdown, Tooltip } from '@stackra/ui/react';
import { ViewColumnsIcon } from '@stackra/ui/icons/heroicon/outline';

import type { DevtoolsShellPosition } from '@/core/types';
import { useDevtoolsFrameState } from '../../hooks/use-devtools-frame-state.hook';
import type { DevtoolsPositionMenuProps } from './devtools-position-menu.interface';

/** Human-readable label for each position. */
const POSITION_LABELS: Record<DevtoolsShellPosition, string> = {
  left: 'Left',
  right: 'Right',
  top: 'Top',
  bottom: 'Bottom',
};

/** Every position, in a stable render order. */
const POSITIONS: readonly DevtoolsShellPosition[] = ['left', 'right', 'top', 'bottom'];

/**
 * Position selector.
 */
export function DevtoolsPositionMenu({ className }: DevtoolsPositionMenuProps): ReactElement {
  const { state, update } = useDevtoolsFrameState();

  return (
    <Dropdown>
      <Tooltip>
        <Tooltip.Trigger>
          <Dropdown.Trigger>
            <Button
              aria-label="Change devtools placement"
              className={className}
              size="sm"
              variant="ghost"
              isIconOnly
            >
              <ViewColumnsIcon aria-hidden="true" className="size-4" />
            </Button>
          </Dropdown.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Content>Change placement</Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label="Placement"
          selectionMode="single"
          selectedKeys={new Set([state.position])}
          onSelectionChange={(keys) => {
            // `keys` is a `Selection` from react-aria — for a
            // single-select menu it's a `Set` with one entry.
            const first = Array.from(keys as Set<string>)[0];
            if (!first) return;
            update({ position: first as DevtoolsShellPosition });
          }}
        >
          {POSITIONS.map((position) => (
            <Dropdown.Item key={position} id={position} textValue={POSITION_LABELS[position]}>
              {POSITION_LABELS[position]}
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
