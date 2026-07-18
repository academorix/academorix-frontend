/**
 * @file conditional-module-options.interface.ts
 * @module @stackra/contracts/interfaces/config
 * @description Options accepted by `ConditionalModule.registerWhen`.
 *
 * @derived @nestjs/config@4.0.4 — lib/conditional.module.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * Options controlling `ConditionalModule.registerWhen` evaluation.
 *
 * The conditional module waits for `ConfigModule.envVariablesLoaded`
 * before evaluating its predicate — the timeout guards against a
 * misconfigured import graph where env loading never finishes.
 *
 * @publicApi
 */
export interface IConditionalModuleOptions {
  /**
   * Maximum time (in milliseconds) to wait for `ConfigModule` to
   * finish loading environment variables before throwing. Applies
   * only when `ConditionalModule` is imported alongside
   * `ConfigModule.forRoot`.
   *
   * @default 5000
   */
  timeout?: number;
}
