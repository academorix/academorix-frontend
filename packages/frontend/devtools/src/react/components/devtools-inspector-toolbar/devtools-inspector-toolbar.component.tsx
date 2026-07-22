/**
 * @file devtools-inspector-toolbar.component.tsx
 * @module @stackra/devtools/react/components
 * @description Header button that toggles the inspector overlay.
 */

import { useCallback, type ReactElement } from "react";
import { Button, Tooltip } from "@stackra/ui/react";
import { CursorArrowRaysIcon } from "@stackra/ui/icons/heroicon/outline";

import { useDevtoolsContext } from "../../hooks/use-devtools-context";
import { useDevtoolsInspector } from "../../hooks/use-devtools-inspector";
import type { DevtoolsInspectorToolbarProps } from "./devtools-inspector-toolbar.interface";

/**
 * Inspector-toolbar toggle.
 */
export function DevtoolsInspectorToolbar({
  className,
}: DevtoolsInspectorToolbarProps): ReactElement | null {
  const { inspector, analytics } = useDevtoolsContext();
  const { enabled, toggle } = useDevtoolsInspector();

  const handleToggle = useCallback(() => {
    // Fire the analytics event BEFORE we flip the flag so a
    // "disable" event still carries the correct pre-toggle state
    // in downstream consumers that record durations.
    if (enabled) {
      analytics.inspectorDisabled();
    } else {
      analytics.inspectorEnabled();
    }
    toggle();
  }, [analytics, enabled, toggle]);

  // Hide the toolbar entirely when no source is registered — the
  // toggle would be meaningless.
  if (inspector.sources().length === 0) return null;

  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button
          aria-label={enabled ? "Disable inspector" : "Enable inspector"}
          aria-pressed={enabled}
          className={className}
          size="sm"
          variant={enabled ? "primary" : "ghost"}
          isIconOnly
          onPress={handleToggle}
          data-devtools-inspector-toolbar=""
        >
          <CursorArrowRaysIcon aria-hidden="true" className="size-4" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>Inspect regions</Tooltip.Content>
    </Tooltip>
  );
}
