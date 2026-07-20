/**
 * @file channel-tap.interface.ts
 * @module @stackra/logger/core/interfaces
 * @description Internal interface for channel taps — post-resolution
 *   customization hooks applied to channels after they are built by the manager.
 *   This is internal to the logger package (not in contracts).
 */

import type { ILogChannel } from "./log-channel.interface";

/**
 * Channel tap — a post-resolution hook that can modify a resolved channel.
 *
 * Taps run after `createDriver()` resolves a channel and before it is cached.
 * Use cases include adding reporters conditionally, overriding formatters,
 * or injecting middleware-style transformations.
 *
 * @example
 * ```typescript
 * const debugTap: IChannelTap = {
 *   tap(channel, name) {
 *     if (process.env.DEBUG) {
 *       channel.reporters.push(verboseReporter);
 *     }
 *     return channel;
 *   },
 * };
 * ```
 */
export interface IChannelTap {
  /**
   * Modify or replace a resolved channel.
   *
   * @param channel - The resolved channel instance
   * @param name - The channel name being resolved
   * @returns The (possibly modified) channel
   */
  tap(channel: ILogChannel, name: string): ILogChannel;
}
