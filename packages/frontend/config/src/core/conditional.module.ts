/**
 * @file conditional.module.ts
 * @module @stackra/config/core
 * @description `ConditionalModule.registerWhen(module, condition,
 *   options?)` — evaluates `condition` against `process.env` (or
 *   `Env.get(...)` in browser runtimes) AFTER
 *   `ConfigModule.envVariablesLoaded` resolves, then registers
 *   `module` conditionally.
 *
 *   The timeout guard fires when `envVariablesLoaded` never resolves
 *   — a symptom of a misconfigured import graph (e.g.
 *   `ConditionalModule` used without `ConfigModule.forRoot`).
 *
 * @derived @nestjs/config@4.0.4 — lib/conditional.module.ts (MIT, © Kamil Myśliwiec)
 */

import type {
  DynamicModule,
  ForwardReference,
  IConditionalModuleOptions,
  ModuleMetadata,
  Type,
} from "@stackra/contracts";
import { Env } from "@stackra/support";

import { ConfigModule } from "./config.module";
import { DEFAULT_CONDITIONAL_TIMEOUT } from "./constants";

/**
 * Predicate signature used by `ConditionalModule.registerWhen`.
 *
 * Accepts a browser-safe env-source shape (`Record<string, string | undefined>`)
 * rather than nestjs's `NodeJS.ProcessEnv` so the same predicate
 * works in Vite / browser builds.
 */
type ConditionPredicate = (env: Record<string, string | undefined>) => boolean;

/**
 * Read the human-readable name of a module reference for the
 * diagnostic timeout message. Handles the three shapes
 * `ModuleMetadata['imports'][number]` can take: `Type`,
 * `DynamicModule`, `ForwardReference`.
 *
 * Package-internal.
 */
function getInstanceName(instance: unknown): string | undefined {
  if (instance === null || instance === undefined) return undefined;
  // ForwardReference — `{ forwardRef: () => T }`.
  const asForwardRef = instance as ForwardReference;
  if (typeof asForwardRef.forwardRef === "function") {
    const resolved = asForwardRef.forwardRef as () => Type<unknown> | undefined;
    return resolved()?.name;
  }
  // DynamicModule — `{ module: Type }`.
  const asDynamicModule = instance as DynamicModule;
  if (asDynamicModule.module !== undefined) {
    return asDynamicModule.module?.name;
  }
  // Plain class — `Type`.
  return (instance as Type<unknown>).name;
}

/**
 * Copy `process.env` into a browser-safe record snapshot.
 *
 * Under Node, hands back a shallow clone of `process.env`. In browser
 * runtimes, returns an empty object — the predicate should use
 * `Env.get(key)` instead of direct property access, but the empty
 * shape keeps the call site working without special-casing.
 */
function snapshotEnv(): Record<string, string | undefined> {
  if (typeof process !== "undefined" && process.env) {
    return { ...process.env };
  }
  return {};
}

/**
 * Conditionally load a module based on env-var state.
 *
 * @example
 * ```typescript
 * import { ConditionalModule, ConfigModule } from '@stackra/config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true }),
 *
 *     // Env-var name form — loads when USE_REDIS is truthy.
 *     ConditionalModule.registerWhen(RedisCacheModule, 'USE_REDIS'),
 *
 *     // Predicate form — arbitrary logic against the env snapshot.
 *     ConditionalModule.registerWhen(SentryModule, (env) => !!env['SENTRY_DSN']),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export class ConditionalModule {
  /**
   * Register a module conditionally.
   *
   * The predicate runs AFTER `ConfigModule.envVariablesLoaded`
   * resolves, so it sees the same env state `ConfigService.get`
   * will see. When the predicate returns `true`, the target module
   * is imported + exported; when `false`, an empty
   * `ConditionalModule` shell is exported.
   *
   * @param module - The module (Type / DynamicModule / ForwardReference)
   *   to load conditionally.
   * @param condition - Env-var name (truthy check on the value) OR
   *   a predicate function receiving the env snapshot.
   * @param options - Optional timeout override + debug toggle.
   * @returns A `Promise<DynamicModule>` (the conditional module's
   *   `imports` + `exports` list). Always await in `@Module({ imports: [...] })`.
   * @throws {Error} When `ConfigModule.envVariablesLoaded` doesn't
   *   resolve within the configured timeout — typically means
   *   `ConfigModule.forRoot` was never imported.
   */
  public static async registerWhen(
    module: Required<ModuleMetadata>["imports"][number],
    condition: string | ConditionPredicate,
    options?: IConditionalModuleOptions & { debug?: boolean },
  ): Promise<DynamicModule> {
    const timeout = options?.timeout ?? DEFAULT_CONDITIONAL_TIMEOUT;
    const debug = options?.debug ?? true;
    const moduleName = getInstanceName(module) ?? String(module);

    // Race the envVariablesLoaded promise against a timeout. If the
    // deadline hits, throw a diagnostic that names the module — this
    // is the fail-soft signal for "you forgot to import
    // ConfigModule.forRoot".
    const timer = setTimeout(() => {
      throw new Error(
        `@stackra/config was not able to resolve environment variables within ${timeout}ms. ` +
          `The ConditionalModule could not determine whether ${moduleName} should be registered. ` +
          `Ensure ConfigModule.forRoot(...) is imported before this module.`,
      );
    }, timeout);
    // Prevent the timer from keeping the process alive if the module
    // graph resolves normally. `unref` is Node-specific; guard it.
    if (
      typeof timer === "object" &&
      typeof (timer as { unref?: () => void }).unref === "function"
    ) {
      (timer as { unref: () => void }).unref();
    }

    const dynamicModule: DynamicModule = {
      module: ConditionalModule,
      imports: [],
      exports: [],
    };

    // Normalise the string form into a predicate. `env[key]?.toLowerCase() !== 'false'`
    // matches nestjs verbatim — a variable that IS set is truthy
    // unless it's the literal string `'false'`.
    let predicate: ConditionPredicate;
    if (typeof condition === "string") {
      const key = condition;
      predicate = (env) => env[key]?.toLowerCase() !== "false";
    } else {
      predicate = condition;
    }

    await ConfigModule.envVariablesLoaded;
    clearTimeout(timer);

    // Snapshot process.env into a browser-safe shape so predicates
    // work symmetrically. In Node, this is a shallow clone of
    // process.env; in browser, an empty record (the predicate should
    // reach for `Env.get(...)` explicitly there).
    const envSnapshot = snapshotEnv();
    const evaluation = predicate(envSnapshot);

    if (evaluation) {
      // Mutate the placeholder arrays in place — they were declared
      // as `[]` above so the module reference lands in the right
      // shape.
      (dynamicModule.imports as unknown[]).push(module);
      (dynamicModule.exports as unknown[]).push(module);
    } else if (debug) {
      // Fail-soft — log the skip via `console.debug` (rather than
      // nestjs's `Logger.debug`) because we don't want to pull the
      // logger's DI graph into a module that has to boot BEFORE most
      // things wire up. `Env` is still safe to reach.
      const source = typeof condition === "string" ? condition : condition.toString();
      // eslint-disable-next-line no-console
      console.debug(
        `[@stackra/config] Skipping registration of ${moduleName} — ${source} evaluated to false. NODE_ENV=${Env.get("NODE_ENV", "development")}`,
      );
    }
    return dynamicModule;
  }
}
