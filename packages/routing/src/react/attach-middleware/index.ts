/**
 * @file index.ts
 * @module @stackra/routing/react/attach-middleware
 * @description Barrel for the internal middleware-attachment util.
 *
 *   NOTE: this barrel is consumed by `<StackraRoutingProvider>` ONLY.
 *   `attachMiddleware` is NOT re-exported from `react/index.ts` — per
 *   PLAN v3.10.2 the util is internal API.
 */

export { attachMiddleware, type AttachEnvironment } from "./attach-middleware.util";
