/**
 * @file widget-renderer.registry.ts
 * @module @stackra/dashboard/core/registries
 * @description Key → {@link WidgetRenderer} dispatch registry.
 *
 *   The renderer registry is intentionally the leanest of the three:
 *   it holds pure functions (`(context) => ReactNode`) and validates
 *   only the key format. Metadata + cohort validation happen in the
 *   sibling registries; a renderer just has to be a function.
 *
 *   Consumers write to this registry two ways:
 *
 *   1. **`@Widget()` + loader** — the loader binds
 *      `instance.render.bind(instance)` and calls `register(key, fn)`
 *      for every discovered widget class.
 *   2. **Direct `register()`** — plain function renderers that don't
 *      need a class or DI lifecycle (e.g. `() => <StaticCard />`).
 *      Feature modules pass them via
 *      `DashboardModule.forFeature({ renderers: [...] })`.
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import { WIDGET_KEY_PATTERN } from "@/core/constants/widget-key-pattern.constants";
import { DuplicateWidgetRendererError } from "@/core/errors/duplicate-widget-renderer.error";
import { InvalidWidgetMetadataError } from "@/core/errors/invalid-widget-metadata.error";
import type { WidgetRenderer } from "@/core/types/widget-renderer.type";

/**
 * Singleton registry for widget renderers.
 *
 * @example
 * ```typescript
 * const registry = app.get(WidgetRendererRegistry);
 * registry.register("kpi-athletes", () => <KpiCard label="Athletes" value={42} />);
 * const renderer = registry.get("kpi-athletes");
 * ```
 */
@Injectable()
export class WidgetRendererRegistry extends BaseRegistry<string, WidgetRenderer> {
  /**
   * Register a renderer for a catalogue key.
   *
   * Only the key shape is validated — the renderer itself is an
   * opaque function to the framework. If the intent really is to
   * override an earlier registration, callers reach for `replace()`
   * from the base class instead of `register()`.
   *
   * @throws {InvalidWidgetMetadataError} When the key isn't a
   *   kebab-case string.
   * @throws {DuplicateWidgetRendererError} When another renderer
   *   already owns this key.
   */
  public override register(key: string, value: WidgetRenderer): this {
    this.validateKey(key);
    return super.register(key, value);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BaseRegistry error-factory override
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Factory hook — produces the domain-specific error thrown when
   * a renderer key collides.
   *
   * @param key - The colliding widget key.
   * @returns A ready-to-throw {@link DuplicateWidgetRendererError}.
   */
  protected override makeDuplicateError(key: string): Error {
    return new DuplicateWidgetRendererError(key);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Enforce the kebab-case key shape. Runs on every `register` so a
   * consumer that side-steps `@Widget()` (a plain function renderer
   * for a static card, for example) can't smuggle in a malformed
   * key that would then break auto-layout keying.
   */
  private validateKey(key: string): void {
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
  }
}
