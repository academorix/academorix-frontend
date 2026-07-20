/**
 * @file index.ts
 * @module @stackra/queue/core/constants
 * @description Package-owned constants.
 *
 *   Cross-package tokens/metadata keys (`QUEUE_MANAGER`,
 *   `PROCESSOR_METADATA_KEY`, `ON_JOB_EVENT_METADATA_KEY`,
 *   `QUEUE_EVENTS`) are imported directly from `@stackra/contracts`.
 *
 *   `QUEUE_CONFIG_INTERNAL` is intentionally NOT re-exported by the
 *   package's public `src/core/index.ts` barrel — it is a
 *   package-internal binding token consumed only by classes inside
 *   `@stackra/queue`. External consumers reach the same config via
 *   `@Inject(queueConfig.KEY)` on a `registerAs` factory (see
 *   `@stackra/config`).
 *
 *   `DEFAULT_QUEUE_CONFIG` was removed in the `@stackra/config`
 *   migration — defaults now live inline in the app-level
 *   `registerAs` factory. See
 *   `.kiro/specs/stackra-config-package/PLAN.md` §5.2.
 */

// ── Defaults ──
export const DEFAULT_QUEUE_CONNECTION = "default" as const;
export { QUEUE_CONFIG_INTERNAL } from "./queue-config-internal.constant";
