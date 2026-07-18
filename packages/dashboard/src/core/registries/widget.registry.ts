/**
 * @file widget.registry.ts
 * @module @stackra/dashboard/core/registries
 * @description Central registry for every widget the container
 *   discovered — one entry per catalogue key.
 *
 *   Extends {@link BaseRegistry} from `@stackra/support` for the
 *   Map-backed storage + strict-register semantics, and layers
 *   widget-specific validation on top:
 *
 *   - Kebab-case key shape (via {@link WIDGET_KEY_PATTERN}).
 *   - `metadata.title` + `metadata.description` non-empty.
 *   - `metadata.cohort` non-empty.
 *   - `metadata.span` restricted to the three canonical values.
 *
 *   Cross-registry checks (does the referenced cohort actually
 *   exist?) intentionally live in {@link WidgetCatalogueService},
 *   not here — keeping registries pure means a single test can
 *   assert the registry's own contract without hauling in a cohort
 *   registry.
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import { WIDGET_KEY_PATTERN } from "@/core/constants/widget-key-pattern.constants";
import { DuplicateWidgetKeyError } from "@/core/errors/duplicate-widget-key.error";
import { InvalidWidgetMetadataError } from "@/core/errors/invalid-widget-metadata.error";
import type { IRegisteredWidget } from "@/core/interfaces/registered-widget.interface";

/** Legal values for `IWidgetMetadata.span`. */
const VALID_SPANS: readonly string[] = ["full", "half", "third"];

/**
 * Singleton registry for `@Widget()`-decorated widgets discovered by
 * the {@link WidgetLoader}.
 *
 * Registration is entry-based — the map key is derived from
 * `entry.metadata.key` so consumers can hand a single object to
 * `register(entry)` instead of duplicating the key at the call site.
 * A `(key, entry)` overload is kept for BaseRegistry contract
 * compatibility (future generic loaders may call the base signature).
 *
 * @example
 * ```typescript
 * const registry = app.get(WidgetRegistry);
 * const kpiEntry = registry.get("kpi-athletes");
 * const every = registry.values();
 * ```
 */
@Injectable()
export class WidgetRegistry extends BaseRegistry<string, IRegisteredWidget> {
  /**
   * Track the "second offender" class name for the next duplicate
   * error. Set inside {@link register} right before the delegating
   * `super.register(...)` call, consumed by {@link makeDuplicateError},
   * always reset in the `finally` block so a stray subsequent
   * duplicate can't leak the wrong context.
   */
  private pendingDuplicateSourceName: string | null = null;

  /**
   * Register a widget entry.
   *
   * The entry-based overload is the canonical form — most call
   * sites read `registry.register(entry)`, mirroring the console
   * package's `CommandRegistry`. The `(key, value)` overload exists
   * for BaseRegistry contract compatibility only.
   *
   * @throws {InvalidWidgetMetadataError} When the entry fails any
   *   shape check (bad key, empty title / description / cohort,
   *   unknown span).
   * @throws {DuplicateWidgetKeyError} When another entry already
   *   owns `entry.metadata.key`.
   */
  public override register(entry: IRegisteredWidget): this;
  public override register(key: string, value: IRegisteredWidget): this;
  public override register(...args: [IRegisteredWidget] | [string, IRegisteredWidget]): this {
    // Normalise both overloads to `(key, entry)` — the 1-arg form
    // pulls the key from `entry.metadata.key`; the 2-arg form
    // preserves the BaseRegistry contract for callers that already
    // hold the key separately.
    const [key, entry] = args.length === 1 ? [args[0].metadata.key, args[0]] : [args[0], args[1]];

    // ── Shape validation ───────────────────────────────────────
    // Runs before the base's strict-register so partial state is
    // impossible — the registry is either empty for this key or
    // has the fully-validated entry.
    this.validate(key, entry);

    // Stash the second-offender name so `makeDuplicateError` can
    // weave it into the error alongside the existing entry's class
    // name (BaseRegistry only hands the KEY to the factory hook).
    this.pendingDuplicateSourceName = entry.classRef.name;
    try {
      return super.register(key, entry);
    } finally {
      // Belt-and-suspenders — a subsequent unrelated register
      // must never inherit the stale context.
      this.pendingDuplicateSourceName = null;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BaseRegistry error-factory override
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Factory hook — produces the domain-specific error thrown when
   * a widget key collides. Reads the existing entry from the map to
   * name both offenders in the error message.
   *
   * @param key - The colliding catalogue key.
   * @returns A ready-to-throw {@link DuplicateWidgetKeyError}.
   */
  protected override makeDuplicateError(key: string): Error {
    const existing = this.get(key);

    return new DuplicateWidgetKeyError(
      key,
      existing?.classRef.name ?? "an-unnamed-existing-widget",
      this.pendingDuplicateSourceName ?? "an-unnamed-second-source",
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Validate every shape rule that doesn't require another
   * registry. Cross-registry rules (referenced cohort exists) fire
   * at the orchestrator layer instead.
   */
  private validate(key: string, entry: IRegisteredWidget): void {
    // Empty / non-string key — normally caught by the decorator,
    // but we double-check for direct-`register` callers (tests).
    if (typeof key !== "string" || key.length === 0) {
      throw new InvalidWidgetMetadataError("key", "must be a non-empty string");
    }
    if (!WIDGET_KEY_PATTERN.test(key)) {
      throw new InvalidWidgetMetadataError(
        "key",
        `"${key}" must be kebab-case (lowercase letters, digits, hyphens) ` +
          `and start with a letter`,
      );
    }

    const meta = entry.metadata;
    if (typeof meta.title !== "string" || meta.title.length === 0) {
      throw new InvalidWidgetMetadataError("title", "must be a non-empty string", key);
    }
    if (typeof meta.description !== "string" || meta.description.length === 0) {
      throw new InvalidWidgetMetadataError("description", "must be a non-empty string", key);
    }
    if (typeof meta.cohort !== "string" || meta.cohort.length === 0) {
      throw new InvalidWidgetMetadataError("cohort", "must be a non-empty string", key);
    }
    if (!VALID_SPANS.includes(meta.span)) {
      throw new InvalidWidgetMetadataError(
        "span",
        `must be one of ${VALID_SPANS.join(", ")}; got "${String(meta.span)}"`,
        key,
      );
    }
  }
}
