/**
 * @file broadcast-channel.connector.ts
 * @module @stackra/queue/core/connectors
 * @description Cross-tab queue connector. Distributes jobs between
 *   browser tabs through `@stackra/coordinator`'s shared
 *   `ITabTransportManager` — pairs naturally with
 *   `@stackra/coordinator`'s leader election so only the leader
 *   tab drains the queue.
 *
 *   The connector no longer instantiates `BroadcastChannel`
 *   directly; the manager owns environment detection and channel
 *   caching for the whole workspace.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import {
  TAB_TRANSPORT_MANAGER,
  type ITabTransport,
  type ITabTransportManager,
} from "@stackra/contracts";

import type {
  IJobOptions,
  IQueueConnection,
  IQueueConnectionConfig,
  IQueueConnector,
  IQueuedJob,
} from "@/core/interfaces";
import { generateJobId } from "@/core/utils/job-helpers.util";

// ════════════════════════════════════════════════════════════════════════════════
// Connection
// ════════════════════════════════════════════════════════════════════════════════

/** Cross-tab queue connection — job distribution via `ITabTransport`. */
export class BroadcastChannelConnection implements IQueueConnection {
  /** Channel handle resolved from the transport manager. */
  private transport: ITabTransport | null = null;

  /** Handle from the transport's subscribe call. */
  private unsubscribe: (() => void) | null = null;

  /** Local job queue (only the leader processes these). */
  private readonly localQueue: IQueuedJob[] = [];

  /** Channel name. */
  private readonly channelName: string;

  /**
   * @param manager - Optional transport manager. When absent (SSR /
   *   non-DOM / coordinator missing) the connector runs in
   *   local-only mode.
   * @param config - Per-connection config (channel name).
   */
  public constructor(manager: ITabTransportManager | undefined, config: IQueueConnectionConfig) {
    this.channelName = (config.channelName as string | undefined) ?? "stackra-queue";

    if (manager && manager.isSupported()) {
      this.transport = manager.channel(this.channelName);
      this.unsubscribe = this.transport.subscribe((data) => {
        const msg = data as { kind?: string; job?: IQueuedJob } | undefined;
        if (msg && msg.kind === "job" && msg.job) {
          this.localQueue.push(msg.job);
        }
      });
    }
  }

  /** @inheritdoc */
  public async push<T>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const queueName = options?.queue ?? "default";
    const id = generateJobId();
    const job: IQueuedJob<T> = {
      id,
      name,
      data,
      attempts: 0,
      maxAttempts: options?.tries ?? 1,
      queue: queueName,
      createdAt: Date.now(),
    };

    // Broadcast to all tabs (including self) so every follower can
    // see the pending job — the leader drains, others observe.
    this.transport?.broadcast({ kind: "job", job });

    // Also store locally (in case we're the leader).
    this.localQueue.push(job);
    return id;
  }

  /** @inheritdoc */
  public async later<T>(
    _delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string> {
    return this.push(name, data, options);
  }

  /** @inheritdoc */
  public async bulk<T>(
    jobs: Array<{ name: string; data: T; options?: IJobOptions }>,
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const job of jobs) {
      ids.push(await this.push(job.name, job.data, job.options));
    }
    return ids;
  }

  /** @inheritdoc */
  public async pop(queue: string = "default"): Promise<IQueuedJob | null> {
    const index = this.localQueue.findIndex((j) => j.queue === queue);
    if (index === -1) return null;
    return this.localQueue.splice(index, 1)[0] ?? null;
  }

  /** @inheritdoc */
  public async size(queue: string = "default"): Promise<number> {
    return this.localQueue.filter((j) => j.queue === queue).length;
  }

  /** @inheritdoc */
  public async remove(jobId: string): Promise<void> {
    const index = this.localQueue.findIndex((j) => j.id === jobId);
    if (index !== -1) this.localQueue.splice(index, 1);
  }

  /** @inheritdoc */
  public async pause(_queue?: string): Promise<void> {
    /* no-op */
  }

  /** @inheritdoc */
  public async resume(_queue?: string): Promise<void> {
    /* no-op */
  }

  /** @inheritdoc */
  public async clear(queue: string = "default"): Promise<void> {
    for (let i = this.localQueue.length - 1; i >= 0; i--) {
      if (this.localQueue[i]!.queue === queue) this.localQueue.splice(i, 1);
    }
  }

  /** @inheritdoc */
  public async close(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    // Leave the shared channel open — the transport manager owns
    // its lifecycle; other consumers of the same channel keep
    // working.
    this.transport = null;
    this.localQueue.length = 0;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Connector
// ════════════════════════════════════════════════════════════════════════════════

/**
 * BroadcastChannel connector — cross-tab job distribution wired
 * through the shared `ITabTransportManager`.
 */
@Injectable()
export class BroadcastChannelConnector implements IQueueConnector {
  /**
   * @param manager - Optional cross-tab transport manager. When the
   *   coordinator module isn't loaded the connector still works —
   *   jobs stay tab-local.
   */
  public constructor(
    @Optional() @Inject(TAB_TRANSPORT_MANAGER) private readonly manager?: ITabTransportManager,
  ) {}

  public async connect(config: IQueueConnectionConfig): Promise<IQueueConnection> {
    return new BroadcastChannelConnection(this.manager, config);
  }
}
