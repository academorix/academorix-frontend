/**
 * @file qstash.connector.ts
 * @module @stackra/queue/core/connectors
 * @description QStash connector for serverless environments.
 *   Dispatches jobs via Upstash QStash HTTP API. Jobs are delivered
 *   to your application via webhook callback. Supports delay and retry.
 *   No local processing — QStash handles delivery and retries.
 */

import { Injectable } from "@stackra/container";
import type {
  IQueueConnection,
  IQueueConnector,
  IJobOptions,
  IQueuedJob,
  IQueueConnectionConfig,
} from "@/core/interfaces";
import { generateJobId } from "@/core/utils/job-helpers.util";

// ════════════════════════════════════════════════════════════════════════════════
// Connection
// ════════════════════════════════════════════════════════════════════════════════

/** QStash HTTP-based queue connection for serverless. */
export class QStashConnection implements IQueueConnection {
  /** QStash API token. */
  private readonly token: string;

  /** Webhook destination URL for job delivery. */
  private readonly destinationUrl: string;

  /** QStash API base URL. */
  private readonly baseUrl: string;

  public constructor(config: IQueueConnectionConfig) {
    this.token = (config.token as string) ?? "";
    this.destinationUrl = (config.destinationUrl as string) ?? "";
    this.baseUrl = (config.baseUrl as string) ?? "https://qstash.upstash.io";
  }

  /** @inheritdoc */
  public async push<T>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const id = generateJobId();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "Upstash-Forward-X-Job-Id": id,
      "Upstash-Forward-X-Job-Name": name,
      "Upstash-Forward-X-Queue": options?.queue ?? "default",
    };

    if (options?.delayMs && options.delayMs > 0) {
      headers["Upstash-Delay"] = `${Math.ceil(options.delayMs / 1000)}s`;
    }

    if (options?.tries && options.tries > 1) {
      headers["Upstash-Retries"] = String(options.tries - 1);
    }

    const response = await fetch(`${this.baseUrl}/v2/publish/${this.destinationUrl}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id, name, data, queue: options?.queue ?? "default" }),
    });

    if (!response.ok) {
      throw new Error(`QStash publish failed: ${response.status} ${response.statusText}`);
    }

    return id;
  }

  /** @inheritdoc */
  public async later<T>(
    delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string> {
    return this.push(name, data, { ...options, delayMs });
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

  /**
   * QStash is push-based — no local pop(). Jobs are delivered via webhook.
   * @inheritdoc
   */
  public async pop(_queue?: string): Promise<IQueuedJob | null> {
    return null;
  }

  /** @inheritdoc */
  public async size(_queue?: string): Promise<number> {
    return 0; // QStash doesn't expose queue size
  }

  /** @inheritdoc */
  public async remove(_jobId: string): Promise<void> {
    /* QStash handles lifecycle */
  }
  /** @inheritdoc */
  public async pause(_queue?: string): Promise<void> {
    /* not supported */
  }
  /** @inheritdoc */
  public async resume(_queue?: string): Promise<void> {
    /* not supported */
  }
  /** @inheritdoc */
  public async clear(_queue?: string): Promise<void> {
    /* not supported */
  }
  /** @inheritdoc */
  public async close(): Promise<void> {
    /* no connection to close */
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Connector
// ════════════════════════════════════════════════════════════════════════════════

/** QStash connector — dispatches jobs via Upstash HTTP API. */
@Injectable()
export class QStashConnector implements IQueueConnector {
  public async connect(config: IQueueConnectionConfig): Promise<IQueueConnection> {
    return new QStashConnection(config);
  }
}
