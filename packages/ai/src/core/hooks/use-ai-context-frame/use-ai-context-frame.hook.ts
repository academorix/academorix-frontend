/**
 * @file use-ai-context-frame.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiContextFrame(key, snapshot, options)` — the single
 *   primitive for contributing a UI context frame while the calling
 *   component is mounted. Symmetric with `useAiTool`.
 *
 *   Lifecycle:
 *     • mount → registry.register(...)
 *     • snapshot change → registry.update(...) (deep-equal guarded)
 *     • unmount → registry.unregister(...)
 *
 *   Requirements 10.1, 10.2, 10.3, 12.3.
 */

import { useEffect, useRef } from 'react';
import { useInject } from '@stackra/container/react';
import { AI_CONTEXT_REGISTRY } from '@stackra/contracts';

import { ContextRegistry } from '@/core/registries/context.registry';
import { deepEqual } from '@/core/utils/deep-equal.util';

/** Options accepted by {@link useAiContextFrame}. */
export interface IUseAiContextFrameOptions {
  /** Ordering weight (default 0). */
  priority?: number;
  /** Namespacing for multiple instances of the same key. */
  scope?: string;
}

/**
 * Contribute a UI context frame while the caller is mounted.
 *
 * @param key - Frame key, e.g. `drawer:order`, `popup:customer`.
 * @param snapshot - Arbitrary snapshot data — PII-redacted at collection
 *   time by the `ContextCollector`.
 * @param options - Optional priority + scope.
 */
export function useAiContextFrame(
  key: string,
  snapshot: unknown,
  options: IUseAiContextFrameOptions = {}
): void {
  const registry = useInject<ContextRegistry>(AI_CONTEXT_REGISTRY);
  const priority = options.priority ?? 0;
  const scope = options.scope;

  // Track the last snapshot so we can skip no-op updates cheaply.
  const previousRef = useRef<unknown>(undefined);

  // Register once per (key, scope, priority). Snapshot updates flow
  // through the second effect so remount is NOT triggered when data
  // changes.
  useEffect(() => {
    registry.register({ key, snapshot, priority, ...(scope !== undefined ? { scope } : {}) });
    previousRef.current = snapshot;
    return () => registry.unregister(key, scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry, key, scope, priority]);

  // Deep-equal snapshot update guard.
  useEffect(() => {
    if (deepEqual(previousRef.current, snapshot)) return;
    previousRef.current = snapshot;
    registry.update(key, snapshot, scope);
  }, [registry, key, scope, snapshot]);
}
