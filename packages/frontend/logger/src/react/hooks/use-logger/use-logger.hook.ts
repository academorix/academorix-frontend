/**
 * @file use-logger.hook.ts
 * @module @stackra/logger/react/hooks
 * @description React hook for creating context-bound Logger instances.
 *   The recommended way to log from React components and hooks.
 */

import { useMemo } from "react";
import { useInject } from "@stackra/container/react";
import { LOGGER_MANAGER, type ILoggerManager, type ILogger } from "@stackra/contracts";

/**
 * Create a context-bound Logger instance inside a React component.
 *
 * Resolves the LoggerManager from the DI container and creates a Logger
 * bound to the given context name. The Logger is memoized — it won't be
 * recreated on re-renders.
 *
 * @param context - The context name (component name, hook name, etc.)
 * @returns A memoized Logger instance
 *
 * @example
 * ```typescript
 * function OrderPage() {
 *   const logger = useLogger('OrderPage');
 *
 *   useEffect(() => {
 *     logger.info('Page mounted');
 *     return () => logger.debug('Page unmounted');
 *   }, []);
 *
 *   return <div>Orders</div>;
 * }
 * ```
 */
export function useLogger(context: string): ILogger {
  const loggerManager = useInject<ILoggerManager>(LOGGER_MANAGER);

  return useMemo(() => {
    return loggerManager.create(context);
  }, [loggerManager, context]);
}
