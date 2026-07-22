/**
 * @file devtools-panel-view.component.tsx
 * @module @stackra/devtools/react/components
 * @description Renders a panel's `view` — the single dispatch point
 *   for the `IDevtoolsView.type` discriminator.
 *
 *   - `component` → render the returned `ReactNode` inside a
 *     `ScrollShadow`.
 *   - `action` → render a grid of action buttons (each fires the
 *     `handle()` callback, with an optional confirmation dialog for
 *     destructive actions).
 *   - `iframe` → render a sandboxed `<iframe>`.
 */

import { type ReactElement, type ReactNode, useCallback, useState } from "react";
import { AlertDialog, Button, Card, ScrollShadow } from "@stackra/ui/react";
import type { IDevtoolsAction, IDevtoolsPanel } from "@stackra/contracts";

import { useDevtoolsContext } from "../../hooks/use-devtools-context";
import type { DevtoolsPanelViewProps } from "./devtools-panel-view.interface";

/**
 * A safe cast — the `render()` return type in the contract is
 * `unknown` (to keep contracts React-free) but the shell knows the
 * value must be a `ReactNode`.
 */
function asReactNode(value: unknown): ReactNode {
  return value as ReactNode;
}

/**
 * The panel-view dispatcher.
 */
export function DevtoolsPanelView({ panel }: DevtoolsPanelViewProps): ReactElement {
  switch (panel.view.type) {
    case "component": {
      return (
        <ScrollShadow className="h-full w-full" hideScrollBar={false}>
          <div className="p-4" data-devtools-panel-view="component">
            {asReactNode(panel.view.render())}
          </div>
        </ScrollShadow>
      );
    }
    case "action": {
      return <DevtoolsActionView actions={panel.view.actions} panel={panel} />;
    }
    case "iframe": {
      return (
        <div className="h-full w-full" data-devtools-panel-view="iframe">
          <iframe
            src={panel.view.src}
            title={panel.title}
            sandbox="allow-scripts allow-same-origin"
            className="h-full w-full border-0"
            data-testid="devtools-panel-iframe"
          />
        </div>
      );
    }
    default: {
      // Exhaustiveness check — a new `view.type` needs its case
      // added; TypeScript would flag the missing branch.
      const _exhaustive: never = panel.view;
      void _exhaustive;
      return <></>;
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// Action view — internal
// ════════════════════════════════════════════════════════════════════

interface DevtoolsActionViewProps {
  readonly actions: readonly IDevtoolsAction[];
  readonly panel: IDevtoolsPanel;
}

/**
 * Renders each `IDevtoolsAction` as a Card + Button. When the
 * action's `requireConfirmation` is `true`, the click opens an
 * `AlertDialog` first.
 */
function DevtoolsActionView({ actions, panel }: DevtoolsActionViewProps): ReactElement {
  const { analytics } = useDevtoolsContext();

  // Track the pending confirmation — null when nothing awaiting a
  // confirm.
  const [pending, setPending] = useState<IDevtoolsAction | null>(null);

  const runAction = useCallback(
    async (action: IDevtoolsAction) => {
      // Emit analytics before firing — matches the pattern used
      // elsewhere in the workspace (event fires even if the handler
      // throws).
      analytics.actionTriggered(panel.id, action.id);
      try {
        await action.handle();
      } catch {
        // fail-soft — a broken action must not stall the shell.
        // Panel authors are expected to surface their own errors
        // via the toast service; devtools doesn't wrap the call.
      }
    },
    [analytics, panel.id],
  );

  const handlePress = useCallback(
    (action: IDevtoolsAction) => {
      if (action.requireConfirmation) {
        setPending(action);
      } else {
        void runAction(action);
      }
    },
    [runAction],
  );

  const handleConfirm = useCallback(() => {
    if (!pending) return;
    const action = pending;
    setPending(null);
    void runAction(action);
  }, [pending, runAction]);

  return (
    <ScrollShadow className="h-full w-full" hideScrollBar={false}>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2" data-devtools-panel-view="action">
        {actions.map((action) => (
          <Card key={action.id} className="flex flex-col gap-2">
            <Card.Header>
              <Card.Title>{action.label}</Card.Title>
              {action.description ? (
                <Card.Description>{action.description}</Card.Description>
              ) : null}
            </Card.Header>
            <Card.Footer>
              <Button
                variant={
                  action.variant === "danger" ? "danger-soft" : (action.variant ?? "primary")
                }
                size="sm"
                onPress={() => handlePress(action)}
                data-devtools-action={action.id}
              >
                {action.label}
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </div>
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={pending !== null}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Heading>{pending?.label ?? ""}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-muted text-sm">
                  {pending?.description ?? "This action is irreversible. Continue?"}
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button size="sm" variant="ghost" onPress={() => setPending(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant={pending?.variant === "danger" ? "danger-soft" : "primary"}
                  onPress={handleConfirm}
                  data-devtools-action-confirm=""
                >
                  Confirm
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </ScrollShadow>
  );
}
