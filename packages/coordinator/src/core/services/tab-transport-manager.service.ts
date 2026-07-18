/**
 * @file tab-transport-manager.service.ts
 * @module @stackra/coordinator/core/services
 * @description `ITabTransportManager` implementation — hands out
 *   named `ITabTransport` channels and caches them by name.
 *
 *   The manager owns environment detection: on browsers with
 *   `BroadcastChannel` support it hands out
 *   `BroadcastChannelTabTransport`; on SSR / hardened contexts it
 *   hands out `NoopTabTransport` so consumers never need to
 *   feature-detect.
 */

import { Injectable, type OnModuleDestroy } from '@stackra/container';
import type { ITabTransport, ITabTransportManager } from '@stackra/contracts';

import { BroadcastChannelTabTransport } from '@/core/transports/broadcast-channel-tab.transport';
import { NoopTabTransport } from '@/core/transports/noop-tab.transport';

/**
 * Cross-tab transport manager.
 *
 * Consumers inject the manager and ask it for a named channel:
 *
 * ```typescript
 * @Injectable()
 * class MyService {
 *   private readonly channel: ITabTransport;
 *   public constructor(
 *     @Inject(TAB_TRANSPORT_MANAGER) manager: ITabTransportManager,
 *   ) {
 *     this.channel = manager.channel('my-service:sync');
 *     this.channel.subscribe(this.onMessage);
 *   }
 * }
 * ```
 *
 * Two calls with the same channel name return the same transport,
 * so multiple in-process consumers of the same channel share
 * subscribers instead of duplicating the underlying
 * `BroadcastChannel`.
 */
@Injectable()
export class TabTransportManager implements ITabTransportManager, OnModuleDestroy {
  /** Cache of transports keyed by channel name. */
  private readonly channels = new Map<string, ITabTransport>();

  /** @inheritdoc */
  public isSupported(): boolean {
    return typeof BroadcastChannel !== 'undefined';
  }

  /** @inheritdoc */
  public channel(name: string): ITabTransport {
    const existing = this.channels.get(name);
    if (existing) return existing;

    // Environment detection lives here (not per-consumer) so we can
    // fall through to a no-op transport transparently.
    const impl: ITabTransport = this.isSupported()
      ? new BroadcastChannelTabTransport(name)
      : new NoopTabTransport(name);

    this.channels.set(name, impl);
    return impl;
  }

  /** @inheritdoc */
  public release(name: string): void {
    const existing = this.channels.get(name);
    if (!existing) return;
    try {
      existing.close();
    } catch {
      // fail-soft — closing a bad channel must not stall the
      // caller.
    }
    this.channels.delete(name);
  }

  /**
   * Close every cached channel — invoked on module destroy so we
   * don't leak `BroadcastChannel` handles.
   */
  public onModuleDestroy(): void {
    for (const transport of this.channels.values()) {
      try {
        transport.close();
      } catch {
        // fail-soft — closing a bad channel must not stall teardown.
      }
    }
    this.channels.clear();
  }
}
