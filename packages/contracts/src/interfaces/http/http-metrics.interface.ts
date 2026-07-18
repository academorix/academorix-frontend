/**
 * @file http-metrics.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Metrics contracts collected by `MetricsCollectorService`.
 */

/** A single recorded request outcome. */
export interface IHttpRequestRecord {
  /** Endpoint key (usually method + path template). */
  endpoint: string;
  /** HTTP method. */
  method: string;
  /** Response status code. */
  status: number;
  /** Duration in milliseconds. */
  duration: number;
  /** Whether the request succeeded. */
  success: boolean;
}

/** Aggregated metrics for one endpoint. */
export interface IHttpEndpointMetrics {
  /** Endpoint key. */
  endpoint: string;
  /** HTTP method. */
  method: string;
  /** Total requests recorded. */
  totalRequests: number;
  /** Successful requests. */
  successCount: number;
  /** Failed requests. */
  failureCount: number;
  /** Rolling window of recent durations (ms). */
  durations: number[];
  /** Status-code histogram. */
  statusCodes: Map<number, number>;
}

/** p50/p95/p99 latency percentiles. */
export interface IHttpPercentiles {
  /** Median latency (ms). */
  p50: number;
  /** 95th-percentile latency (ms). */
  p95: number;
  /** 99th-percentile latency (ms). */
  p99: number;
}

/** Cross-endpoint real-time stats for dashboards. */
export interface IHttpRealTimeStats {
  /** Total requests across all endpoints. */
  totalRequests: number;
  /** Success rate as a percentage (0..100). */
  successRate: number;
  /** Average duration across all recorded requests (ms). */
  averageDuration: number;
  /** Number of endpoints with recorded metrics. */
  activeEndpoints: number;
}

/** Pluggable exporter for collected metrics. */
export interface IHttpMetricsExporter {
  /** Export a snapshot of endpoint metrics. */
  export(metrics: IHttpEndpointMetrics[]): void | Promise<void>;
}
