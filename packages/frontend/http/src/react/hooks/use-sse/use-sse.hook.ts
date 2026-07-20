/**
 * `useSse` React hook.
 *
 * Subscribes to an SSE endpoint. Identical state shape to
 * {@link useStream} but emits `ISseEvent<T>` records.
 *
 * @module @stackra/http/react/hooks/use-sse
 */

import { useEffect, useState } from "react";
import { useInject } from "@stackra/container/react";

import { HTTP_MANAGER, type IHttpManager, type ISseConfig } from "@stackra/contracts";

import type { IUseSseResult } from "@/react/interfaces";

/**
 * Subscribe to an SSE endpoint.
 *
 * @typeParam T - Decoded payload type for each event.
 * @param url        - SSE URL.
 * @param config     - Optional SSE configuration.
 * @param connection - Connection name. Uses the default when omitted.
 */
export function useSse<T = unknown>(
  url: string,
  config?: ISseConfig,
  connection?: string,
): IUseSseResult<T> {
  const manager = useInject<IHttpManager>(HTTP_MANAGER);
  const [state, setState] = useState<IUseSseResult<T>>({
    events: [],
    latest: undefined,
    open: false,
    error: null,
    cancel: () => undefined,
  });

  useEffect(() => {
    let cancelled = false;
    let cancelFn: () => void = () => undefined;

    (async () => {
      try {
        const client = await manager.connection(connection);
        if (cancelled) return;

        const stream = client.sse<T>(url, config);
        cancelFn = () => stream.cancel();
        setState((prev) => ({ ...prev, open: true, cancel: () => stream.cancel() }));

        try {
          for await (const event of stream) {
            if (cancelled) break;
            setState((prev) => ({
              ...prev,
              events: [...prev.events, event],
              latest: event,
            }));
          }
          if (!cancelled) {
            setState((prev) => ({ ...prev, open: false }));
          }
        } catch (err: Error | any) {
          if (!cancelled) {
            setState((prev) => ({
              ...prev,
              open: false,
              error: err instanceof Error ? err : new Error(String(err)),
            }));
          }
        }
      } catch (err: Error | any) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            open: false,
            error: err instanceof Error ? err : new Error(String(err)),
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelFn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, url, connection]);

  return state;
}
