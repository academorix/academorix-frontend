/**
 * @file widget-cohort.registry.ts
 * @module @stackra/dashboard/core/registries
 * @description Central registry for every widget cohort — one entry
 *   per cohort key.
 *
 *   Extends {@link BaseRegistry} for the strict-register semantics
 *   and layers cohort-specific validation on top: kebab-case key
 *   shape (via {@link COHORT_KEY_PATTERN}) + non-empty `label` /
 *   `description` / `icon`.
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import { COHORT_KEY_PATTERN } from "@/core/constants/widget-key-pattern.constants";
import { DuplicateWidgetCohortError } from "@/core/errors/duplicate-widget-cohort.error";
import { InvalidWidgetMetadataError } from "@/core/errors/invalid-widget-metadata.error";
import type { IWidgetCohortEntry } from "@/core/interfaces/widget-cohort-entry.interface";

/**
 * Singleton registry for cohort buckets. `WidgetCatalogueService`
 * seeds this with {@link DEFAULT_WIDGET_COHORTS} on `onModuleInit`;
 * feature modules can contribute additional cohorts via
 * `DashboardModule.forFeature({ cohorts })` or by injecting the
 * catalogue service directly.
 *
 * @example
 * ```typescript
 * const cohorts = app.get(WidgetCohortRegistry);
 * const numbers = cohorts.get("numbers");
 * const every = cohorts.values();
 * ```
 */
@Injectable()
export class WidgetCohortRegistry extends BaseRegistry<string, IWidgetCohortEntry> {
  /**
   * Register a cohort entry.
   *
   * @throws {InvalidWidgetMetadataError} When the entry fails any
   *   shape check (bad key, empty label / description / icon).
   * @throws {DuplicateWidgetCohortError} When another entry already
   *   owns `entry.key`.
   */
  public override register(entry: IWidgetCohortEntry): this;
  public override register(key: string, value: IWidgetCohortEntry): this;
  public override register(...args: [IWidgetCohortEntry] | [string, IWidgetCohortEntry]): this {
    // Normalise both overloads to `(key, entry)` — the entry-based
    // form is the canonical one; the (key, value) form preserves
    // BaseRegistry contract compatibility.
    const [key, entry] = args.length === 1 ? [args[0].key, args[0]] : [args[0], args[1]];

    this.validate(key, entry);
    return super.register(key, entry);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BaseRegistry error-factory override
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Factory hook — produces the domain-specific error thrown when
   * a cohort key collides.
   *
   * @param key - The colliding cohort key.
   * @returns A ready-to-throw {@link DuplicateWidgetCohortError}.
   */
  protected override makeDuplicateError(key: string): Error {
    return new DuplicateWidgetCohortError(key);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Validate the incoming cohort entry.
   */
  private validate(key: string, entry: IWidgetCohortEntry): void {
    if (typeof key !== "string" || key.length === 0) {
      throw new InvalidWidgetMetadataError("key", "must be a non-empty string");
    }
    if (!COHORT_KEY_PATTERN.test(key)) {
      throw new InvalidWidgetMetadataError(
        "key",
        `"${key}" must be kebab-case (lowercase letters, digits, hyphens) ` +
          `and start with a letter`,
      );
    }
    if (typeof entry.label !== "string" || entry.label.length === 0) {
      throw new InvalidWidgetMetadataError("label", "must be a non-empty string", key);
    }
    if (typeof entry.description !== "string" || entry.description.length === 0) {
      throw new InvalidWidgetMetadataError("description", "must be a non-empty string", key);
    }
    if (typeof entry.icon !== "string" || entry.icon.length === 0) {
      throw new InvalidWidgetMetadataError("icon", "must be a non-empty string", key);
    }
  }
}
