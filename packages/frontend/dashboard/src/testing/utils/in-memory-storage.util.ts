/**
 * @file in-memory-storage.util.ts
 * @module @stackra/dashboard/testing/utils
 * @description In-memory {@link IDashboardStorageAdapter} for tests.
 *   Every read + write hits a synchronous map — no localStorage, no
 *   crypto. Test suites can seed initial state via
 *   {@link IInMemoryDashboardStorageOptions.dashboards}.
 *
 *   The implementation stays intentionally simple and mirrors just
 *   the surfaces most tests exercise (list, get, create, update,
 *   remove). Share grants + versions + annotations + broadcast
 *   templates all short-circuit with empty defaults so the adapter
 *   satisfies the interface without duplicating the full playground
 *   behaviour.
 */

import type { IBroadcastTemplate } from "@/core/interfaces/broadcast-template.interface";
import type { IBroadcastViewLogRecord } from "@/core/interfaces/broadcast-view-log-record.interface";
import type { IBulkRevokeFilters } from "@/core/interfaces/bulk-revoke-filters.interface";
import type { IBulkRevokeResult } from "@/core/interfaces/bulk-revoke-result.interface";
import type { ICreateBroadcastTemplateInput } from "@/core/interfaces/create-broadcast-template-input.interface";
import type { ICreateDashboardInput } from "@/core/interfaces/create-dashboard-input.interface";
import type { ICreateShareGrantInput } from "@/core/interfaces/create-share-grant-input.interface";
import type { IDashboard } from "@/core/interfaces/dashboard.interface";
import type { IDashboardShareGrant } from "@/core/interfaces/dashboard-share-grant.interface";
import type { IDashboardStorageAdapter } from "@/core/interfaces/dashboard-storage-adapter.interface";
import type { IDashboardVersionSnapshot } from "@/core/interfaces/dashboard-version-snapshot.interface";
import type { IEmbedTokenRecord } from "@/core/interfaces/embed-token-record.interface";
import type { IIssuedEmbedToken } from "@/core/interfaces/issued-embed-token.interface";
import type { IIssueEmbedTokenInput } from "@/core/interfaces/issue-embed-token-input.interface";
import type { IPublicEmbedDashboard } from "@/core/interfaces/public-embed-dashboard.interface";
import type { IUnlockedEmbedSession } from "@/core/interfaces/unlocked-embed-session.interface";
import type { IUnlockEmbedTokenInput } from "@/core/interfaces/unlock-embed-token-input.interface";
import type { IUpdateDashboardInput } from "@/core/interfaces/update-dashboard-input.interface";
import type { IWidgetAnnotation } from "@/core/interfaces/widget-annotation.interface";

import { DashboardNotFoundError } from "@/core/errors/dashboard-not-found.error";
import { EmbedTokenInvalidError } from "@/core/errors/embed-token-invalid.error";
import { OptimisticLockError } from "@/core/errors/optimistic-lock.error";

/**
 * Options for {@link InMemoryDashboardStorage}. Every field is
 * optional so tests can spin up an empty adapter with `new
 * InMemoryDashboardStorage()`.
 */
export interface IInMemoryDashboardStorageOptions {
  /** Initial dashboard set. */
  dashboards?: readonly IDashboard[];
}

/**
 * In-memory storage adapter. Intended for unit tests where the full
 * localStorage playground implementation would be overkill.
 *
 * @example
 * ```typescript
 * import { InMemoryDashboardStorage } from '@stackra/dashboard/testing';
 *
 * const storage = new InMemoryDashboardStorage();
 * const created = await storage.create({ name: 'Ops' });
 * ```
 */
export class InMemoryDashboardStorage implements IDashboardStorageAdapter {
  private readonly dashboards: Map<string, IDashboard> = new Map();

  private counter = 0;

  public constructor(options: IInMemoryDashboardStorageOptions = {}) {
    for (const entry of options.dashboards ?? []) {
      this.dashboards.set(entry.id, entry);
    }
  }

  // ── Dashboard CRUD ────────────────────────────────────────────

  public async list(): Promise<readonly IDashboard[]> {
    return Array.from(this.dashboards.values());
  }

  public async get(id: string): Promise<IDashboard> {
    const found = this.dashboards.get(id);

    if (!found) throw new DashboardNotFoundError(id);

    return found;
  }

  public async getBySlug(slug: string): Promise<IDashboard> {
    for (const entry of this.dashboards.values()) {
      if (entry.slug === slug) return entry;
    }

    throw new DashboardNotFoundError(slug);
  }

  public async create(input: ICreateDashboardInput): Promise<IDashboard> {
    this.counter += 1;
    const id = `test-dashboard-${this.counter}`;
    const timestamp = new Date(0).toISOString();
    const record: IDashboard = {
      id,
      tenantId: "test-tenant",
      ownerId: "test-user",
      name: input.name,
      slug: id,
      icon: input.icon,
      color: input.color,
      visibility: input.visibility ?? "private",
      shareLevel: input.shareLevel ?? "private",
      isPinned: false,
      isDefault: false,
      isBuiltIn: false,
      layoutMode: input.layoutMode ?? "grid",
      density: input.density ?? "cozy",
      layouts: { lg: [], md: [], sm: [] },
      widgets: [],
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.dashboards.set(id, record);

    return record;
  }

  public async update(id: string, input: IUpdateDashboardInput): Promise<IDashboard> {
    const current = this.dashboards.get(id);

    if (!current) throw new DashboardNotFoundError(id);
    if (input.version !== current.version) {
      throw new OptimisticLockError(input.version, current.version);
    }

    const merged: IDashboard = {
      ...current,
      ...input,
      layouts: input.layouts ?? current.layouts,
      widgets: input.widgets ?? current.widgets,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.dashboards.set(id, merged);

    return merged;
  }

  public async remove(id: string): Promise<void> {
    if (!this.dashboards.delete(id)) {
      throw new DashboardNotFoundError(id);
    }
  }

  public async duplicate(id: string): Promise<IDashboard> {
    const source = await this.get(id);

    return this.create({ name: `${source.name} (Copy)` });
  }

  public async togglePin(id: string, next: boolean): Promise<IDashboard> {
    const current = await this.get(id);

    return this.update(id, { version: current.version, isPinned: next });
  }

  public async setDefault(id: string): Promise<IDashboard> {
    const current = await this.get(id);

    return this.update(id, { version: current.version, isDefault: true });
  }

  // ── Embed tokens — minimal stubs; expand per-test if needed ──

  public async issueEmbedToken(
    _id: string,
    _input: IIssueEmbedTokenInput,
  ): Promise<IIssuedEmbedToken> {
    throw new Error("InMemoryDashboardStorage does not implement issueEmbedToken.");
  }

  public async revokeEmbedToken(): Promise<void> {
    // No-op — kept out of the test surface until a case needs it.
  }

  public async listEmbedTokens(): Promise<readonly IEmbedTokenRecord[]> {
    return [];
  }

  public async resolveEmbedToken(): Promise<IPublicEmbedDashboard> {
    throw new EmbedTokenInvalidError();
  }

  public async unlockEmbedToken(
    _token: string,
    _input: IUnlockEmbedTokenInput,
  ): Promise<IUnlockedEmbedSession> {
    throw new EmbedTokenInvalidError();
  }

  // ── Share grants ─────────────────────────────────────────────

  public async listShareGrants(): Promise<readonly IDashboardShareGrant[]> {
    return [];
  }

  public async addShareGrant(
    dashboardId: string,
    input: ICreateShareGrantInput,
  ): Promise<IDashboardShareGrant> {
    return {
      id: `grant-${++this.counter}`,
      dashboardId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      grantedBy: "test-user",
      grantedAt: new Date().toISOString(),
    };
  }

  public async removeShareGrant(): Promise<void> {
    // No-op.
  }

  // ── Version snapshots ────────────────────────────────────────

  public async listVersions(): Promise<readonly IDashboardVersionSnapshot[]> {
    return [];
  }

  public async restoreVersion(dashboardId: string): Promise<IDashboard> {
    return this.get(dashboardId);
  }

  // ── Annotations ──────────────────────────────────────────────

  public async listAnnotations(): Promise<readonly IWidgetAnnotation[]> {
    return [];
  }

  public async addAnnotation(
    dashboardId: string,
    widgetInstanceId: string,
    body: string,
  ): Promise<IWidgetAnnotation> {
    return {
      id: `annotation-${++this.counter}`,
      widgetInstanceId,
      dashboardId,
      author: "test-user",
      body,
      createdAt: new Date().toISOString(),
    };
  }

  public async updateAnnotation(
    annotationId: string,
    body: string,
  ): Promise<IWidgetAnnotation> {
    return {
      id: annotationId,
      widgetInstanceId: "test-widget",
      dashboardId: "test-dashboard",
      author: "test-user",
      body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public async removeAnnotation(): Promise<void> {
    // No-op.
  }

  public async listBroadcastViewLog(): Promise<readonly IBroadcastViewLogRecord[]> {
    return [];
  }

  public async rotateEmbedToken(): Promise<IIssuedEmbedToken> {
    throw new EmbedTokenInvalidError();
  }

  public async listBroadcastTemplates(): Promise<readonly IBroadcastTemplate[]> {
    return [];
  }

  public async createBroadcastTemplate(
    input: ICreateBroadcastTemplateInput,
  ): Promise<IBroadcastTemplate> {
    return {
      id: `template-${++this.counter}`,
      name: input.name,
      description: input.description,
      icon: input.icon,
      config: input.config,
      isShared: input.isShared === true,
      useCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public async deleteBroadcastTemplate(): Promise<void> {
    // No-op.
  }

  public async previewBulkRevoke(_filters: IBulkRevokeFilters): Promise<IBulkRevokeResult> {
    return { revoked: 0 };
  }

  public async bulkRevokeEmbedTokens(_filters: IBulkRevokeFilters): Promise<IBulkRevokeResult> {
    return { revoked: 0 };
  }
}
