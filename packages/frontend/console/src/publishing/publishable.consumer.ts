/**
 * @file publishable.consumer.ts
 * @module @stackra/console/publishing
 * @description Concrete `IPublishableConsumer` — the fluent builder the
 *   loader hands to each module's `static configurePublishables(consumer)`.
 *
 *   Very thin: every `.publish(entry)` call delegates straight to
 *   `PublishableRegistry.register(entry, sourceModule)`. The consumer's
 *   only added value is:
 *
 *   - Pinning the `sourceModule` argument across a whole
 *     `configurePublishables` invocation so the module doesn't have to
 *     repeat itself.
 *   - Returning `this` from every `.publish(...)` call so chaining works.
 */

import type {
  IPublishableConsumer,
  IPublishableEntry,
  IPublishableFile,
  Type,
} from "@stackra/contracts";

import type { PublishableRegistry } from "./registries/publishable.registry";

/**
 * Structural shape the consumer probes for on the source module class
 * to auto-fill a publishable's `packageRoot` when the entry omits it.
 *
 * The static property is intentionally documentation-only — TypeScript
 * can't check statics against an `implements` clause. Modules declare
 * `public static readonly PACKAGE_ROOT` and the consumer duck-types.
 */
interface IModuleWithPackageRoot {
  readonly PACKAGE_ROOT?: unknown;
}

/**
 * Fluent implementation of `IPublishableConsumer`.
 *
 * Not registered with the DI container — the loader constructs one per
 * `configurePublishables()` call so each module gets a stateless view.
 */
export class PublishableConsumer implements IPublishableConsumer {
  /**
   * @param registry - The target registry every `.publish(...)` call
   *   writes into.
   * @param sourceModule - The module class currently being invoked. Pinned
   *   here so `registry.register(entry, sourceModule)` receives the right
   *   attribution without the caller having to pass it themselves.
   */
  public constructor(
    private readonly registry: PublishableRegistry,
    private readonly sourceModule: Type<unknown> | null,
  ) {}

  /**
   * Register one publishable entry — validation happens inside the
   * registry so the consumer stays free of policy.
   *
   * Auto-fills `entry.packageRoot` from the source module's static
   * `PACKAGE_ROOT` property when the entry omits it. This lets a
   * module declare its package root ONCE at the top of the class and
   * every `.publish(entry)` call inherits it:
   *
   * ```typescript
   * export class EventsModule {
   *   public static readonly PACKAGE_ROOT = path.resolve(...);
   *
   *   public static configurePublishables(consumer: IPublishableConsumer): void {
   *     consumer.publish({
   *       tag: 'events-config',
   *       files: [{ from: '...', to: '...' }],
   *       // no `packageRoot` — resolved from EventsModule.PACKAGE_ROOT
   *     });
   *   }
   * }
   * ```
   *
   * An explicit `entry.packageRoot` still wins — kept for the rare
   * "publish from outside my own tree" case (test fixtures, tooling
   * that hosts stubs in a sibling repo).
   *
   * @param entry - The publishable manifest.
   * @returns `this`, so the module can chain `.publish(...)`.
   */
  public publish(entry: IPublishableEntry): IPublishableConsumer {
    // ── Normalize the two ergonomic shortcuts ────────────────────────
    // 1. `files: ['config/x.ts']` — string shorthand → object with
    //    `to` mirroring `from` (same relative path in the app).
    // 2. `packageRoot` omitted — auto-fill from the source module's
    //    static `PACKAGE_ROOT` property (duck-typed by `typeof`).
    //
    // Both are conveniences for the module author; the registry always
    // receives a fully-normalized `IPublishableEntry` with a concrete
    // `packageRoot` and every `files[]` entry as an object.

    // (2) — resolve packageRoot.
    let resolvedRoot = entry.packageRoot;
    if (!resolvedRoot) {
      // Duck-type via `unknown` + typeof-string so a wrongly-typed
      // value (number, object, ...) doesn't crash here — it surfaces at
      // the registry's validation step with a named-source error.
      const staticRoot = (this.sourceModule as unknown as IModuleWithPackageRoot | null)
        ?.PACKAGE_ROOT;
      resolvedRoot = typeof staticRoot === "string" ? staticRoot : "";
    }

    // (1) — normalize files: string → { from, to }.
    const normalizedFiles: IPublishableFile[] = entry.files.map((f) =>
      typeof f === "string" ? { from: f, to: f } : { ...f, to: f.to ?? f.from },
    );

    this.registry.register(
      { ...entry, packageRoot: resolvedRoot, files: normalizedFiles },
      this.sourceModule,
    );
    return this;
  }
}
