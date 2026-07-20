/**
 * @file default-ai-config.constant.ts
 * @module @stackra/ai/core/constants
 * @description Single source of truth for `@stackra/ai` default configuration.
 *   Applied to every `AiModule.forRoot()` registration via `mergeConfig()`.
 *
 *   `baseUrl` and `authProvider` are intentionally omitted: they are required
 *   fields with no sensible default and must be supplied by the consumer.
 */

import type { IAiModuleOptions } from "@stackra/contracts";

/**
 * The subset of {@link IAiModuleOptions} that carries sane defaults.
 *
 * `baseUrl` and `authProvider` are required by the consumer and therefore
 * excluded here — `mergeConfig()` spreads these defaults *under* the
 * user-supplied options.
 */
export const DEFAULT_AI_CONFIG: Omit<IAiModuleOptions, "baseUrl" | "authProvider"> = Object.freeze({
  /** Context-collection defaults (debounce, leader gating, size caps). */
  context: {
    debounceMs: 500,
    leaderGated: true,
    maxFrameBytes: 16_384,
    maxSnapshotBytes: 65_536,
  },
  /** Bounded exponential-backoff reconnection policy. */
  retryPolicy: {
    maxAttempts: 5,
    baseMs: 500,
    capMs: 15_000,
  },
  /** Speech features are opt-in. */
  speech: {
    transcribe: false,
    tts: false,
  },
  /** No declaratively-provided personas by default. */
  personas: [],
});
