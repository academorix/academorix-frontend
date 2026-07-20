/**
 * @file testing-mocks.test.ts
 * @module @stackra/monitoring/__tests__/unit
 * @description Verifies that `@stackra/monitoring/testing`'s
 *   `MockMonitoringManager` still implements the current public
 *   `IMonitoringManager` shape.
 */

import { describe, it, expect } from "vitest";
import type { IMonitoringManager, IMonitoringProvider } from "@stackra/contracts";

import { MockMonitoringManager, createMockMonitoringManager } from "@/testing";

describe("MockMonitoringManager", () => {
  it("records captures, breadcrumbs, and the bound user", async () => {
    const mock = createMockMonitoringManager();
    const err = new Error("boom");
    mock.captureException(err, { severity: "fatal" });
    mock.captureMessage("info", { severity: "info" });
    mock.addBreadcrumb({ message: "clicked", category: "ui.click" });
    mock.setUser({ id: "user-1" });
    await mock.flush();

    expect(mock.captures).toEqual([
      { kind: "exception", payload: err, context: { severity: "fatal" } },
      { kind: "message", payload: "info", context: { severity: "info" } },
    ]);
    expect(mock.breadcrumbs).toEqual([{ message: "clicked", category: "ui.click" }]);
    expect(mock.user).toEqual({ id: "user-1" });
  });

  it("register() appends to getProviders()", () => {
    const mock = new MockMonitoringManager();
    const provider: IMonitoringProvider = {
      name: "test",
      captureException: () => {},
    };
    mock.register(provider);
    expect(mock.getProviders()).toEqual([provider]);
  });

  it("conforms to IMonitoringManager", () => {
    const mock: IMonitoringManager = createMockMonitoringManager();
    expect(typeof mock.captureException).toBe("function");
    expect(typeof mock.captureMessage).toBe("function");
    expect(typeof mock.addBreadcrumb).toBe("function");
    expect(typeof mock.setUser).toBe("function");
    expect(typeof mock.flush).toBe("function");
    expect(typeof mock.register).toBe("function");
    expect(typeof mock.getProviders).toBe("function");
  });
});
