/**
 * @file create-widget-instance-fixture.util.ts
 * @module @stackra/dashboard/testing/utils
 * @description Factory for a {@link IWidgetInstance} fixture with sane
 *   defaults.
 */

import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";

/**
 * Build a widget instance for use in tests.
 *
 * @param overrides - Partial overrides layered on the defaults.
 * @returns A widget instance fixture.
 */
export function createWidgetInstanceFixture(
  overrides: Partial<IWidgetInstance> = {},
): IWidgetInstance {
  return {
    id: "test-widget-instance",
    widgetType: "kpi-athletes",
    ...overrides,
  };
}
