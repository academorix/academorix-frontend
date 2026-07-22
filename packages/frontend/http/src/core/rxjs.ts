/**
 * @file rxjs.ts
 * `@stackra/http/rxjs` — Observable helpers.
 *
 * Optional adapter that converts `IHttpStream<T>` returned by
 * `IHttpClient.stream()` / `IHttpClient.sse()` into an RxJS
 * `Observable<T>`. Apps that don't use RxJS pay nothing for it
 * because this module lives behind a subpath import — tree-shakers
 * never see the import unless consumers reach for it.
 *
 * @example
 * ```typescript
 * import { fromHttpStream } from '@stackra/http/rxjs';
 *
 * const events$ = fromHttpStream(client.sse<TickerUpdate>('/api/prices/stream'));
 * const sub = events$.subscribe((event) => store.update(event.data));
 * ```
 *
 * @module @stackra/http/rxjs
 */

import { Observable } from "rxjs";

import type { IHttpStream } from "@stackra/contracts";

/**
 * Wrap an `IHttpStream<T>` in an RxJS `Observable<T>`.
 *
 * The returned observable cancels the underlying stream on
 * unsubscribe and propagates errors via `error()`.
 *
 * @typeParam T - Decoded value type.
 * @param stream - Stream returned by `IHttpClient.stream()` /
 *   `IHttpClient.sse()`.
 */
export function fromHttpStream<T>(stream: IHttpStream<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    let cancelled = false;

    (async () => {
      try {
        for await (const value of stream) {
          if (cancelled) return;
          subscriber.next(value);
        }
        if (!cancelled) subscriber.complete();
      } catch (err: Error | any) {
        if (!cancelled) {
          subscriber.error(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => {
      cancelled = true;
      stream.cancel();
    };
  });
}
