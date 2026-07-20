/**
 * @file widget.decorator.ts
 * @module @stackra/dashboard/core/decorators
 * @description Class decorator that stamps `@Widget()` metadata for
 *   auto-discovery by the {@link WidgetLoader}.
 *
 *   Same pattern as `@Command()` in `@stackra/console` — the decorator
 *   itself does the minimum: validates key shape at decoration time
 *   so a bad key crashes at class-load rather than at register-time,
 *   applies `@Injectable()` so the container will resolve the class,
 *   and defines the metadata via `@vivtel/metadata`. Every other
 *   validation (title / description non-empty, cohort exists) is
 *   done at register-time inside the registry — decoration is the
 *   wrong place for cross-registry checks because the DI graph
 *   hasn't been built yet.
 */

import { Injectable } from "@stackra/container";
import { defineMetadata } from "@vivtel/metadata";

import { WIDGET_KEY_PATTERN } from "@/core/constants/widget-key-pattern.constants";
import { WIDGET_METADATA_KEY } from "@/core/constants/widget-metadata-key.constants";
import { InvalidWidgetMetadataError } from "@/core/errors/invalid-widget-metadata.error";
import type { IWidgetMetadata } from "@/core/interfaces/widget-metadata.interface";

/**
 * Register a class as a dashboard widget.
 *
 * The decorated class MUST extend {@link BaseWidget} so the loader's
 * `instance instanceof BaseWidget` gate accepts it, and MUST supply a
 * kebab-case `key` — validated eagerly here so a malformed key never
 * reaches the runtime registry.
 *
 * The container's `@Injectable()` decorator is applied automatically
 * so consumers only need one decorator on the class definition.
 *
 * @param metadata - Widget metadata (key, cohort, title, description,
 *   icon, span, optional `defaultEnabled`).
 * @returns Class decorator that stamps the metadata + injectability
 *   marker.
 * @throws {InvalidWidgetMetadataError} When `metadata.key` is empty
 *   or fails the kebab-case shape.
 *
 * @example
 * ```tsx
 * import { BaseWidget, Widget } from "@stackra/dashboard";
 *
 * @Widget({
 *   key: "kpi-athletes",
 *   cohort: "numbers",
 *   title: "Athletes",
 *   description: "Total active athletes across every branch.",
 *   icon: "person",
 *   span: "third",
 *   defaultEnabled: true,
 * })
 * export class KpiAthletesWidget extends BaseWidget {
 *   public render(): ReactNode { return <KpiCard label="Athletes" value={42} />; }
 * }
 * ```
 */
export function Widget(metadata: IWidgetMetadata): ClassDecorator {
  // Fail-fast key shape validation at decoration time. Runs at
  // module-load — long before the container even sees the class —
  // so a typo surfaces on the very first import instead of the
  // first bootstrap.
  if (typeof metadata.key !== "string" || metadata.key.length === 0) {
    throw new InvalidWidgetMetadataError("key", "must be a non-empty string");
  }
  if (!WIDGET_KEY_PATTERN.test(metadata.key)) {
    throw new InvalidWidgetMetadataError(
      "key",
      `"${metadata.key}" must be kebab-case (lowercase letters, digits, hyphens) ` +
        `and start with a letter — e.g. "kpi-athletes", "chart-revenue-week"`,
    );
  }

  return (target) => {
    // Applying `@Injectable()` here removes the need for consumers to
    // stack two decorators on every widget class. Matches the
    // `@Command()` decorator's ergonomics.
    Injectable()(target);

    // Stamp the metadata so the discovery service can find this
    // class via `getProvidersByMetadata(WIDGET_METADATA_KEY)`.
    defineMetadata(WIDGET_METADATA_KEY, metadata, target);
  };
}
