/**
 * @file log-channel.interface.ts
 * @module @stackra/logger/core/interfaces
 * @description Internal interface for a resolved log channel.
 *   A channel groups reporters, a level threshold, and an optional formatter
 *   into a single dispatch target. This is internal to the logger package —
 *   no other package needs to implement or type-check against it.
 */

import type { ILogReporter, ILogChannelConfig, ILogFormatter } from "@stackra/contracts";

/**
 * A resolved log channel — the runtime representation of a channel config.
 *
 * Created lazily by `LoggerManager.createDriver()` when a channel is first
 * accessed. Contains the actual reporter instances (not just their names).
 */
export interface ILogChannel {
  /** The raw channel configuration. */
  config: ILogChannelConfig;

  /** Resolved reporter instances that will receive entries for this channel. */
  reporters: ILogReporter[];

  /** Optional formatter applied to entries before reporter write. */
  formatter?: ILogFormatter;
}
