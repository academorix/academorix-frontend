/**
 * @file use-scope-value.hook.ts
 * @module @stackra/scope/react/hooks
 * @description Resolve a cascading scope value for the active scope, via the
 *   DI `ScopeService` (which delegates to the app's data source).
 *   Re-resolves whenever the active scope changes.
 */

import { useEffect, useState } from "react";
import { useInject } from "@stackra/container/react";
import { SCOPE_SERVICE } from "@/core/constants";
import type { ScopeService } from "@/core/services";
import { useScope } from "./use-scope.hook";

/**
 * Resolve a cascading value for the active scope + consumer namespace.
 *
 * Returns `undefined` while loading. Re-resolves when the active node
 * changes. Requires the app's `IScopeDataSource` to implement
 * `resolveValue`.
 *
 * @example
 * ```tsx
 * function InvoicePrefix() {
 *   const prefix = useScopeValue<string>('settings', 'invoice.prefix');
 *   return <span>{prefix ?? 'INV-'}</span>;
 * }
 * ```
 */
export function useScopeValue<T = unknown>(namespace: string, key: string): T | undefined {
  const service = useInject<ScopeService>(SCOPE_SERVICE);
  const { scope } = useScope();
  const nodeId = scope?.nodeId;
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    if (!nodeId) {
      setValue(undefined);
      return;
    }
    let cancelled = false;
    void service.resolveValue<T>(namespace, key).then((result) => {
      if (!cancelled) setValue(result ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [service, nodeId, namespace, key]);

  return value;
}
