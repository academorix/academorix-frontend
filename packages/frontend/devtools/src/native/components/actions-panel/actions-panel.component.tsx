/**
 * @file actions-panel.component.tsx
 * @module @stackra/devtools/native/components
 * @description Content of the built-in "Actions" devtools panel on
 *   native. Renders a stack of `Card`s with primary `Button`
 *   affordances for one-shot maintenance actions.
 *
 *   HeroUI Native Pro doesn't ship an `AlertDialog`-equivalent
 *   primitive; the OSS `Dialog` compound is used to gate
 *   destructive actions behind a confirm step. This mirrors the
 *   web panel's contract without special-casing native.
 */

import { useCallback, useState, type ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, Card, Dialog } from "@stackra/ui/native";
import { useOptionalInject } from "@stackra/container/react";
import {
  CACHE_MANAGER,
  DISCOVERY_SERVICE,
  QUEUE_MANAGER,
  SCOPE_SERVICE,
  STATE_REGISTRY,
} from "@stackra/contracts";

import { useNativeDevtoolsContext } from "../../hooks/use-native-devtools-context.hook";
import type { ActionsPanelProps } from "./actions-panel.interface";

/** Shape of a single row in the actions stack. */
interface Row {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly available: boolean;
  readonly requireConfirmation: boolean;
  readonly variant: "primary" | "secondary" | "tertiary" | "danger" | "danger-soft";
  readonly handle: () => void | Promise<void>;
}

/**
 * The native Actions panel.
 */
export function ActionsPanel({ className }: ActionsPanelProps): ReactElement {
  const { analytics } = useNativeDevtoolsContext();

  // Resolve optional managers — each uses `useOptionalInject` so an
  // app that doesn't install the corresponding `@stackra/*` package
  // just sees a disabled action instead of a crash.
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
      // Emit analytics before firing — matches the web panel's
      // ordering (event fires even if the handler throws).
      analytics.actionTriggered("actions", row.id);
      try {
        await row.handle();
      } catch {
        // fail-soft — the panel author surfaces their own errors.
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
      available: Boolean(cache),
      requireConfirmation: true,
      variant: "danger-soft",
      handle: async (): Promise<void> => {
        if (!cache) return;
        // Iterate every configured instance via `getInstanceNames`
        // when present; fall back to clearing the default instance
        // only.
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
      available: Boolean(queue),
      requireConfirmation: true,
      variant: "danger-soft",
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
      available: Boolean(scope?.resetAll),
      requireConfirmation: true,
      variant: "danger-soft",
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
      id: "log-di-graph",
      label: "Log DI graph",
      description: discovery
        ? "Log a JSON graph of every registered provider."
        : "Requires @stackra/container discovery to be enabled.",
      available: Boolean(discovery),
      requireConfirmation: false,
      variant: "secondary",
      handle: (): void => {
        if (!discovery) return;
        const graph = discovery.getProviders().map((p) => ({
          name: p.name,
          hasInstance: p.instance !== undefined,
        }));
        // eslint-disable-next-line no-console
        console.info("[@stackra/devtools] DI graph →", graph);
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
    <>
      <ScrollView className={className} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="gap-1">
          <Text className="text-foreground text-base font-semibold">Maintenance</Text>
          <Text className="text-muted text-xs">
            One-shot maintenance actions. Optional dependencies are disabled when the corresponding
            package isn't installed.
          </Text>
        </View>
        {rows.map((row) => (
          <Card key={row.id}>
            <Card.Header>
              <Card.Title>{row.label}</Card.Title>
              <Card.Description>{row.description}</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button
                isDisabled={!row.available}
                size="sm"
                variant={row.variant}
                onPress={() => handlePress(row)}
              >
                <Button.Label>{row.label}</Button.Label>
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </ScrollView>
      <Dialog
        isOpen={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>{pending?.label ?? ""}</Dialog.Title>
            <Dialog.Description>
              {pending?.description ?? "This action is irreversible."}
            </Dialog.Description>
            <View className="mt-4 flex-row justify-end gap-2">
              <Button size="sm" variant="ghost" onPress={() => setPending(null)}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button size="sm" variant="danger-soft" onPress={handleConfirm}>
                <Button.Label>Confirm</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
