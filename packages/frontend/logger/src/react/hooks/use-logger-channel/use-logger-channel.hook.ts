/**
 * @file use-logger-channel.hook.ts
 * @module @stackra/logger/react/hooks
 * @description React hook for creating a Logger bound to a specific channel.
 */

import { useMemo } from "react";
import { useInject } from "@stackra/container/react";
import { LOGGER_MANAGER, type ILoggerManager, type ILogger } from "@stackra/contracts";

/**
 * Create a Logger instance bound to a specific named channel.
 *
 * Resolves the LoggerManager from the DI container and creates a Logger
 * bound to both the given context and channel name.
 *
 * @param context - The context name (component name, hook name, etc.)
 * @param channel - The channel name (must exist in logger config)
 * @returns A memoized Logger instance bound to the specified channel
 *
 * @example
 * ```typescript
 * function AuditTrail() {
 *   const logger = useLoggerChannel('AuditTrail', 'audit');
 *
 *   const handleAction = (action: string) => {
 *     logger.info('User action recorded', { action });
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useLoggerChannel(context: string, channel: string): ILogger {
  const loggerManager = useInject<ILoggerManager>(LOGGER_MANAGER);

  return useMemo(() => {
    return loggerManager.channel(context, channel);
  }, [loggerManager, context, channel]);
}
