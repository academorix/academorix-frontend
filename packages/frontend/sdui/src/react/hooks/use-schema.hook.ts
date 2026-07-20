/**
 * @file use-schema.hook.ts
 * @module @stackra/sdui/react/hooks
 * @description `useSchema(path, options?)` — fetch an SDUI screen through
 *   the DI-managed {@link SduiService}.
 */

import { useCallback, useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';
import type { ISduiScreen } from '@stackra/contracts';
import { SDUI_SERVICE } from '@stackra/contracts';
import type { SduiService } from '@/core/services/sdui.service';

/**
 * Return shape of {@link useSchema}.
 */
export interface IUseSchemaResult {
  readonly schema: ISduiScreen | null;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
}

/**
 * Fetch a screen by path.
 *
 * @param path - Route path (or cache key) to load.
 * @param options - `{ force }` — bypass the schema cache.
 */
export function useSchema(
  path: string | null,
  options: { force?: boolean } = {}
): IUseSchemaResult {
  const service = useInject<SduiService>(SDUI_SERVICE);
  const [state, setState] = useState<{
    schema: ISduiScreen | null;
    isLoading: boolean;
    error: Error | null;
    version: number;
  }>({ schema: null, isLoading: path != null, error: null, version: 0 });

  useEffect(() => {
    if (path == null) {
      setState({ schema: null, isLoading: false, error: null, version: state.version });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    service
      .loadScreen(path, options)
      .then((schema) => {
        if (!cancelled) setState({ schema, isLoading: false, error: null, version: state.version });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            schema: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
            version: state.version,
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // Intentionally omit `state.version` — refetch bumps it and re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, options.force, service, state.version]);

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, version: prev.version + 1 }));
  }, []);

  return { schema: state.schema, isLoading: state.isLoading, error: state.error, refetch };
}
