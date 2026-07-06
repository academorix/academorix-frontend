/**
 * @file access-control-provider.test.ts
 * @module providers/access-control/access-control-provider.test
 *
 * @description
 * Unit tests for the Refine {@link accessControlProvider} `can` decision. The
 * provider reads permissions from the shared in-memory session cache, so each
 * test seeds it with {@link setCurrentIdentity} and resets it to `null` in
 * `beforeEach` to stay deterministic. Covers the day-1 posture (superuser
 * wildcard, fail-open bootstrap), the Refine action -> ability mapping, and the
 * `resource.ability` grant check.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { accessControlProvider } from "@/providers/access-control/access-control-provider";
import { setCurrentIdentity } from "@/providers/auth/session";
import { makeIdentity } from "@/test/fixtures";

const { can } = accessControlProvider;

beforeEach(() => {
  // Clear the module-scoped session cache between tests.
  setCurrentIdentity(null);
});

describe("accessControlProvider.can", () => {
  it("allows any resource/action for a superuser ('*')", async () => {
    setCurrentIdentity(makeIdentity({ permissions: ["*"] }));

    await expect(can({ resource: "invoices", action: "delete" })).resolves.toEqual({ can: true });
    await expect(can({ resource: "athletes", action: "list" })).resolves.toEqual({ can: true });
    await expect(can({ resource: "anything", action: "create" })).resolves.toEqual({ can: true });
  });

  it("allows a granted resource and denies an ungranted one", async () => {
    setCurrentIdentity(makeIdentity({ permissions: ["athletes.viewAny"] }));

    await expect(can({ resource: "athletes", action: "list" })).resolves.toEqual({ can: true });

    const denied = await can({ resource: "invoices", action: "list" });

    expect(denied.can).toBe(false);
    expect(denied.reason).toContain("invoices.viewAny");
  });

  it("fails open when the permission set is empty (bootstrap)", async () => {
    setCurrentIdentity(makeIdentity({ permissions: [] }));

    await expect(can({ resource: "invoices", action: "list" })).resolves.toEqual({ can: true });
  });

  it("fails open when there is no identity at all", async () => {
    // No setCurrentIdentity call -> beforeEach left it null.
    await expect(can({ resource: "invoices", action: "delete" })).resolves.toEqual({ can: true });
  });

  it("maps Refine actions to permission abilities (edit->update, show->view, list->viewAny)", async () => {
    setCurrentIdentity(makeIdentity({ permissions: ["courses.update", "courses.view"] }));

    // edit -> courses.update (granted)
    await expect(can({ resource: "courses", action: "edit" })).resolves.toEqual({ can: true });
    // show -> courses.view (granted)
    await expect(can({ resource: "courses", action: "show" })).resolves.toEqual({ can: true });
    // list -> courses.viewAny (NOT granted)
    expect((await can({ resource: "courses", action: "list" })).can).toBe(false);
    // delete -> courses.delete (NOT granted)
    expect((await can({ resource: "courses", action: "delete" })).can).toBe(false);
  });

  it("maps both create and clone to the '.create' ability", async () => {
    setCurrentIdentity(makeIdentity({ permissions: ["teams.create"] }));

    await expect(can({ resource: "teams", action: "create" })).resolves.toEqual({ can: true });
    await expect(can({ resource: "teams", action: "clone" })).resolves.toEqual({ can: true });
  });

  it("falls back to the raw action when it is not in the ability map", async () => {
    setCurrentIdentity(makeIdentity({ permissions: ["reports.export"] }));

    // "export" has no mapping, so the permission is "reports.export" verbatim.
    await expect(can({ resource: "reports", action: "export" })).resolves.toEqual({ can: true });
  });

  it("allows an action that carries no resource", async () => {
    setCurrentIdentity(makeIdentity({ permissions: ["athletes.viewAny"] }));

    await expect(can({ action: "list" })).resolves.toEqual({ can: true });
  });
});
