/**
 * @file use-data-sources.hook.ts
 * @module @stackra/sdui/react/hooks
 * @description `useDataSources(sources)` — hydrate a screen's data
 *   sources through the injected {@link ISduiClient}.
 */

import { useEffect, useMemo, useState } from "react";
import { useInject } from "@stackra/container/react";
import type { ISduiClient, ISduiDataSource } from "@stackra/contracts";
import { SDUI_CLIENT } from "@stackra/contracts";

/**
 * Return shape of {@link useDataSources}.
 */
export interface IUseDataSourcesResult {
  readonly data: Readonly<Record<string, unknown>>;
  readonly loading: ReadonlySet<string>;
  readonly errors: Readonly<Record<string, Error>>;
  reload(id?: string): void;
}

/**
 * Hydrate each `ISduiDataSource` through the injected `ISduiClient`.
 *
 * The response for `source[i]` is written to `data[source.assignTo ?? source.id]`.
 */
export function useDataSources(
  sources: readonly ISduiDataSource[] | undefined,
): IUseDataSourcesResult {
  const client = useInject<ISduiClient>(SDUI_CLIENT);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [version, setVersion] = useState<Record<string, number>>({});

  const keyedSources = useMemo(() => sources ?? [], [sources]);

  useEffect(() => {
    if (keyedSources.length === 0) return;
    const controller = new AbortController();
    let cancelled = false;

    for (const source of keyedSources) {
      const target = source.assignTo ?? source.id;
      setLoading((prev) => new Set(prev).add(source.id));
      client
        .request({
          endpoint: source.endpoint,
          method: source.method ?? "GET",
          body: source.body,
          signal: controller.signal,
        })
        .then((response) => {
          if (cancelled) return;
          setData((prev) => ({ ...prev, [target]: response }));
          setLoading((prev) => {
            const next = new Set(prev);
            next.delete(source.id);
            return next;
          });
          setErrors((prev) => {
            const { [source.id]: _removed, ...rest } = prev;
            return rest;
          });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const error = err instanceof Error ? err : new Error(String(err));
          setErrors((prev) => ({ ...prev, [source.id]: error }));
          setLoading((prev) => {
            const next = new Set(prev);
            next.delete(source.id);
            return next;
          });
        });
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
    // Re-run when the sources change OR when reload is called.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyedSources, version]);

  return {
    data,
    loading,
    errors,
    reload(id?: string) {
      setVersion((prev) => {
        const next = { ...prev };
        if (id) next[id] = (next[id] ?? 0) + 1;
        else for (const source of keyedSources) next[source.id] = (next[source.id] ?? 0) + 1;
        return next;
      });
    },
  };
}
