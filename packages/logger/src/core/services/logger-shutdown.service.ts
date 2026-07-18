/**
 * @file logger-shutdown.service.ts
 * @module @stackra/logger/core/services
 * @description Flushes all buffered reporters on application shutdown.
 */

import { Injectable, Inject, OnModuleDestroy } from "@stackra/container";
import { LOGGER_MANAGER, type ILoggerManager } from "@stackra/contracts";

/**
 * Shutdown service — flushes reporters on container teardown.
 *
 * Ensures no log entries are lost when the application is shutting down
 * by calling flush() on all registered reporters that support it.
 */
@Injectable()
export class LoggerShutdownService implements OnModuleDestroy {
  public constructor(@Inject(LOGGER_MANAGER) private readonly manager: ILoggerManager) {}

  /**
   * Flush all reporters on module destruction.
   */
  public async onModuleDestroy(): Promise<void> {
    if ("flush" in this.manager && typeof (this.manager as any).flush === "function") {
      await (this.manager as any).flush();
    }
  }
}
