/**
 * @file create-dashboard-fixture.util.ts
 * @module @stackra/dashboard/testing/utils
 * @description Factory for a fully-formed {@link IDashboard} — every
 *   field defaulted so tests only supply overrides that matter to
 *   their case.
 */

import type { IDashboard } from "@/core/interfaces/dashboard.interface";

/**
 * Build a fully-formed {@link IDashboard} for use in tests.
 *
 * @param overrides - Partial overrides layered on top of the defaults.
 * @returns A ready-to-use dashboard fixture.
 */
export function createDashboardFixture(overrides: Partial<IDashboard> = {}): IDashboard {
  const timestamp = "1970-01-01T00:00:00.000Z";

  return {
    id: "test-dashboard-id",
    tenantId: "test-tenant",
    ownerId: "test-user",
    name: "Test Dashboard",
    slug: "test-dashboard",
    icon: "square-check",
    visibility: "private",
    shareLevel: "private",
    isPinned: false,
    isDefault: false,
    isBuiltIn: false,
    layoutMode: "grid",
    density: "cozy",
    layouts: { lg: [], md: [], sm: [] },
    widgets: [],
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}
