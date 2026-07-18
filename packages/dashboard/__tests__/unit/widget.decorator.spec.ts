/**
 * @file widget.decorator.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for the {@link Widget} class decorator.
 *
 *   Verifies:
 *   - The metadata is stamped at the {@link WIDGET_METADATA_KEY}.
 *   - `readWidgetMetadata(x)` + `hasWidget(x)` round-trip the same
 *     value.
 *   - Malformed keys throw {@link InvalidWidgetMetadataError} at
 *     decoration time — before the class ever reaches the container.
 */

import { describe, expect, it } from "vitest";

import {
  BaseWidget,
  hasWidget,
  InvalidWidgetMetadataError,
  readWidgetMetadata,
  Widget,
} from "@/core";
import type { IWidgetRendererContext } from "@/core/interfaces/widget-renderer-context.interface";

describe("@Widget decorator", () => {
  it("stamps metadata that reads back via readWidgetMetadata", () => {
    @Widget({
      key: "kpi-athletes",
      cohort: "numbers",
      title: "Athletes",
      description: "Total active athletes across every branch.",
      icon: "person",
      span: "third",
      defaultEnabled: true,
    })
    class KpiAthletesWidget extends BaseWidget {
      public render(_context: IWidgetRendererContext): null {
        return null;
      }
    }

    const metadata = readWidgetMetadata(KpiAthletesWidget);

    expect(metadata).toEqual({
      key: "kpi-athletes",
      cohort: "numbers",
      title: "Athletes",
      description: "Total active athletes across every branch.",
      icon: "person",
      span: "third",
      defaultEnabled: true,
    });
  });

  it("hasWidget returns true for a decorated class and false for a plain one", () => {
    @Widget({
      key: "kpi-events",
      cohort: "numbers",
      title: "Events",
      description: "Upcoming events across the network.",
      icon: "calendar",
      span: "third",
    })
    class KpiEventsWidget extends BaseWidget {
      public render(): null {
        return null;
      }
    }

    class NotAWidget {}

    expect(hasWidget(KpiEventsWidget)).toBe(true);
    expect(hasWidget(NotAWidget)).toBe(false);
  });

  it.each([
    ["Kpi-Athletes"],
    ["kpi_athletes"],
    ["1kpi"],
    ["-kpi"],
    ["kpi--athletes"],
    [""],
  ])("throws InvalidWidgetMetadataError on the malformed key '%s'", (badKey) => {
    // Wrap in a function so the decorator error surfaces via
    // `.toThrow(...)` rather than at test-collection time.
    const decorate = () => {
      @Widget({
        key: badKey,
        cohort: "numbers",
        title: "T",
        description: "D",
        icon: "square",
        span: "third",
      })
      class BadWidget extends BaseWidget {
        public render(): null {
          return null;
        }
      }
      return BadWidget;
    };

    expect(decorate).toThrow(InvalidWidgetMetadataError);
  });
});
