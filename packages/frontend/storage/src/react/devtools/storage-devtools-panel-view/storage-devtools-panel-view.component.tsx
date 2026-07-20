/**
 * @file storage-devtools-panel-view.component.tsx
 * @module @stackra/storage/react/devtools
 * @description React body of the `@stackra/devtools` storage panel.
 *
 *   Renders one {@link Card} per configured storage instance, showing
 *   the driver, entry count (from `IStorage.keys().length`), and a
 *   sample of the first N keys. Read-only: the panel does not
 *   read, write, or clear entries — the built-in Actions panel
 *   exposes destructive helpers instead.
 *
 *   Keys are read on mount + when the instance identity flips —
 *   `IStorage` has no subscribe API, so a full snapshot polling
 *   loop would be wasteful for what is usually a slow-moving KV
 *   surface. Callers who need a live count can toggle the panel
 *   closed / open to force a re-read.
 */

import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { Card, Chip } from "@stackra/ui/react";
import type { IStorage, IStorageManager, IStorageStoreConfig } from "@stackra/contracts";

import type { StorageDevtoolsPanelViewProps } from "./storage-devtools-panel-view.interface";

/** How many sample keys to display per instance. */
const SAMPLE_KEY_LIMIT = 20;

/**
 * One instance's snapshot as displayed in the panel.
 */
interface InstanceRow {
  readonly name: string;
  readonly config: IStorageStoreConfig;
  readonly isDefault: boolean;
}

/**
 * Live-keys probe for a single storage instance.
 *
 * On mount the effect resolves `manager.instance(name).keys()` and
 * stores the first {@link SAMPLE_KEY_LIMIT} entries. On unmount the
 * mounted flag prevents state updates from a late-resolving
 * `keys()` promise. Any failure is swallowed — a driver that
 * throws (missing browser API, unregistered driver) must not
 * crash the devtools shell.
 */
function useStorageKeys(
  manager: IStorageManager | undefined,
  instanceName: string,
): { keys: readonly string[] | null; total: number | null } {
  const [keys, setKeys] = useState<readonly string[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!manager) {
      setKeys(null);
      setTotal(null);
      return () => {
        mounted.current = false;
      };
    }
    (async (): Promise<void> => {
      try {
        const instance: IStorage = manager.instance(instanceName);
        const allKeys = await instance.keys();
        if (!mounted.current) return;
        setTotal(allKeys.length);
        // Slice defensively — some drivers may return live-referenced
        // arrays. Copy so React sees a stable identity.
        setKeys(allKeys.slice(0, SAMPLE_KEY_LIMIT));
      } catch {
        // fail-soft — a broken driver shows "unknown".
        if (!mounted.current) return;
        setKeys(null);
        setTotal(null);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [manager, instanceName]);

  return { keys, total };
}

/**
 * A single instance card.
 *
 * Extracted so the `useStorageKeys` effect scopes per-instance —
 * one instance's error never blanks the others.
 */
function InstanceCard({
  row,
  manager,
}: {
  row: InstanceRow;
  manager: IStorageManager | undefined;
}): ReactElement {
  const { keys, total } = useStorageKeys(manager, row.name);

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <Card.Title className="text-sm">{row.name}</Card.Title>
          {row.isDefault ? (
            <Chip size="sm" variant="secondary">
              <Chip.Label>default</Chip.Label>
            </Chip>
          ) : null}
          <Chip
            size="sm"
            variant={typeof total === "number" && total > 0 ? "primary" : "secondary"}
          >
            <Chip.Label>{typeof total === "number" ? `${total} keys` : "idle"}</Chip.Label>
          </Chip>
        </div>
        <Card.Description>
          Driver <code>{row.config.driver}</code>
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {keys && keys.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {keys.map((k) => (
              <li key={k} className="flex items-center justify-between gap-2">
                <code className="truncate text-xs">{k}</code>
              </li>
            ))}
            {typeof total === "number" && total > keys.length ? (
              <li className="text-muted text-xs">… and {total - keys.length} more</li>
            ) : null}
          </ul>
        ) : (
          <p className="text-muted text-xs">
            {manager
              ? "No keys stored in this instance yet."
              : "Storage manager not resolved — sample keys unavailable."}
          </p>
        )}
      </Card.Content>
    </Card>
  );
}

/**
 * The storage devtools panel body.
 *
 * @param props - See {@link StorageDevtoolsPanelViewProps}.
 * @returns The panel body — a stack of one card per configured
 *   instance, each with its sample keys.
 */
export function StorageDevtoolsPanelView({
  config,
  manager,
}: StorageDevtoolsPanelViewProps): ReactElement {
  // Memoize the row list — same rationale as the queue panel:
  // stable identity across the parent's re-renders keeps every
  // per-instance `useEffect` from re-firing on unrelated renders.
  const rows = useMemo<readonly InstanceRow[]>(() => {
    if (!config) return [];
    return Object.entries(config.stores ?? {}).map(([name, cfg]) => ({
      name,
      config: cfg,
      isDefault: name === config.default,
    }));
  }, [config]);

  if (!config || rows.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <Card.Header>
            <Card.Title>No storage instances configured</Card.Title>
            <Card.Description>
              Register an instance in{" "}
              <code>StorageModule.forRoot(&#123; stores: &#123; ... &#125; &#125;)</code> to see it
              here.
            </Card.Description>
          </Card.Header>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-foreground text-base font-semibold">Storage instances</h3>
        <p className="text-muted text-xs">
          Configured via <code>StorageModule.forRoot()</code>. Keys are read once per open —{" "}
          <code>IStorage</code> has no subscribe API, so a re-open refreshes the sample.
        </p>
      </header>
      {rows.map((row) => (
        <InstanceCard key={row.name} row={row} manager={manager} />
      ))}
    </div>
  );
}
