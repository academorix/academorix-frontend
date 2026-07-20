/**
 * @file actions-panel.component.tsx
 * @module @stackra/devtools/react/components
 * @description Content of the built-in "Actions" devtools panel.
 *
 *   Renders a grid of one-shot maintenance actions — clear caches,
 *   drain queues, reset scopes, dump state, copy DI graph, reload.
 *   Every optional dependency is resolved via `useOptionalInject`
 *   so an action is disabled (rather than crashing) when the
 *   underlying manager isn't wired.
 */

import { useCallback, useState, type ReactElement } from "react";
import { AlertDialog, Button, Card } from "@stackra/ui/react";
import {
  ArrowPathIcon,
  CircleStackIcon,
  ClipboardDocumentIcon,
  QueueListIcon,
  RectangleGroupIcon,
  TrashIcon,
} from "@stackra/ui/icons/heroicon/outline";
import { useOptionalInject } from "@stackra/container/react";
import {
  CACHE_MANAGER,
  DISCOVERY_SERVICE,
  QUEUE_MANAGER,
  SCOPE_SERVICE,
  STATE_REGISTRY,
} from "@stackra/contracts";

import { useDevtoolsContext } from "../../hooks/use-devtools-context.hook";
import type { ActionsPanelProps } from "./actions-panel.interface";

/** Shape of a single row in the actions grid. */
interface Row {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: ReactElement;
  readonly available: boolean;
  readonly requireConfirmation: boolean;
  readonly variant: "primary" | "secondary" | "tertiary" | "danger";
  readonly handle: () => void | Promise<void>;
}

/**
 * The Actions built-in panel.
 */
export function ActionsPanel({ className }: ActionsPanelProps): ReactElement {
  const { analytics } = useDevtoolsContext();

  // Resolve optional managers — every one uses `useOptionalInject`
  // so an app that doesn't ship the corresponding `@stackra/*`
  // package just gets a disabled action instead of a crash.
  const cache = useOptionalInject<{
    instance?: (name?: string) => { clear(): Promise<void> | void };
    getInstanceNames?: () => readonly string[];
  }>(CACHE_MANAGER);
  const queue = useOptionalInject<{
    instance?: (name?: string) => { clear(): Promise<void> | void };
    getInstanceNames?: () => readonly string[];
  }>(QUEUE_MANAGER);
  const scope = useOptionalInject<{ resetAll?: () => void }>(SCOPE_SERVICE);
  const state = useOptionalInject<{ getSnapshot?: () => unknown }>(STATE_REGISTRY);
  const discovery = useOptionalInject<{
    getProviders: () => readonly { name: string; instance: unknown }[];
  }>(DISCOVERY_SERVICE);

  const [pending, setPending] = useState<Row | null>(null);

  const runRow = useCallback(
    async (row: Row): Promise<void> => {
      analytics.actionTriggered("actions", row.id);
      try {
        await row.handle();
      } catch {
        // fail-soft — action authors surface their own errors.
      }
    },
    [analytics],
  );

  const rows: readonly Row[] = [
    {
      id: "clear-caches",
      label: "Clear all caches",
      description: cache
        ? "Empty every registered @stackra/cache instance."
        : "Requires @stackra/cache to be installed.",
      icon: <TrashIcon aria-hidden="true" className="size-4" />,
      available: Boolean(cache),
      requireConfirmation: true,
      variant: "danger",
      handle: async (): Promise<void> => {
        if (!cache) return;
        // Iterate every configured instance via `getInstanceNames`
        // when present. If the manager doesn't expose the helper,
        // fall back to clearing the default instance only.
        const names = cache.getInstanceNames?.() ?? [];
        if (names.length === 0) {
          await cache.instance?.()?.clear();
          return;
        }
        await Promise.all(
          names.map(async (name) => {
            await cache.instance?.(name)?.clear();
          }),
        );
      },
    },
    {
      id: "drain-queues",
      label: "Drain queues",
      description: queue
        ? "Clear pending jobs in every registered queue."
        : "Requires @stackra/queue to be installed.",
      icon: <QueueListIcon aria-hidden="true" className="size-4" />,
      available: Boolean(queue),
      requireConfirmation: true,
      variant: "danger",
      handle: async (): Promise<void> => {
        if (!queue) return;
        const names = queue.getInstanceNames?.() ?? [];
        if (names.length === 0) {
          await queue.instance?.()?.clear();
          return;
        }
        await Promise.all(
          names.map(async (name) => {
            await queue.instance?.(name)?.clear();
          }),
        );
      },
    },
    {
      id: "reset-scopes",
      label: "Reset scopes",
      description: scope
        ? "Purge every active scope in the scope tree."
        : "Requires @stackra/scope to be installed.",
      icon: <RectangleGroupIcon aria-hidden="true" className="size-4" />,
      available: Boolean(scope?.resetAll),
      requireConfirmation: true,
      variant: "danger",
      handle: (): void => {
        scope?.resetAll?.();
      },
    },
    {
      id: "dump-state",
      label: "Dump state to console",
      description: state
        ? "Serialise every registered state store and log it."
        : "Requires @stackra/state to be installed.",
      icon: <CircleStackIcon aria-hidden="true" className="size-4" />,
      available: Boolean(state?.getSnapshot),
      requireConfirmation: false,
      variant: "secondary",
      handle: (): void => {
        try {
          // eslint-disable-next-line no-console
          console.info("[@stackra/devtools] state snapshot →", state?.getSnapshot?.());
        } catch {
          // fail-soft
        }
      },
    },
    {
      id: "copy-di-graph",
      label: "Copy DI graph",
      description: discovery
        ? "Write a JSON graph of every provider to the clipboard."
        : "Requires @stackra/container discovery to be enabled.",
      icon: <ClipboardDocumentIcon aria-hidden="true" className="size-4" />,
      available: Boolean(discovery),
      requireConfirmation: false,
      variant: "secondary",
      handle: async (): Promise<void> => {
        if (!discovery) return;
        // Build a minimal graph: `[{ name, hasInstance }]`. A more
        // detailed graph would need module boundaries — a future
        // enhancement.
        const graph = discovery.getProviders().map((p) => ({
          name: p.name,
          hasInstance: p.instance !== undefined,
        }));
        try {
          await navigator.clipboard.writeText(JSON.stringify(graph, null, 2));
        } catch {
          // Clipboard access can fail in cross-origin iframes / on
          // http (non-https) origins. Fall back to a console log so
          // the dev still gets the payload.
          // eslint-disable-next-line no-console
          console.info("[@stackra/devtools] DI graph →", graph);
        }
      },
    },
    {
      id: "reload-page",
      label: "Reload page",
      description: "Perform a full window.location.reload().",
      icon: <ArrowPathIcon aria-hidden="true" className="size-4" />,
      available: typeof window !== "undefined",
      requireConfirmation: true,
      variant: "secondary",
      handle: (): void => {
        if (typeof window !== "undefined") window.location.reload();
      },
    },
  ];

  const handlePress = useCallback(
    (row: Row) => {
      if (!row.available) return;
      if (row.requireConfirmation) {
        setPending(row);
      } else {
        void runRow(row);
      }
    },
    [runRow],
  );

  const handleConfirm = useCallback(() => {
    if (!pending) return;
    const row = pending;
    setPending(null);
    void runRow(row);
  }, [pending, runRow]);

  return (
    <div className={className ?? "flex flex-col gap-4"}>
      <header>
        <h3 className="text-foreground text-base font-semibold">Maintenance</h3>
        <p className="text-muted text-xs">
          One-shot maintenance actions. Optional dependencies are disabled when the corresponding
          package isn't installed in this app.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.id}>
            <Card.Header>
              <div className="text-muted flex items-center gap-2">
                {row.icon}
                <Card.Title className="text-sm">{row.label}</Card.Title>
              </div>
              <Card.Description>{row.description}</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button
                size="sm"
                variant={row.variant === "danger" ? "danger-soft" : row.variant}
                isDisabled={!row.available}
                onPress={() => handlePress(row)}
                data-devtools-action={row.id}
              >
                {row.label}
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
                  {pending?.description ?? "This action is irreversible."}
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
    </div>
  );
}
