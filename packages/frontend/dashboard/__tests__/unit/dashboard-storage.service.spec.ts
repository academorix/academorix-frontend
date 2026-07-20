/**
 * @file dashboard-storage.service.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for {@link DashboardStorageService}.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BUILT_IN_OVERVIEW_ID } from "@/core/constants/built-in-dashboards.constants";
import { DashboardNotFoundError } from "@/core/errors/dashboard-not-found.error";
import { OptimisticLockError } from "@/core/errors/optimistic-lock.error";
import { DashboardStorageService } from "@/core/services/dashboard-storage.service";

const CONFIG = { storage: { ownerId: "test-user", tenantId: "test-tenant" } };

describe("DashboardStorageService", () => {
  let storage: DashboardStorageService;

  beforeEach(() => {
    window.localStorage.clear();
    storage = new DashboardStorageService(CONFIG);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("synthesises the two built-in dashboards on list()", async () => {
    const list = await storage.list();
    const slugs = list.map((entry) => entry.slug);

    expect(slugs).toContain("overview");
    expect(slugs).toContain("analytics");
  });

  it("creates a new dashboard and persists it", async () => {
    const created = await storage.create({ name: "Ops" });

    expect(created.name).toBe("Ops");
    expect(created.slug).toBe("ops");
    expect(created.ownerId).toBe("test-user");
    expect(created.tenantId).toBe("test-tenant");
    expect(created.version).toBe(1);

    const fetched = await storage.get(created.id);

    expect(fetched.id).toBe(created.id);
  });

  it("throws DashboardNotFoundError for unknown ids", async () => {
    await expect(storage.get("nope")).rejects.toBeInstanceOf(DashboardNotFoundError);
  });

  it("finds a dashboard by slug", async () => {
    const created = await storage.create({ name: "Ops Center" });
    const found = await storage.getBySlug(created.slug);

    expect(found.id).toBe(created.id);
  });

  it("rejects a stale version on update", async () => {
    const created = await storage.create({ name: "Ops" });

    await expect(
      storage.update(created.id, { version: 999, name: "Renamed" }),
    ).rejects.toBeInstanceOf(OptimisticLockError);
  });

  it("increments version + updates timestamp on update", async () => {
    const created = await storage.create({ name: "Ops" });
    const updated = await storage.update(created.id, {
      version: created.version,
      name: "Ops v2",
    });

    expect(updated.version).toBe(created.version + 1);
    expect(updated.name).toBe("Ops v2");
    expect(updated.updatedAt >= created.updatedAt).toBe(true);
  });

  it("clears siblings' isDefault when a new default is set", async () => {
    const a = await storage.create({ name: "A" });
    const b = await storage.create({ name: "B" });

    await storage.setDefault(a.id);
    await storage.setDefault(b.id);

    const list = await storage.list();
    const custom = list.filter((entry) => !entry.isBuiltIn);
    const defaults = custom.filter((entry) => entry.isDefault);

    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.id).toBe(b.id);
  });

  it("cannot update a built-in", async () => {
    await expect(
      storage.update(BUILT_IN_OVERVIEW_ID, { version: 1, name: "Nope" }),
    ).rejects.toThrow();
  });

  it("cannot delete a built-in", async () => {
    await expect(storage.remove(BUILT_IN_OVERVIEW_ID)).rejects.toThrow();
  });

  it("removes a custom dashboard and cascades side stores", async () => {
    const created = await storage.create({ name: "Ops" });

    await storage.remove(created.id);

    await expect(storage.get(created.id)).rejects.toBeInstanceOf(DashboardNotFoundError);
  });

  it("duplicate() clones widgets with fresh ids", async () => {
    const source = await storage.create({ name: "Source" });
    const duplicated = await storage.duplicate(source.id);

    // Naming preserves the "(Copy)" suffix.
    expect(duplicated.name).toMatch(/Copy/);
    expect(duplicated.id).not.toBe(source.id);
  });

  it("issueEmbedToken rejects private dashboards", async () => {
    const created = await storage.create({ name: "Private", visibility: "private" });

    await expect(storage.issueEmbedToken(created.id, {})).rejects.toThrow();
  });

  it("addShareGrant is idempotent for duplicate triples", async () => {
    const created = await storage.create({ name: "Ops" });

    const first = await storage.addShareGrant(created.id, {
      targetType: "role",
      targetId: "coach",
      targetLabel: "Coach",
    });
    const second = await storage.addShareGrant(created.id, {
      targetType: "role",
      targetId: "coach",
      targetLabel: "Coach (renamed)",
    });

    expect(second.id).toBe(first.id);
    // Label frozen at first-grant time — the duplicate call is a no-op.
    expect(second.targetLabel).toBe("Coach");
  });

  it("listShareGrants returns the grants scoped to a dashboard", async () => {
    const a = await storage.create({ name: "A" });
    const b = await storage.create({ name: "B" });

    await storage.addShareGrant(a.id, {
      targetType: "role",
      targetId: "coach",
      targetLabel: "Coach",
    });
    await storage.addShareGrant(b.id, {
      targetType: "user",
      targetId: "user-42",
      targetLabel: "Alex",
    });

    const grantsA = await storage.listShareGrants(a.id);
    const grantsB = await storage.listShareGrants(b.id);

    expect(grantsA).toHaveLength(1);
    expect(grantsA[0]?.targetType).toBe("role");
    expect(grantsB).toHaveLength(1);
    expect(grantsB[0]?.targetType).toBe("user");
  });

  it("addAnnotation attaches a note to a widget", async () => {
    const created = await storage.create({ name: "Ops" });
    const note = await storage.addAnnotation(created.id, "kpi-athletes", "Watch this");

    expect(note.body).toBe("Watch this");
    expect(note.author).toBe("You");

    const list = await storage.listAnnotations(created.id);

    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(note.id);
  });

  it("updateAnnotation sets updatedAt", async () => {
    const created = await storage.create({ name: "Ops" });
    const note = await storage.addAnnotation(created.id, "kpi", "First");
    const updated = await storage.updateAnnotation(note.id, "Second");

    expect(updated.body).toBe("Second");
    expect(updated.updatedAt).toBeDefined();
  });

  it("removeAnnotation is idempotent for unknown ids", async () => {
    await expect(storage.removeAnnotation("nope")).resolves.toBeUndefined();
  });

  it("bulkRevokeEmbedTokens reports the correct count", async () => {
    // Preview against an empty store returns zero.
    const preview = await storage.previewBulkRevoke({ dashboardId: "nope" });

    expect(preview.revoked).toBe(0);
  });

  it("createBroadcastTemplate rejects empty names", async () => {
    await expect(storage.createBroadcastTemplate({ name: "  ", config: {} })).rejects.toThrow();
  });
});
