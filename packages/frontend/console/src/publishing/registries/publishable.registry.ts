/**
 * @file publishable.registry.ts
 * @module @stackra/console/publishing/registries
 * @description Central registry every `vendor:publish` invocation reads
 *   from. Populated once at CLI bootstrap by `PublishableLoader` — one
 *   entry per module `configurePublishables(consumer)` call, keyed on
 *   the workspace-unique tag.
 *
 *   Extends {@link BaseRegistry} from `@stackra/support` for the
 *   unified Map-backed storage. Layers heavy validation on top of the
 *   base's strict-register semantics — bad manifests fail during CLI
 *   boot rather than at publish time when files are already partially
 *   written.
 */

import path from "node:path";

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import { DuplicatePublishableTagError } from "../errors/duplicate-tag.error";
import { InvalidPublishableEntryError } from "../errors/invalid-publishable-entry.error";

import type { IPublishableFile, IPublishableRegistryEntry, Type } from "@stackra/contracts";

/**
 * The workspace-wide publishable registry.
 *
 * Every publishable entry — regardless of which package's module
 * declared it — lands here. `vendor:publish` reads the registry, matches
 * `--tag=<tag>` against known entries, and executes the copy/render for
 * each match.
 *
 * The registry does aggressive validation at `register` time so bad
 * manifests fail during CLI boot rather than at publish time when files
 * are already partially written.
 *
 * @example
 * ```typescript
 * const registry = app.get(PublishableRegistry);
 * const entry = registry.byTag('routing-config');
 * const every = registry.all();
 * ```
 */
@Injectable()
export class PublishableRegistry extends BaseRegistry<string, IPublishableRegistryEntry> {
  /**
   * Kebab-case-shape validator for tags. Accepts lowercase letters,
   * digits, and hyphens; must start with a letter; must contain at
   * least one hyphen segment separator (e.g. `routing-config` — not
   * `routing`). The hyphen requirement keeps tags namespaced so a
   * casual `--tag=config` can never match every "config" publisher.
   */
  private static readonly TAG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;

  /**
   * Track the source-module name for the next thrown duplicate error.
   * Same pattern as {@link CommandRegistry} — set right before the
   * delegating call to `super.register`, consumed by
   * {@link makeDuplicateError}, always reset in the `finally` block.
   */
  private pendingDuplicateSourceName: string | null = null;

  /**
   * Register a new publishable entry.
   *
   * Validates the entry fully before delegating to the base's strict
   * `register` so partial state is impossible — the registry is
   * either empty for this tag or has the full validated entry.
   *
   * @param entry - The publishable manifest to register (already
   *   normalized by `PublishableConsumer` — `packageRoot` is
   *   guaranteed non-empty and every `files[]` entry has both `from`
   *   and `to`).
   * @param sourceModule - The module class that owns this entry (for
   *   diagnostics). Pass `null` when registering from a non-module
   *   surface (e.g. a test fixture).
   * @throws {InvalidPublishableEntryError} When the entry violates any
   *   shape rule (bad tag, empty files, absolute `from`, ...).
   * @throws {DuplicatePublishableTagError} When the tag is already
   *   registered by another module.
   */
  public override register(
    entry: Omit<IPublishableRegistryEntry, "sourceModule">,
    sourceModule?: Type<unknown> | null,
  ): this;
  public override register(key: string, value: IPublishableRegistryEntry): this;
  public override register(
    ...args:
      | [Omit<IPublishableRegistryEntry, "sourceModule">, (Type<unknown> | null)?]
      | [string, IPublishableRegistryEntry]
  ): this {
    // Normalize both overloads to `(entry, sourceModule)` — the
    // domain-specific entry-based form is what every real caller
    // uses; the (key, value) form is kept for BaseRegistry contract
    // compatibility (call sites in future generic loaders).
    let entry: Omit<IPublishableRegistryEntry, "sourceModule">;
    let sourceModule: Type<unknown> | null;

    if (typeof args[0] === "string") {
      // BaseRegistry-shaped call: (key, value). The `value` already
      // carries `sourceModule` inside (per IPublishableRegistryEntry),
      // so we destructure to hand-off to the validation flow below.
      const value = args[1] as IPublishableRegistryEntry;
      const { sourceModule: sm, ...rest } = value;

      entry = rest;
      sourceModule = sm ?? null;
    } else {
      entry = args[0];
      sourceModule = (args[1] ?? null) as Type<unknown> | null;
    }

    const sourceName = sourceModule?.name ?? "an-unnamed-source (sourceModule was null)";

    // ── Tag validation ───────────────────────────────────────────────
    if (typeof entry.tag !== "string" || entry.tag.length === 0) {
      throw new InvalidPublishableEntryError("tag", "must be a non-empty string", sourceName);
    }
    if (!PublishableRegistry.TAG_PATTERN.test(entry.tag)) {
      throw new InvalidPublishableEntryError(
        "tag",
        `"${entry.tag}" must be kebab-case with at least one hyphen ` +
          `(e.g. "routing-config", "queue-stubs"); got "${entry.tag}"`,
        sourceName,
      );
    }

    // ── packageRoot validation ───────────────────────────────────────
    // Consumer normalization has already tried to fill this in from
    // the module's `public static readonly PACKAGE_ROOT`. If it's still
    // empty at this point, the module forgot both entry.packageRoot AND
    // the static — point the author at the static-property pattern.
    if (typeof entry.packageRoot !== "string" || entry.packageRoot.length === 0) {
      throw new InvalidPublishableEntryError(
        "packageRoot",
        `no packageRoot supplied and ${sourceName} does not expose a ` +
          `\`public static readonly PACKAGE_ROOT\` property. Add one:\n\n` +
          `    import { Path } from "@stackra/support";\n\n` +
          `    export class ${sourceName} {\n` +
          `      public static readonly PACKAGE_ROOT =\n` +
          `        Path.packageRoot(import.meta.url);\n` +
          `      // ...\n` +
          `    }\n\n` +
          `The consumer auto-reads it so every .publish(entry) call can ` +
          `omit \`packageRoot\``,
        sourceName,
      );
    }
    if (!path.isAbsolute(entry.packageRoot)) {
      throw new InvalidPublishableEntryError(
        "packageRoot",
        `must be an absolute path (typically resolved from import.meta.url); ` +
          `got "${entry.packageRoot}"`,
        sourceName,
      );
    }

    // ── files validation ─────────────────────────────────────────────
    if (!Array.isArray(entry.files) || entry.files.length === 0) {
      throw new InvalidPublishableEntryError(
        "files",
        "must be a non-empty array; a publishable with zero files is meaningless",
        sourceName,
      );
    }
    // Loop var typed as IPublishableFile — TS overload-tuple narrowing
    // widens `args[0]` via `entry`, so we annotate to keep `.from` and
    // `.to` typed instead of falling to `any`.
    for (const file of entry.files as readonly IPublishableFile[]) {
      if (typeof file.from !== "string" || file.from.length === 0) {
        throw new InvalidPublishableEntryError(
          "files[].from",
          "every file must have a non-empty `from`",
          sourceName,
        );
      }
      if (path.isAbsolute(file.from)) {
        throw new InvalidPublishableEntryError(
          "files[].from",
          `"${file.from}" is absolute — packages may only publish files ` +
            `inside their own tree, so \`from\` must be relative to \`packageRoot\``,
          sourceName,
        );
      }
      if (typeof file.to !== "string" || file.to.length === 0) {
        throw new InvalidPublishableEntryError(
          "files[].to",
          "every file must have a non-empty `to`",
          sourceName,
        );
      }
    }

    // ── Delegate to BaseRegistry's strict register ──────────────────
    // The base handles duplicate detection and Map insertion. Our
    // `makeDuplicateError` override reads `pendingDuplicateSourceName`
    // to throw the domain-specific `DuplicatePublishableTagError`.
    this.pendingDuplicateSourceName = sourceName;
    try {
      return super.register(entry.tag, { ...entry, sourceModule });
    } finally {
      this.pendingDuplicateSourceName = null;
    }
  }

  /**
   * Look up a publishable by tag.
   *
   * Domain-readable alias for {@link BaseRegistry.get} — reads
   * naturally at call-sites like `registry.byTag('routing-config')`.
   *
   * @param tag - The tag to resolve.
   * @returns The registry entry or `undefined` when no publisher
   *   claimed that tag.
   */
  public byTag(tag: string): IPublishableRegistryEntry | undefined {
    return this.get(tag);
  }

  /**
   * Every registered entry in insertion order.
   *
   * Domain-readable alias for {@link BaseRegistry.values}.
   * `vendor:publish` uses this for the interactive multi-select picker
   * and for `--all`. Order is stable across invocations (matches module
   * initialisation order) so operator muscle memory stays intact.
   *
   * @returns A fresh array — mutation is a no-op on the registry.
   */
  public all(): readonly IPublishableRegistryEntry[] {
    return this.values();
  }

  /**
   * Total number of registered publishables — useful for empty-state
   * detection in the command handler.
   *
   * Domain-readable alias for {@link BaseRegistry.count}.
   *
   * @returns Count of registered entries.
   */
  public size(): number {
    return this.count();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BaseRegistry error-factory override
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Factory hook — produces the domain-specific error thrown when a
   * publishable tag collides. Reads the existing entry from the map
   * to name both offenders in the error message.
   *
   * @param key - The colliding publishable tag.
   * @returns A ready-to-throw {@link DuplicatePublishableTagError}.
   */
  protected override makeDuplicateError(key: string): Error {
    const existing = this.get(key);

    return new DuplicatePublishableTagError(
      key,
      existing?.sourceModule?.name ?? "an earlier-registered source",
      this.pendingDuplicateSourceName ?? "an-unnamed-second-source",
    );
  }
}
