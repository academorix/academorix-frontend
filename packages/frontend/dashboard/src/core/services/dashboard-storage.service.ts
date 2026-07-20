/**
 * @file dashboard-storage.service.ts
 * @module @stackra/dashboard/core/services
 * @description `localStorage`-backed implementation of
 *   {@link IDashboardStorageAdapter}. Ships with the framework as the
 *   playground default — production apps swap in an HTTP-backed
 *   adapter that implements the same contract.
 *
 *   ## Persistence keys
 *
 *   - `academorix.dashboards.v1:<ownerId>` — the owner's custom
 *     dashboards (built-ins are synthesised on read).
 *   - `academorix.dashboard-embed-tokens.v1` — token → record map.
 *     Global scope so a shared token still resolves after the owner
 *     switches user.
 *   - `academorix.dashboard-share-grants.v1` — grant id → record map.
 *   - `academorix.dashboard-versions.v1` — version-snapshot log.
 *   - `academorix.dashboard-annotations.v1` — flat annotation array.
 *   - `academorix.broadcast-templates.v1` — template id → record map.
 *
 *   ## Concurrency
 *
 *   Every mutating operation reads → mutates → writes synchronously.
 *   `localStorage` blocks the tab, so no extra guards are needed.
 *
 *   ## Simulated latency
 *
 *   Every method returns a `Promise` so a swap to a real HTTP API is
 *   invisible to consumers.
 */

import { Inject, Injectable, Optional } from "@stackra/container";

import {
  BUILT_IN_ANALYTICS_ID,
  BUILT_IN_OVERVIEW_ID,
} from "@/core/constants/built-in-dashboards.constants";
import { DASHBOARD_TEMPLATES } from "@/core/constants/dashboard-templates.constants";
import {
  PLAYGROUND_OWNER_ID,
  PLAYGROUND_TENANT_ID,
} from "@/core/constants/default-dashboard-config.constants";
import { DashboardNotFoundError } from "@/core/errors/dashboard-not-found.error";
import { EmbedTokenInvalidError } from "@/core/errors/embed-token-invalid.error";
import { EmbedTokenPasswordRequiredError } from "@/core/errors/embed-token-password-required.error";
import { OptimisticLockError } from "@/core/errors/optimistic-lock.error";
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
import type { ILayoutItem } from "@/core/interfaces/layout-item.interface";
import type { IPublicEmbedDashboard } from "@/core/interfaces/public-embed-dashboard.interface";
import type { IUnlockedEmbedSession } from "@/core/interfaces/unlocked-embed-session.interface";
import type { IUnlockEmbedTokenInput } from "@/core/interfaces/unlock-embed-token-input.interface";
import type { IUpdateDashboardInput } from "@/core/interfaces/update-dashboard-input.interface";
import type { IWidgetAnnotation } from "@/core/interfaces/widget-annotation.interface";
import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";
import type { IDashboardModuleOptions } from "@/core/interfaces/dashboard-module-options.interface";
import { DASHBOARD_CONFIG } from "@/core/tokens/dashboard-config.token";
import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";
import type { WidgetSpan } from "@/core/types/widget-span.type";
import { buildAnalyticsDashboard } from "@/core/utils/build-analytics-dashboard.util";
import { buildOverviewDashboard } from "@/core/utils/build-overview-dashboard.util";
import { constantTimeEquals } from "@/core/utils/constant-time-equals.util";
import { ensureUniqueSlug } from "@/core/utils/ensure-unique-slug.util";
import { materialiseTemplate } from "@/core/utils/materialise-template.util";
import { normaliseDashboard } from "@/core/utils/normalise-dashboard.util";
import { normaliseLayouts } from "@/core/utils/normalise-layouts.util";
import { normaliseStringList } from "@/core/utils/normalise-string-list.util";
import { normaliseWhitelabel } from "@/core/utils/normalise-whitelabel.util";
import { randomId } from "@/core/utils/random-id.util";
import { randomToken } from "@/core/utils/random-token.util";
import { sha256Hex } from "@/core/utils/sha256-hex.util";
import { slugify } from "@/core/utils/slugify.util";

import { WidgetCatalogueService } from "./widget-catalogue.service";

// ── Storage keys ──────────────────────────────────────────────────────

const DASHBOARDS_KEY_PREFIX = "academorix.dashboards.v1";
const EMBED_TOKENS_KEY = "academorix.dashboard-embed-tokens.v1";
const SHARE_GRANTS_KEY = "academorix.dashboard-share-grants.v1";
const VERSIONS_KEY = "academorix.dashboard-versions.v1";
const ANNOTATIONS_KEY = "academorix.dashboard-annotations.v1";
const BROADCAST_TEMPLATES_KEY = "academorix.broadcast-templates.v1";

// ── Internal shapes ───────────────────────────────────────────────────

/**
 * Persisted shape of the embed-tokens store. Keyed by raw token so the
 * public embed endpoint gets O(1) lookup. Value carries the dashboard
 * id so a resolve → dashboard fetch is two reads.
 */
interface EmbedTokenStoreEntry extends IEmbedTokenRecord {
  dashboardId: string;
}

type EmbedTokenStore = Record<string, EmbedTokenStoreEntry>;

/**
 * Session record persisted by {@link writeUnlockSession} + consumed by
 * `readUnlockSession`. Kept intentionally slim: the resolve path only
 * needs the token this session belongs to + when it expires.
 */
interface EmbedUnlockSessionRecord {
  /** Raw embed token the unlock session is valid for. */
  token: string;
  /** ISO-8601 expiry — expired sessions read as "not present". */
  expiresAt: string;
}

// ── Service ───────────────────────────────────────────────────────────

/**
 * localStorage-backed dashboard storage adapter.
 *
 * @example
 * ```typescript
 * import { useInject } from '@stackra/container/react';
 * import { DASHBOARD_STORAGE } from '@stackra/dashboard';
 *
 * const storage = useInject(DASHBOARD_STORAGE);
 * const dashboards = await storage.list();
 * ```
 */
@Injectable()
export class DashboardStorageService implements IDashboardStorageAdapter {
  /**
   * Module-scoped session map. In-memory only: the session-key gate
   * is trivial to bypass with a stale key if an attacker steals the
   * storage, and requiring a fresh unlock on page reload is the
   * intended UX.
   */
  private readonly unlockSessions: Map<string, EmbedUnlockSessionRecord> = new Map();

  private readonly ownerId: string;

  private readonly tenantId: string;

  public constructor(
    @Optional() @Inject(DASHBOARD_CONFIG) config?: IDashboardModuleOptions,
    // Optional so tests can instantiate the storage without pulling
    // the catalogue in — spans fall back to `"third"` in that case.
    @Optional() private readonly catalogue?: WidgetCatalogueService,
  ) {
    this.ownerId = config?.storage?.ownerId ?? PLAYGROUND_OWNER_ID;
    this.tenantId = config?.storage?.tenantId ?? PLAYGROUND_TENANT_ID;
  }

  // ════════════════════════════════════════════════════════════════
  // Dashboard CRUD
  // ════════════════════════════════════════════════════════════════

  public async list(): Promise<readonly IDashboard[]> {
    const custom = this.readOwnedDashboards().map(normaliseDashboard);
    const built = this.builtIns();

    // Recency-sorted custom dashboards land after the built-ins.
    const sortedCustom = [...custom].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return [...built, ...sortedCustom];
  }

  public async get(id: string): Promise<IDashboard> {
    const all = await this.list();
    const found = all.find((entry) => entry.id === id);

    if (!found) {
      throw new DashboardNotFoundError(id);
    }

    return found;
  }

  public async getBySlug(slug: string): Promise<IDashboard> {
    const all = await this.list();
    const found = all.find((entry) => entry.slug === slug);

    if (!found) {
      throw new DashboardNotFoundError(slug);
    }

    return found;
  }

  public async create(input: ICreateDashboardInput): Promise<IDashboard> {
    const existing = this.readOwnedDashboards();
    const allSlugs = [
      ...this.builtIns().map((entry) => entry.slug),
      ...existing.map((entry) => entry.slug),
    ];
    const candidateSlug = ensureUniqueSlug(slugify(input.name), allSlugs);
    const timestamp = this.now();

    let widgets: readonly IWidgetInstance[] = [];
    let layouts: Record<DashboardBreakpoint, readonly ILayoutItem[]> = normaliseLayouts(undefined);

    if (input.duplicateOf) {
      // Deep-copy the source widget set + layouts, minting new ids
      // so drag operations don't collide with the original's grid keys.
      const source = await this.get(input.duplicateOf);
      const idMap = new Map<string, string>();

      widgets = source.widgets.map((widget) => {
        const nextId = randomId();

        idMap.set(widget.id, nextId);

        return { ...widget, id: nextId };
      });

      layouts = {
        lg: source.layouts.lg.map((item) => ({
          ...item,
          widgetId: idMap.get(item.widgetId) ?? item.widgetId,
        })),
        md: source.layouts.md.map((item) => ({
          ...item,
          widgetId: idMap.get(item.widgetId) ?? item.widgetId,
        })),
        sm: source.layouts.sm.map((item) => ({
          ...item,
          widgetId: idMap.get(item.widgetId) ?? item.widgetId,
        })),
      };
    } else if (input.fromTemplate) {
      const template = DASHBOARD_TEMPLATES.find((entry) => entry.id === input.fromTemplate);

      if (template) {
        const materialised = materialiseTemplate(template, this.ownerId, (key) =>
          this.spanFor(key),
        );

        widgets = materialised.widgets;
        layouts = normaliseLayouts(materialised.layouts);
      }
    }

    const record: IDashboard = {
      id: randomId(),
      tenantId: this.tenantId,
      ownerId: this.ownerId,
      name: input.name,
      slug: candidateSlug,
      icon: input.icon,
      color: input.color,
      visibility: input.visibility ?? "private",
      shareLevel: input.shareLevel ?? "private",
      isPinned: false,
      isDefault: false,
      isBuiltIn: false,
      layoutMode: input.layoutMode ?? "grid",
      density: input.density ?? "cozy",
      layouts,
      widgets,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.writeOwnedDashboards([...existing, record]);

    return record;
  }

  public async update(id: string, input: IUpdateDashboardInput): Promise<IDashboard> {
    if (id === BUILT_IN_OVERVIEW_ID || id === BUILT_IN_ANALYTICS_ID) {
      throw new Error("Built-in dashboards cannot be edited.");
    }

    const existing = this.readOwnedDashboards();
    const index = existing.findIndex((entry) => entry.id === id);

    if (index < 0) {
      throw new DashboardNotFoundError(id);
    }

    const current = existing[index];

    if (!current) {
      throw new DashboardNotFoundError(id);
    }

    // Optimistic lock — a stale client version rejects the write so
    // the UI can surface a "reload and try again" toast.
    if (input.version !== current.version) {
      throw new OptimisticLockError(input.version, current.version);
    }

    const nextSlug =
      input.slug === undefined
        ? current.slug
        : ensureUniqueSlug(
            slugify(input.slug),
            [...this.builtIns().map((entry) => entry.slug), ...existing.map((entry) => entry.slug)],
            current.slug,
          );

    // At most one dashboard per user carries `isDefault === true`.
    // Promoting this row clears every sibling in the same write.
    let siblings = existing;

    if (input.isDefault === true) {
      siblings = existing.map((entry) => ({ ...entry, isDefault: false }));
    }

    const merged: IDashboard = {
      ...current,
      ...input,
      slug: nextSlug,
      layouts: input.layouts ? normaliseLayouts(input.layouts) : current.layouts,
      widgets: input.widgets ?? current.widgets,
      density: input.density ?? current.density ?? "cozy",
      version: current.version + 1,
      updatedAt: this.now(),
    };

    const next = siblings.map((entry) => (entry.id === id ? merged : entry));

    this.writeOwnedDashboards(next);

    return merged;
  }

  public async remove(id: string): Promise<void> {
    if (id === BUILT_IN_OVERVIEW_ID || id === BUILT_IN_ANALYTICS_ID) {
      throw new Error("Built-in dashboards cannot be deleted.");
    }

    const existing = this.readOwnedDashboards();
    const next = existing.filter((entry) => entry.id !== id);

    if (next.length === existing.length) {
      throw new DashboardNotFoundError(id);
    }

    this.writeOwnedDashboards(next);

    // Cascade — walk every side-store and drop rows tied to the
    // removed dashboard. Production runs this via ON DELETE CASCADE.

    // Tokens.
    const tokens = this.readEmbedTokens();
    const keptTokens: EmbedTokenStore = {};

    for (const [raw, entry] of Object.entries(tokens)) {
      if (entry.dashboardId !== id) {
        keptTokens[raw] = entry;
      }
    }

    this.writeEmbedTokens(keptTokens);

    // Grants.
    const grants = this.readShareGrants();
    const keptGrants: Record<string, IDashboardShareGrant> = {};

    for (const [grantId, grant] of Object.entries(grants)) {
      if (grant.dashboardId !== id) {
        keptGrants[grantId] = grant;
      }
    }

    this.writeShareGrants(keptGrants);

    // Versions + annotations.
    const versions = this.readVersionSnapshots();
    const keptVersions = versions.filter((entry) => entry.dashboardId !== id);

    this.writeVersionSnapshots(keptVersions);

    const annotations = this.readAnnotations();
    const keptAnnotations = annotations.filter((entry) => entry.dashboardId !== id);

    this.writeAnnotations(keptAnnotations);
  }

  public async duplicate(id: string): Promise<IDashboard> {
    const source = await this.get(id);
    const suffix = " (Copy)";
    const trimmed = source.name.endsWith(suffix) ? source.name : `${source.name}${suffix}`;

    return this.create({
      name: trimmed,
      icon: source.icon,
      color: source.color,
      layoutMode: source.layoutMode,
      duplicateOf: id,
    });
  }

  public async togglePin(id: string, next: boolean): Promise<IDashboard> {
    return this.update(id, { version: (await this.get(id)).version, isPinned: next });
  }

  public async setDefault(id: string): Promise<IDashboard> {
    return this.update(id, { version: (await this.get(id)).version, isDefault: true });
  }

  // ════════════════════════════════════════════════════════════════
  // Embed tokens
  // ════════════════════════════════════════════════════════════════

  public async issueEmbedToken(
    id: string,
    input: IIssueEmbedTokenInput,
  ): Promise<IIssuedEmbedToken> {
    const dashboard = await this.get(id);

    if (dashboard.visibility !== "shared") {
      throw new Error(
        `Only shared dashboards can issue embed tokens — set "${dashboard.name}" to Shared first.`,
      );
    }

    const raw = randomToken();
    const kind = input.kind ?? "embed";

    // Hash the password (if any) before persisting — the raw string
    // is discarded and never round-trips back to the client.
    const passwordHash = input.password ? await sha256Hex(input.password) : undefined;

    // Filter the extra-dashboards list down to sibling dashboards the
    // caller actually owns AND shares. Silent-drop keeps issue
    // idempotent when the caller stapled a stale id.
    const extraDashboardIds = await this.filterOwnedSharedIds(input.extraDashboardIds ?? [], id);

    // Phase-2/3/4 fields — silent-normalise so callers can dump
    // textareas straight into arrays without stripping whitespace.
    const ipAllowlist = normaliseStringList(input.ipAllowlist);
    const refererAllowlist = normaliseStringList(input.refererAllowlist);
    const viewerEmailAllowlist = normaliseStringList(
      input.viewerEmailAllowlist?.map((entry) => entry.toLowerCase()),
    );
    const viewerDomainAllowlist = normaliseStringList(
      input.viewerDomainAllowlist?.map((entry) => entry.toLowerCase()),
    );
    const maxUses =
      typeof input.maxUses === "number" && input.maxUses > 0 ? input.maxUses : undefined;

    const watermark =
      input.watermark && input.watermark.enabled
        ? {
            enabled: true,
            text: input.watermark.text?.trim() || undefined,
          }
        : undefined;

    const whitelabel = normaliseWhitelabel(input.whitelabel);

    const record: EmbedTokenStoreEntry = {
      id: randomId(),
      dashboardId: id,
      label: input.label,
      expiresAt: input.expiresAt,
      useCount: 0,
      createdAt: this.now(),
      kind,
      extraDashboardIds: extraDashboardIds.length > 0 ? extraDashboardIds : undefined,
      rotationSeconds: input.rotationSeconds,
      refreshMs: input.refreshMs,
      passwordHash,
      unlockSessionSeconds: input.unlockSessionSeconds,
      ipAllowlist,
      refererAllowlist,
      viewerEmailAllowlist,
      viewerDomainAllowlist,
      maxUses,
      watermark,
      disableCopy: input.disableCopy === true ? true : undefined,
      dataWindowFrom: input.dataWindowFrom?.trim() || undefined,
      dataWindowTo: input.dataWindowTo?.trim() || undefined,
      piiMask: input.piiMask === true ? true : undefined,
      whitelabel,
    };

    const store = this.readEmbedTokens();

    store[raw] = record;
    this.writeEmbedTokens(store);

    const origin = typeof window === "undefined" ? "" : window.location.origin;

    // New links land on `/broadcast/:token` — the gate-aware route.
    return {
      ...record,
      rawToken: raw,
      embedUrl: `${origin}/broadcast/${raw}`,
    };
  }

  public async revokeEmbedToken(dashboardId: string, tokenId: string): Promise<void> {
    const store = this.readEmbedTokens();

    for (const [raw, entry] of Object.entries(store)) {
      if (entry.dashboardId === dashboardId && entry.id === tokenId) {
        store[raw] = { ...entry, revokedAt: this.now() };
      }
    }

    this.writeEmbedTokens(store);
  }

  public async listEmbedTokens(dashboardId: string): Promise<readonly IEmbedTokenRecord[]> {
    const store = this.readEmbedTokens();

    return Object.values(store).filter((entry) => entry.dashboardId === dashboardId);
  }

  public async resolveEmbedToken(
    token: string,
    sessionKey?: string,
  ): Promise<IPublicEmbedDashboard> {
    const store = this.readEmbedTokens();
    const entry = store[token];

    if (!entry) throw new EmbedTokenInvalidError();
    if (entry.revokedAt) throw new EmbedTokenInvalidError();
    if (entry.expiresAt && entry.expiresAt <= this.now()) throw new EmbedTokenInvalidError();

    // Password gate — every request against a password-protected
    // broadcast must carry a live session key. Wrong / missing /
    // expired keys look identical to the caller so the gate page can
    // only re-prompt without leaking which step failed.
    if (entry.passwordHash) {
      const session = sessionKey ? this.readUnlockSession(sessionKey) : null;
      const isLive = session !== null && session.token === token && session.expiresAt > this.now();

      if (!isLive) throw new EmbedTokenPasswordRequiredError();
    }

    const dashboard = await this.get(entry.dashboardId).catch(() => {
      throw new EmbedTokenInvalidError();
    });

    if (dashboard.visibility !== "shared") {
      throw new EmbedTokenInvalidError();
    }

    // Touch usage — best-effort; failure isn't fatal to the read.
    store[token] = {
      ...entry,
      useCount: entry.useCount + 1,
      lastUsedAt: this.now(),
    };
    this.writeEmbedTokens(store);

    const primary = this.sanitiseForEmbed(dashboard);

    // Broadcast presentation policy — resolved once so the viewer
    // honours the owner's cadence + rotation + protections without a
    // second round-trip.
    const kind = entry.kind ?? "embed";
    let dashboards: readonly IPublicEmbedDashboard[] | undefined;

    if (kind === "present" && entry.extraDashboardIds && entry.extraDashboardIds.length > 0) {
      const extras: IPublicEmbedDashboard[] = [];

      for (const extraId of entry.extraDashboardIds) {
        try {
          const extra = await this.get(extraId);

          if (extra.visibility === "shared") {
            extras.push(this.sanitiseForEmbed(extra));
          }
        } catch {
          // fail-soft — the primary dashboard still resolves.
        }
      }

      dashboards = [primary, ...extras];
    }

    return {
      ...primary,
      broadcast: {
        kind,
        refreshMs: entry.refreshMs,
        rotationSeconds: entry.rotationSeconds,
        dashboards,
        watermark: entry.watermark,
        disableCopy: entry.disableCopy,
        dataWindowFrom: entry.dataWindowFrom,
        dataWindowTo: entry.dataWindowTo,
        piiMask: entry.piiMask,
        whitelabel: entry.whitelabel,
      },
    };
  }

  public async unlockEmbedToken(
    token: string,
    input: IUnlockEmbedTokenInput,
  ): Promise<IUnlockedEmbedSession> {
    const store = this.readEmbedTokens();
    const entry = store[token];

    // Every failure path throws the same error so the gate page can't
    // distinguish "bad password" / "unknown token" / "revoked" —
    // enumeration protection.
    const genericFail = (): never => {
      throw new EmbedTokenInvalidError();
    };

    if (!entry || entry.revokedAt) return genericFail();
    if (entry.expiresAt && entry.expiresAt <= this.now()) return genericFail();
    if (!entry.passwordHash) return genericFail();

    const expected = entry.passwordHash;
    const actual = await sha256Hex(input.password);

    // Constant-time hex comparison — SHA-256 hex is a fixed 64 chars
    // so length is uniform; the mismatch bit-fold is what matters.
    if (!constantTimeEquals(expected, actual)) return genericFail();

    const ttlSec = entry.unlockSessionSeconds ?? 3600;
    const sessionKey = randomToken();
    const expiresAt = new Date(Date.now() + ttlSec * 1000).toISOString();

    this.writeUnlockSession(sessionKey, {
      token,
      expiresAt,
    });

    return { sessionKey, expiresAt };
  }

  // ════════════════════════════════════════════════════════════════
  // Share grants
  // ════════════════════════════════════════════════════════════════

  public async listShareGrants(dashboardId: string): Promise<readonly IDashboardShareGrant[]> {
    const store = this.readShareGrants();
    const grants = Object.values(store).filter((entry) => entry.dashboardId === dashboardId);

    // Newest first. `Array.sort` is stable so equal-timestamp entries
    // keep insertion order.
    grants.sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));

    return grants;
  }

  public async addShareGrant(
    dashboardId: string,
    input: ICreateShareGrantInput,
  ): Promise<IDashboardShareGrant> {
    // Confirm the dashboard exists — mirrors production's FK check
    // which happens server-side. Silent success would let the UI
    // orphan a grant on a mistyped id.
    await this.get(dashboardId);

    const store = this.readShareGrants();

    // Idempotent — a duplicate triple returns the existing record.
    const existing = Object.values(store).find(
      (entry) =>
        entry.dashboardId === dashboardId &&
        entry.targetType === input.targetType &&
        entry.targetId === input.targetId,
    );

    if (existing) {
      return existing;
    }

    const grant: IDashboardShareGrant = {
      id: randomId(),
      dashboardId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      grantedBy: this.ownerId,
      grantedAt: this.now(),
    };

    store[grant.id] = grant;
    this.writeShareGrants(store);

    return grant;
  }

  public async removeShareGrant(grantId: string): Promise<void> {
    const store = this.readShareGrants();

    // Idempotent — unknown ids resolve as a no-op, matching the
    // semantic of production's DELETE endpoint returning 204 on hit
    // + miss.
    if (grantId in store) {
      delete store[grantId];
      this.writeShareGrants(store);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Version snapshots
  // ════════════════════════════════════════════════════════════════

  public async listVersions(dashboardId: string): Promise<readonly IDashboardVersionSnapshot[]> {
    const entries = this.readVersionSnapshots().filter(
      (entry) => entry.dashboardId === dashboardId,
    );

    // Newest first — the history dialog renders in reverse-chrono
    // order and localStorage doesn't guarantee append-only iteration
    // after a JSON round-trip.
    entries.sort((a, b) => b.changedAt.localeCompare(a.changedAt));

    return entries;
  }

  public async restoreVersion(dashboardId: string, versionId: string): Promise<IDashboard> {
    const entries = this.readVersionSnapshots();
    const target = entries.find(
      (entry) => entry.dashboardId === dashboardId && entry.id === versionId,
    );

    if (!target) {
      throw new DashboardNotFoundError(versionId);
    }

    // Route through `update()` so the optimistic-lock path stays
    // honest — a concurrent editor in another tab is still guarded.
    const current = await this.get(dashboardId);
    const { snapshot } = target;

    return this.update(dashboardId, {
      version: current.version,
      name: snapshot.name,
      slug: snapshot.slug,
      icon: snapshot.icon,
      color: snapshot.color,
      visibility: snapshot.visibility,
      shareLevel: snapshot.shareLevel,
      isPinned: snapshot.isPinned,
      isDefault: snapshot.isDefault,
      layoutMode: snapshot.layoutMode,
      layouts: snapshot.layouts,
      widgets: snapshot.widgets,
      filters: snapshot.filters,
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Widget annotations
  // ════════════════════════════════════════════════════════════════

  public async listAnnotations(dashboardId: string): Promise<readonly IWidgetAnnotation[]> {
    const entries = this.readAnnotations().filter((entry) => entry.dashboardId === dashboardId);

    // Oldest first — the widget-hover pin shows a stack in
    // conversational order (top = oldest, bottom = latest).
    entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return entries;
  }

  public async addAnnotation(
    dashboardId: string,
    widgetInstanceId: string,
    body: string,
  ): Promise<IWidgetAnnotation> {
    // FK check — see the addShareGrant rationale.
    await this.get(dashboardId);

    const annotation: IWidgetAnnotation = {
      id: randomId(),
      widgetInstanceId,
      dashboardId,
      // Playground stub — swaps to the real user display name when
      // the auth surface lands.
      author: "You",
      body,
      createdAt: this.now(),
    };

    const entries = this.readAnnotations();

    this.writeAnnotations([...entries, annotation]);

    return annotation;
  }

  public async updateAnnotation(annotationId: string, body: string): Promise<IWidgetAnnotation> {
    const entries = this.readAnnotations();
    const index = entries.findIndex((entry) => entry.id === annotationId);

    if (index < 0) {
      throw new DashboardNotFoundError(annotationId);
    }

    const target = entries[index];

    if (!target) {
      throw new DashboardNotFoundError(annotationId);
    }

    const updated: IWidgetAnnotation = {
      ...target,
      body,
      updatedAt: this.now(),
    };
    const next = entries.slice();

    next[index] = updated;
    this.writeAnnotations(next);

    return updated;
  }

  public async removeAnnotation(annotationId: string): Promise<void> {
    const entries = this.readAnnotations();
    const next = entries.filter((entry) => entry.id !== annotationId);

    if (next.length !== entries.length) {
      this.writeAnnotations(next);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Broadcast Phase-6 — audit log
  // ════════════════════════════════════════════════════════════════

  public async listBroadcastViewLog(
    embedTokenId: string,
  ): Promise<readonly IBroadcastViewLogRecord[]> {
    // Playground stub — the localStorage adapter does not maintain
    // an audit trail. `embedTokenId` is accepted so the signature
    // matches the production API.
    void embedTokenId;

    return [];
  }

  // ════════════════════════════════════════════════════════════════
  // Broadcast Phase-7 — rotation
  // ════════════════════════════════════════════════════════════════

  public async rotateEmbedToken(
    dashboardId: string,
    tokenId: string,
    graceSeconds: number,
  ): Promise<IIssuedEmbedToken> {
    const store = this.readEmbedTokens();
    let sourceRaw: string | undefined;
    let source: EmbedTokenStoreEntry | undefined;

    for (const [raw, entry] of Object.entries(store)) {
      if (entry.dashboardId === dashboardId && entry.id === tokenId) {
        sourceRaw = raw;
        source = entry;
        break;
      }
    }

    if (!source || !sourceRaw) {
      throw new EmbedTokenInvalidError();
    }

    // Delegate to `issueEmbedToken` so the freshly-minted record
    // inherits every field verbatim. The password can't be reused
    // since we only kept the digest, so a rotated password-gated
    // link ships without a gate; the operator can re-issue with a
    // new password if the gate is still wanted.
    const issued = await this.issueEmbedToken(dashboardId, {
      label: source.label,
      expiresAt: source.expiresAt,
      kind: source.kind,
      extraDashboardIds: source.extraDashboardIds,
      rotationSeconds: source.rotationSeconds,
      refreshMs: source.refreshMs,
      unlockSessionSeconds: source.unlockSessionSeconds,
      ipAllowlist: source.ipAllowlist,
      refererAllowlist: source.refererAllowlist,
      viewerEmailAllowlist: source.viewerEmailAllowlist,
      viewerDomainAllowlist: source.viewerDomainAllowlist,
      maxUses: source.maxUses,
      watermark: source.watermark,
      disableCopy: source.disableCopy,
      dataWindowFrom: source.dataWindowFrom,
      dataWindowTo: source.dataWindowTo,
      piiMask: source.piiMask,
      whitelabel: source.whitelabel,
    });

    // Mark the source record with a grace window pointing at the
    // successor. Read-modify-write via a fresh store read so we
    // don't clobber the entry `issueEmbedToken` just wrote.
    const nextStore = this.readEmbedTokens();
    const existing = nextStore[sourceRaw];

    if (existing) {
      const clampedGrace = Number.isFinite(graceSeconds) && graceSeconds > 0 ? graceSeconds : 0;
      const graceExpiresAt = new Date(Date.now() + clampedGrace * 1000).toISOString();

      nextStore[sourceRaw] = {
        ...existing,
        supersededByTokenId: issued.id,
        graceExpiresAt,
      };
      this.writeEmbedTokens(nextStore);
    }

    return issued;
  }

  // ════════════════════════════════════════════════════════════════
  // Broadcast Phase-7 — templates
  // ════════════════════════════════════════════════════════════════

  public async listBroadcastTemplates(): Promise<readonly IBroadcastTemplate[]> {
    const store = this.readBroadcastTemplates();
    const list = Object.values(store);

    // Freshly-saved templates land at the top of the picker.
    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return list;
  }

  public async createBroadcastTemplate(
    input: ICreateBroadcastTemplateInput,
  ): Promise<IBroadcastTemplate> {
    const name = input.name.trim();

    if (!name) {
      throw new Error("Template name is required.");
    }

    const store = this.readBroadcastTemplates();
    const timestamp = this.now();
    const template: IBroadcastTemplate = {
      id: randomId(),
      name,
      description: input.description?.trim() || undefined,
      icon: input.icon?.trim() || undefined,
      config: input.config,
      isShared: input.isShared === true,
      useCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store[template.id] = template;
    this.writeBroadcastTemplates(store);

    return template;
  }

  public async deleteBroadcastTemplate(id: string): Promise<void> {
    const store = this.readBroadcastTemplates();

    if (id in store) {
      delete store[id];
      this.writeBroadcastTemplates(store);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Broadcast Phase-7 — bulk revoke
  // ════════════════════════════════════════════════════════════════

  public async previewBulkRevoke(filters: IBulkRevokeFilters): Promise<IBulkRevokeResult> {
    return { revoked: this.matchingTokens(filters).length };
  }

  public async bulkRevokeEmbedTokens(filters: IBulkRevokeFilters): Promise<IBulkRevokeResult> {
    const store = this.readEmbedTokens();
    const matching = this.matchingTokens(filters);
    const timestamp = this.now();
    let revoked = 0;

    for (const [raw, entry] of matching) {
      // Preview counts every match; apply counts only entries that
      // actually flipped. The preview vs. apply gap lets the UI
      // reflect "no-op" runs.
      if (!entry.revokedAt) {
        store[raw] = { ...entry, revokedAt: timestamp };
        revoked += 1;
      }
    }

    if (revoked > 0) {
      this.writeEmbedTokens(store);
    }

    return { revoked };
  }

  // ════════════════════════════════════════════════════════════════
  // Private helpers
  // ════════════════════════════════════════════════════════════════

  /**
   * Emit the built-in dashboards synthesised on every read. Built-ins
   * are never persisted — a catalogue update lands immediately.
   */
  private builtIns(): IDashboard[] {
    return [
      buildOverviewDashboard(this.ownerId, this.tenantId, (key) => this.spanFor(key)),
      buildAnalyticsDashboard(this.ownerId, this.tenantId, (key) => this.spanFor(key)),
    ];
  }

  /**
   * Redact a Dashboard down to its public-facing shape. Owner id,
   * tenant id, share level, version are deliberately omitted.
   */
  private sanitiseForEmbed(dashboard: IDashboard): IPublicEmbedDashboard {
    return {
      name: dashboard.name,
      icon: dashboard.icon,
      color: dashboard.color,
      layoutMode: dashboard.layoutMode,
      layouts: dashboard.layouts,
      widgets: dashboard.widgets,
      filters: dashboard.filters,
      visibility: dashboard.visibility,
      updatedAt: dashboard.updatedAt,
    };
  }

  /**
   * Look up a widget's span via the injected catalogue. Falls back
   * to `"third"` when the catalogue isn't wired or the widget isn't
   * registered.
   */
  private spanFor(key: string): WidgetSpan {
    return this.catalogue?.spanFor(key) ?? "third";
  }

  /** Filter caller-supplied ids down to owned + shared siblings. */
  private async filterOwnedSharedIds(ids: readonly string[], primaryId: string): Promise<string[]> {
    const owned = await this.list();
    const ownedSharedById = new Map<string, IDashboard>();

    for (const entry of owned) {
      if (entry.visibility === "shared" && entry.id !== primaryId) {
        ownedSharedById.set(entry.id, entry);
      }
    }

    // Preserve caller order + drop duplicates.
    const seen = new Set<string>();
    const out: string[] = [];

    for (const id of ids) {
      if (id === primaryId || seen.has(id)) continue;
      if (!ownedSharedById.has(id)) continue;
      seen.add(id);
      out.push(id);
    }

    return out;
  }

  /**
   * Compute the token set matching a bulk-revoke filter. Shared
   * between preview + apply so the two paths cannot diverge.
   */
  private matchingTokens(filters: IBulkRevokeFilters): [string, EmbedTokenStoreEntry][] {
    const store = this.readEmbedTokens();
    const dashboardSet = new Set<string>();

    if (filters.dashboardId) {
      dashboardSet.add(filters.dashboardId);
    }
    if (filters.dashboardIds) {
      for (const id of filters.dashboardIds) dashboardSet.add(id);
    }

    const beforeIso = filters.beforeDate ? new Date(filters.beforeDate).toISOString() : undefined;

    const results: [string, EmbedTokenStoreEntry][] = [];

    for (const [raw, entry] of Object.entries(store)) {
      if (dashboardSet.size > 0 && !dashboardSet.has(entry.dashboardId)) {
        continue;
      }
      if (beforeIso && entry.createdAt >= beforeIso) {
        continue;
      }
      // `ownerId` filter is stubbed — the playground token store
      // doesn't record the issuer. When the token store grows an
      // issuer field this branch narrows results by owner.

      results.push([raw, entry]);
    }

    return results;
  }

  /**
   * Read an unlock session by its opaque key. Returns `null` when
   * the key is unknown or the session has expired. Expired sessions
   * are eagerly evicted so the map doesn't grow unbounded.
   */
  private readUnlockSession(sessionKey: string): EmbedUnlockSessionRecord | null {
    const record = this.unlockSessions.get(sessionKey);

    if (!record) return null;

    if (record.expiresAt <= this.now()) {
      this.unlockSessions.delete(sessionKey);

      return null;
    }

    return record;
  }

  /**
   * Register an unlock session. Called after a successful password
   * check. The gate page keeps the returned session key in memory
   * only.
   */
  private writeUnlockSession(sessionKey: string, record: EmbedUnlockSessionRecord): void {
    this.unlockSessions.set(sessionKey, record);
  }

  /** Get the current wall-clock time as ISO-8601. */
  private now(): string {
    return new Date().toISOString();
  }

  // ── Storage IO ─────────────────────────────────────────────────

  private ownerKey(): string {
    return `${DASHBOARDS_KEY_PREFIX}:${this.ownerId}`;
  }

  private readOwnedDashboards(): IDashboard[] {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(this.ownerKey());

      if (!raw) return [];

      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) return [];

      // Structural guard — anything that doesn't look like a dashboard
      // is dropped. Only reason for this is to survive hand-edited
      // localStorage in dev.
      return parsed.filter((entry): entry is IDashboard => {
        return (
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          "slug" in entry &&
          "widgets" in entry &&
          "layouts" in entry
        );
      });
    } catch {
      // fail-soft — malformed storage falls back to "no data".
      return [];
    }
  }

  private writeOwnedDashboards(dashboards: readonly IDashboard[]): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(this.ownerKey(), JSON.stringify(dashboards));
    } catch {
      // fail-soft — quota / private-mode Safari / etc. The palette
      // still works, it just doesn't persist for this session.
    }
  }

  private readEmbedTokens(): EmbedTokenStore {
    if (typeof window === "undefined") return {};

    try {
      const raw = window.localStorage.getItem(EMBED_TOKENS_KEY);

      if (!raw) return {};

      const parsed = JSON.parse(raw) as unknown;

      if (typeof parsed !== "object" || parsed === null) return {};

      return parsed as EmbedTokenStore;
    } catch {
      return {};
    }
  }

  private writeEmbedTokens(store: EmbedTokenStore): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(EMBED_TOKENS_KEY, JSON.stringify(store));
    } catch {
      // fail-soft
    }
  }

  private readShareGrants(): Record<string, IDashboardShareGrant> {
    if (typeof window === "undefined") return {};

    try {
      const raw = window.localStorage.getItem(SHARE_GRANTS_KEY);

      if (!raw) return {};

      const parsed = JSON.parse(raw) as unknown;

      if (typeof parsed !== "object" || parsed === null) return {};

      const out: Record<string, IDashboardShareGrant> = {};

      for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
        if (
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          "dashboardId" in entry &&
          "targetType" in entry &&
          "targetId" in entry
        ) {
          out[id] = entry as IDashboardShareGrant;
        }
      }

      return out;
    } catch {
      return {};
    }
  }

  private writeShareGrants(store: Record<string, IDashboardShareGrant>): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(SHARE_GRANTS_KEY, JSON.stringify(store));
    } catch {
      // fail-soft
    }
  }

  private readVersionSnapshots(): IDashboardVersionSnapshot[] {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(VERSIONS_KEY);

      if (!raw) return [];

      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) return [];

      return parsed.filter((entry): entry is IDashboardVersionSnapshot => {
        return (
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          "dashboardId" in entry &&
          "snapshot" in entry &&
          "changedAt" in entry
        );
      });
    } catch {
      return [];
    }
  }

  private writeVersionSnapshots(entries: readonly IDashboardVersionSnapshot[]): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(entries));
    } catch {
      // fail-soft
    }
  }

  private readAnnotations(): IWidgetAnnotation[] {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(ANNOTATIONS_KEY);

      if (!raw) return [];

      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) return [];

      return parsed.filter((entry): entry is IWidgetAnnotation => {
        return (
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          "widgetInstanceId" in entry &&
          "dashboardId" in entry &&
          "body" in entry
        );
      });
    } catch {
      return [];
    }
  }

  private writeAnnotations(entries: readonly IWidgetAnnotation[]): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(entries));
    } catch {
      // fail-soft
    }
  }

  private readBroadcastTemplates(): Record<string, IBroadcastTemplate> {
    if (typeof window === "undefined") return {};

    try {
      const raw = window.localStorage.getItem(BROADCAST_TEMPLATES_KEY);

      if (!raw) return {};

      const parsed = JSON.parse(raw) as unknown;

      if (typeof parsed !== "object" || parsed === null) return {};

      const out: Record<string, IBroadcastTemplate> = {};

      for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
        if (
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          "name" in entry &&
          "config" in entry &&
          "createdAt" in entry
        ) {
          out[id] = entry as IBroadcastTemplate;
        }
      }

      return out;
    } catch {
      return {};
    }
  }

  private writeBroadcastTemplates(store: Record<string, IBroadcastTemplate>): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(BROADCAST_TEMPLATES_KEY, JSON.stringify(store));
    } catch {
      // fail-soft
    }
  }
}
