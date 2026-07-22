/**
 * @file metrics-collector.service.ts
 * MetricsCollectorService.
 *
 * In-memory metrics aggregator. Records last-N durations per
 * endpoint, computes percentile latencies, and exposes real-time
 * stats for dashboards. External exporters (Sentry, Datadog) are
 * pluggable through `IHttpMetricsExporter`.
 *
 * @module @stackra/http/services/metrics-collector
 */

import { Injectable } from "@stackra/container";

import type {
  IHttpEndpointMetrics,
  IHttpPercentiles,
  IHttpRealTimeStats,
  IHttpRequestRecord,
} from "@stackra/contracts";

/** Maximum number of durations stored per endpoint. */
const MAX_DURATIONS = 1_000;

/**
 * In-memory metrics aggregator.
 */
@Injectable()
export class MetricsCollectorService {
  /** Per-endpoint aggregated metrics. */
  private readonly metrics: Map<string, IHttpEndpointMetrics> = new Map();

  /** Record one request. */
  public recordRequest(record: IHttpRequestRecord): void {
    let entry = this.metrics.get(record.endpoint);

    if (!entry) {
      entry = {
        endpoint: record.endpoint,
        method: record.method,
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        durations: [],
        statusCodes: new Map<number, number>(),
      };
      this.metrics.set(record.endpoint, entry);
    }

    entry.totalRequests++;
    if (record.success) entry.successCount++;
    else entry.failureCount++;

    entry.durations.push(record.duration);
    if (entry.durations.length > MAX_DURATIONS) {
      entry.durations.shift();
    }

    const statusCount = entry.statusCodes.get(record.status) ?? 0;
    entry.statusCodes.set(record.status, statusCount + 1);
  }

  /** Read the metrics for one endpoint. */
  public getMetrics(endpoint: string): IHttpEndpointMetrics | null {
    return this.metrics.get(endpoint) ?? null;
  }

  /** Read every endpoint's metrics. */
  public getAllMetrics(): IHttpEndpointMetrics[] {
    return Array.from(this.metrics.values());
  }

  /** Compute p50/p95/p99 latencies for one endpoint. */
  public getPercentiles(endpoint: string): IHttpPercentiles | null {
    const entry = this.metrics.get(endpoint);
    if (!entry || entry.durations.length === 0) return null;

    const sorted = [...entry.durations].sort((a, b) => a - b);
    return {
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  /** Cross-endpoint stats for dashboards. */
  public getRealTimeStats(): IHttpRealTimeStats {
    const all = this.getAllMetrics();
    const totalRequests = all.reduce((sum, m) => sum + m.totalRequests, 0);
    const successCount = all.reduce((sum, m) => sum + m.successCount, 0);

    let totalDuration = 0;
    let durationCount = 0;
    for (const entry of all) {
      for (const d of entry.durations) {
        totalDuration += d;
      }
      durationCount += entry.durations.length;
    }

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      activeEndpoints: all.length,
    };
  }

  /** Drop every endpoint's metrics. */
  public reset(): void {
    this.metrics.clear();
  }

  /**
   * Compute a percentile out of a sorted ascending list.
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }
}
