/**
 * @file kbd-config.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the merged `KbdModuleOptions` — the runtime
 *   configuration passed into `KbdModule.forRoot(...)`.
 *
 *   Package-owned. Consumers reach it through
 *   `@Inject(KBD_CONFIG)` / `useOptionalInject(KBD_CONFIG)` and never
 *   through `@stackra/contracts` (the token has no cross-package
 *   contract shape — it IS the kbd module's own options bag).
 */

export const KBD_CONFIG: unique symbol = Symbol.for("KBD_CONFIG");
