/**
 * `useStream` React hook.
 *
 * Subscribes to a streaming HTTP request and exposes the latest
 * batch of decoded values. Cleans up the underlying request on
 * unmount.
 *
 * @module @stackra/http/react/hooks/use-stream
 */

import { useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';

import { HTTP_MANAGER, type IHttpManager, type IStreamConfig } from '@stackra/contracts';

import type { IUseStreamResult } from '@/react/interfaces';

/**
 * Subscribe to a streaming endpoint.
 *
 * @typeParam T - Decoded value type.
 * @param url        - Stream URL.
 * @param config     - Optional stream configuration (format, headers, …).
 * @param connection - Connection name. Uses the default when omitted.
 * @returns Reactive stream state.
 */
export function useStream<T = unknown>(
  url: string,
  config?: IStreamConfig,
  connection?: string
): IUseStreamResult<T> {
  const manager = useInject<IHttpManager>(HTTP_MANAGER);
  const [state, setState] = useState<IUseStreamResult<T>>({
    values: [],
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

        const stream = client.stream<T>(url, config);
        cancelFn = () => stream.cancel();

        setState((prev) => ({ ...prev, open: true, cancel: () => stream.cancel() }));

        try {
          for await (const value of stream) {
            if (cancelled) break;
            setState((prev) => ({
              ...prev,
              values: [...prev.values, value],
              latest: value,
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
