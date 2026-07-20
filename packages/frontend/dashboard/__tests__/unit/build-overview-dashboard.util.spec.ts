/**
 * @file build-overview-dashboard.util.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for the Overview + Analytics built-in
 *   dashboard builders.
 */

import { describe, expect, it } from "vitest";

import {
  BUILT_IN_ANALYTICS_ID,
  BUILT_IN_OVERVIEW_ID,
} from "@/core/constants/built-in-dashboards.constants";
import { buildAnalyticsDashboard } from "@/core/utils/build-analytics-dashboard.util";
import { buildOverviewDashboard } from "@/core/utils/build-overview-dashboard.util";

// Every widget lands at `third` span so the layout math is
// predictable — 4 widgets fit in a 12-col row.
const spanFor = (): "third" => "third";

describe("buildOverviewDashboard", () => {
  it("pins to the canonical built-in id + slug", () => {
    const dashboard = buildOverviewDashboard("user-1", "tenant-1", spanFor);

    expect(dashboard.id).toBe(BUILT_IN_OVERVIEW_ID);
    expect(dashboard.slug).toBe("overview");
    expect(dashboard.isBuiltIn).toBe(true);
    expect(dashboard.isDefault).toBe(true);
    expect(dashboard.isPinned).toBe(true);
  });

  it("carries the passed owner + tenant ids", () => {
    const dashboard = buildOverviewDashboard("user-42", "tenant-42", spanFor);

    expect(dashboard.ownerId).toBe("user-42");
    expect(dashboard.tenantId).toBe("tenant-42");
  });

  it("emits deterministic widget ids per owner + key", () => {
    const first = buildOverviewDashboard("user-1", "tenant-1", spanFor);
    const second = buildOverviewDashboard("user-1", "tenant-1", spanFor);

    expect(first.widgets.map((entry) => entry.id)).toEqual(second.widgets.map((entry) => entry.id));
  });

  it("emits one layout entry per widget at every breakpoint", () => {
    const dashboard = buildOverviewDashboard("user-1", "tenant-1", spanFor);

    for (const bp of ["lg", "md", "sm"] as const) {
      expect(dashboard.layouts[bp]).toHaveLength(dashboard.widgets.length);
    }
  });
});

describe("buildAnalyticsDashboard", () => {
  it("pins to the canonical analytics id + slug", () => {
    const dashboard = buildAnalyticsDashboard("user-1", "tenant-1", spanFor);

    expect(dashboard.id).toBe(BUILT_IN_ANALYTICS_ID);
    expect(dashboard.slug).toBe("analytics");
    expect(dashboard.isBuiltIn).toBe(true);
    // Analytics is never the user's default — Overview owns that flag.
    expect(dashboard.isDefault).toBe(false);
  });
});
