/**
 * @file storage.ts
 * @module modules/dashboard/dashboards/storage
 *
 * @description
 * `localStorage`-backed implementation of {@link DashboardStorageAdapter}.
 * Swapping the frontend from localStorage to Refine's data-provider is
 * a matter of implementing this same interface against Refine's
 * `useList`/`useCreate`/`useUpdate` — every hook and component in the
 * dashboard module consumes only the adapter surface, never the
 * storage backend directly.
 *
 * ## Persistence keys
 *
 *   * `academorix.dashboards.v1:<ownerId>` — array of {@link Dashboard}
 *     JSON objects (custom dashboards only; built-ins are never
 *     persisted).
 *   * `academorix.dashboard-embed-tokens.v1` — map of raw token →
 *     {@link EmbedTokenRecord} + dashboardId. Kept globally so a
 *     shared token still resolves after the owner switches user.
 *   * `academorix.dashboard-share-grants.v1` — map of grant id →
 *     {@link DashboardShareGrant}. Kept globally so grants survive
 *     an owner-switch and so a viewer's `canAccessDashboard` check
 *     reads a single well-known key.
 *   * `academorix.dashboard-versions.v1` — array of
 *     {@link DashboardVersionSnapshot} records. Global scope for
 *     the same reason as embed tokens: the cascade lives on the
 *     dashboard row, not the owner.
 *   * `academorix.dashboard-annotations.v1` — array of
 *     {@link WidgetAnnotation} records. Owner-private in the eyes
 *     of the read path, but stored globally so the cascade on
 *     dashboard delete stays a single write.
 *
 * ## Concurrency
 *
 * Every mutating operation reads → mutates → writes as one
 * synchronous pass. `localStorage` blocks the tab so we don't need
 * additional guards, but every version write bumps `version` under
 * the same lock so an in-flight optimistic-lock check stays honest.
 *
 * ## Simulated latency
 *
 * Every method wraps its result in a resolved `Promise` and yields
 * to the microtask queue. Downstream hooks (`useQuery`-style) expect
 * async so the swap to a real API doesn't rewire consumer effects.
 */

import { WIDGET_CATALOGUE, findWidget } from "@/modules/dashboard/widgets.catalogue";
import {
  BUILT_IN_ANALYTICS_ID,
  BUILT_IN_OVERVIEW_ID,
  buildAnalyticsDashboard,
  buildOverviewDashboard,
  DASHBOARD_TEMPLATES,
  materialiseTemplate,
} from "@/modules/dashboard/dashboards/defaults";
import { ensureUniqueSlug, slugify } from "@/modules/dashboard/dashboards/slugify";

import type { WidgetEntry, WidgetSpan } from "@/modules/dashboard/widgets.catalogue";

import type {
  BroadcastTemplate,
  BroadcastViewLogRecord,
  BulkRevokeFilters,
  BulkRevokeResult,
  CreateBroadcastTemplateInput,
  CreateDashboardInput,
  CreateShareGrantInput,
  Dashboard,
  DashboardBreakpoint,
  DashboardShareGrant,
  DashboardStorageAdapter,
  DashboardVersionSnapshot,
  EmbedTokenRecord,
  IssuedEmbedToken,
  IssueEmbedTokenInput,
  LayoutItem,
  PublicEmbedDashboard,
  UnlockedEmbedSession,
  UnlockEmbedTokenInput,
  UpdateDashboardInput,
  WidgetAnnotation,
  WidgetInstance,
} from "@/modules/dashboard/dashboards/types";

import {
  DashboardNotFoundError,
  EmbedTokenInvalidError,
  EmbedTokenPasswordRequiredError,
  OptimisticLockError,
} from "@/modules/dashboard/dashboards/types";

// -----------------------------------------------------------------------------
// Broadcast / password-gated embed helpers
// -----------------------------------------------------------------------------
//
// Every helper below supports the password-gated broadcast surface
// (see the `unlockEmbedToken` method + the `/broadcast/:token` page).
// The playground stays deliberately simple:
//
//   * `sha256Hex` — SHA-256 hex digest via SubtleCrypto. The backend
//     spec upgrades to Argon2id; we ship SHA-256 here because it's
//     part of every modern browser without bundling an Argon2 impl.
//   * `constantTimeEquals` — length-safe equality that runs in
//     constant time relative to the shorter input. Prevents the
//     unlock endpoint from leaking password-prefix info through a
//     timing side channel.
//   * `read/writeUnlockSession` — in-memory-only session store keyed
//     by an opaque session key. Kept out of localStorage on purpose:
//     the session-key gate is trivial to bypass with a stale key if
//     an attacker steals the storage, and a page reload requiring a
//     fresh unlock is the intended UX. A separate `<Broadcast>` page
//     holds the session key in memory only.

/**
 * Session record persisted by {@link writeUnlockSession} and
 * consumed by {@link readUnlockSession}. Kept intentionally slim:
 * the resolve path only needs to confirm which token the session
 * belongs to + when it expires.
 */
interface EmbedUnlockSessionRecord {
  /** Raw embed token the unlock session is valid for. */
  token: string;
  /** ISO-8601 expiry — expired sessions read as "not present". */
  expiresAt: string;
}

/**
 * Module-scoped session map. In-memory only — see the "Broadcast /
 * password-gated embed helpers" comment for why. A page reload
 * clears the map; the viewer re-enters the password.
 */
const embedUnlockSessions: Map<string, EmbedUnlockSessionRecord> = new Map();

/**
 * Read an unlock session by its opaque key. Returns `null` when the
 * key is unknown or the session has expired. Expired sessions are
 * eagerly evicted so the map does not grow unbounded across long
 * viewer sessions.
 */
function readUnlockSession(sessionKey: string): EmbedUnlockSessionRecord | null {
  const record = embedUnlockSessions.get(sessionKey);

  if (!record) return null;

  if (record.expiresAt <= new Date().toISOString()) {
    embedUnlockSessions.delete(sessionKey);

    return null;
  }

  return record;
}

/**
 * Register an unlock session. Called from the `unlockEmbedToken`
 * flow after a successful password check. The gate page keeps the
 * returned session key in memory only.
 */
function writeUnlockSession(sessionKey: string, record: EmbedUnlockSessionRecord): void {
  embedUnlockSessions.set(sessionKey, record);
}

/**
 * SHA-256 hex digest via the SubtleCrypto API. Returns lowercase hex.
 * Throws when the runtime lacks SubtleCrypto — an unrealistic path
 * in the browser today, but the error surface is documented so a
 * caller can decide what to do rather than seeing an opaque
 * TypeError.
 */
async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("SubtleCrypto is required to hash embed passwords.");
  }

  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Length-safe, constant-time string equality. Runs in time
 * proportional to the shorter input so an attacker cannot infer
 * a password prefix by measuring response time on the unlock
 * endpoint. Returns `false` immediately when lengths differ (that
 * timing leak is inherent + acceptable — length is not secret).
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;

  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

/** Owner scope used until a real identity is wired up. */
const PLAYGROUND_OWNER_ID = "playground-user";
const PLAYGROUND_TENANT_ID = "playground-tenant";

const DASHBOARDS_KEY_PREFIX = "academorix.dashboards.v1";
const EMBED_TOKENS_KEY = "academorix.dashboard-embed-tokens.v1";

/**
 * localStorage key holding every persisted access grant. Global
 * (not owner-scoped) so a viewer's access check reads a single
 * key, and so grants survive a hypothetical owner-switch. See the
 * file header for the full storage-key layout.
 */
const SHARE_GRANTS_KEY = "academorix.dashboard-share-grants.v1";

/**
 * localStorage key for the dashboard version snapshot log. Kept
 * separate from the dashboard document itself so an editor session
 * never needs to serialise the entire history on save.
 */
const VERSIONS_KEY = "academorix.dashboard-versions.v1";

/**
 * localStorage key for per-widget annotations. Stored as a flat
 * array so the cascade on dashboard delete is one filter pass.
 */
const ANNOTATIONS_KEY = "academorix.dashboard-annotations.v1";

/**
 * localStorage key for broadcast templates. Stored as a map keyed
 * by template id so lookup + delete are single-key operations.
 * Kept global (not owner-scoped) so shared templates surface for
 * every user in the playground tenant.
 */
const BROADCAST_TEMPLATES_KEY = "academorix.broadcast-templates.v1";

/**
 * Persisted shape of the embed-tokens store. Keyed by raw token so
 * the public embed endpoint can O(1) lookup. Value carries the
 * dashboard id so a resolve → dashboard fetch is two reads.
 */
interface EmbedTokenStoreEntry extends EmbedTokenRecord {
  dashboardId: string;
}

type EmbedTokenStore = Record<string, EmbedTokenStoreEntry>;

/**
 * Small crypto-random UUID helper. Uses `crypto.randomUUID` when the
 * runtime exposes it (every current browser + Node ≥ 19), falling
 * back to a Math.random shim for very old JSDOM test environments.
 */
function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback — good enough for the playground; never used in prod.
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/** Base64url encoder for the embed-token raw string. */
function randomToken(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);

    crypto.getRandomValues(bytes);

    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback shim — never used in prod.
  return randomId().replaceAll("-", "");
}

/**
 * Normalise a user-supplied list of newline / comma-separated
 * strings into a compact, deduplicated `readonly string[]`. Empty
 * entries are dropped so the share dialog can paste multi-line
 * textareas verbatim.
 *
 * Returns `undefined` when the resulting list is empty — the
 * embed-token record uses `undefined` as the "no restriction"
 * sentinel, so the resolver never has to distinguish
 * `[] === undefined`.
 */
function normaliseStringList(input: readonly string[] | undefined): readonly string[] | undefined {
  if (!input || input.length === 0) return undefined;

  const cleaned: string[] = [];
  const seen = new Set<string>();

  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();

    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
  }

  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Normalise a whitelabel payload from the share dialog. Trims every
 * string; drops empty strings. Returns `undefined` when no field
 * survives so the record stays clean when the owner enables and
 * then clears the section.
 */
function normaliseWhitelabel(
  input: { logoUrl?: string; accent?: string; welcomeText?: string } | undefined,
): { logoUrl?: string; accent?: string; welcomeText?: string } | undefined {
  if (!input) return undefined;

  const logoUrl = input.logoUrl?.trim() || undefined;
  const accent = input.accent?.trim() || undefined;
  const welcomeText = input.welcomeText?.trim() || undefined;

  if (!logoUrl && !accent && !welcomeText) return undefined;

  return { logoUrl, accent, welcomeText };
}

/** Get the current wall-clock time as ISO-8601. */
function now(): string {
  return new Date().toISOString();
}

/** Read the persisted dashboard array for the current owner. */
function readOwnedDashboards(ownerId: string): Dashboard[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(`${DASHBOARDS_KEY_PREFIX}:${ownerId}`);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    // A structural guard is enough — we only ever write our own
    // schema here so a mismatch means someone hand-edited storage.
    return parsed.filter((entry): entry is Dashboard => {
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
    return [];
  }
}

function writeOwnedDashboards(ownerId: string, dashboards: readonly Dashboard[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(`${DASHBOARDS_KEY_PREFIX}:${ownerId}`, JSON.stringify(dashboards));
  } catch {
    // Quota / private-mode Safari / etc. — the palette still works,
    // it just doesn't persist. Fail silently in the playground.
  }
}

function readEmbedTokens(): EmbedTokenStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(EMBED_TOKENS_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;

    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    return parsed as EmbedTokenStore;
  } catch {
    return {};
  }
}

function writeEmbedTokens(store: EmbedTokenStore): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EMBED_TOKENS_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

/**
 * Read the persisted share-grant table. Keyed by grant id so
 * lookup + revoke are single-key operations. Structural validation
 * mirrors the dashboards reader: we filter out anything that
 * doesn't look like a grant so hand-edited storage stays safe.
 */
function readShareGrants(): Record<string, DashboardShareGrant> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(SHARE_GRANTS_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;

    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    const out: Record<string, DashboardShareGrant> = {};

    for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        typeof entry === "object" &&
        entry !== null &&
        "id" in entry &&
        "dashboardId" in entry &&
        "targetType" in entry &&
        "targetId" in entry
      ) {
        out[id] = entry as DashboardShareGrant;
      }
    }

    return out;
  } catch {
    return {};
  }
}

function writeShareGrants(store: Record<string, DashboardShareGrant>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SHARE_GRANTS_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private-mode failures — grants degrade silently
    // rather than surfacing a toast for every mutation.
  }
}

/** Read the version-snapshot log. Malformed entries are dropped. */
function readVersionSnapshots(): DashboardVersionSnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(VERSIONS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is DashboardVersionSnapshot => {
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

function writeVersionSnapshots(entries: readonly DashboardVersionSnapshot[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

/** Read the annotation store. Malformed entries are dropped. */
function readAnnotations(): WidgetAnnotation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ANNOTATIONS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is WidgetAnnotation => {
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

function writeAnnotations(entries: readonly WidgetAnnotation[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

/**
 * Read the persisted template store. Keyed by template id so
 * lookup + delete are O(1). Malformed entries are dropped so a
 * hand-edited storage entry stays safe on read.
 */
function readBroadcastTemplates(): Record<string, BroadcastTemplate> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(BROADCAST_TEMPLATES_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;

    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    const out: Record<string, BroadcastTemplate> = {};

    for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        typeof entry === "object" &&
        entry !== null &&
        "id" in entry &&
        "name" in entry &&
        "config" in entry &&
        "createdAt" in entry
      ) {
        out[id] = entry as BroadcastTemplate;
      }
    }

    return out;
  } catch {
    return {};
  }
}

function writeBroadcastTemplates(store: Record<string, BroadcastTemplate>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(BROADCAST_TEMPLATES_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

/** Read the catalogue's span hint for a widget key. */
function widgetSpan(key: string): WidgetSpan {
  const entry: WidgetEntry | undefined = findWidget(key);

  return entry?.span ?? "third";
}

/**
 * Ensure a dashboard document has one layout array per breakpoint,
 * including an empty array when the breakpoint has never been used.
 * The editor writes layouts per breakpoint independently — this
 * guard keeps rendering resilient to partial writes from an older
 * client.
 */
function normaliseLayouts(
  layouts: Partial<Record<DashboardBreakpoint, readonly LayoutItem[]>> | undefined,
): Record<DashboardBreakpoint, readonly LayoutItem[]> {
  return {
    lg: layouts?.lg ?? [],
    md: layouts?.md ?? [],
    sm: layouts?.sm ?? [],
  };
}

/**
 * Fill in fields introduced after the original schema. Runs on every
 * read of a persisted dashboard so documents written before a field
 * shipped still parse against today's contract. Kept small and
 * explicit — adding a field means adding one line here.
 */
function normaliseDashboard(entry: Dashboard): Dashboard {
  return {
    ...entry,
    // `density` shipped in F1. `undefined` maps to the app-wide
    // default so we don't force a persistence-side migration on
    // dashboards that pre-date the field.
    density: entry.density ?? "cozy",
    // Reuse the layout guard here too so read paths always see one
    // array per breakpoint even after a partial write.
    layouts: normaliseLayouts(entry.layouts),
  };
}

/**
 * The playground storage adapter. Instantiated once per module load
 * and re-used by every hook. Statelessness across calls is
 * intentional — the "state" is `localStorage`.
 */
class LocalStorageDashboardStorage implements DashboardStorageAdapter {
  private readonly ownerId: string;
  private readonly tenantId: string;

  public constructor(ownerId: string, tenantId: string) {
    this.ownerId = ownerId;
    this.tenantId = tenantId;
  }

  /**
   * Enumerate every dashboard the user can currently see — the two
   * built-ins plus their persisted custom dashboards. Built-ins are
   * synthesised on every read so a catalogue update lands
   * immediately (no schema migration).
   */
  public async list(): Promise<readonly Dashboard[]> {
    const custom = readOwnedDashboards(this.ownerId).map(normaliseDashboard);
    const built = this.builtIns();

    // Sort custom by updatedAt desc so the tab order matches the
    // sidebar's recency ordering.
    const sortedCustom = [...custom].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    // Built-ins render first; custom follow in recency order.
    return Promise.resolve([...built, ...sortedCustom]);
  }

  public async get(id: string): Promise<Dashboard> {
    const all = await this.list();
    const found = all.find((entry) => entry.id === id);

    if (!found) {
      throw new DashboardNotFoundError(id);
    }

    return found;
  }

  public async getBySlug(slug: string): Promise<Dashboard> {
    const all = await this.list();
    const found = all.find((entry) => entry.slug === slug);

    if (!found) {
      throw new DashboardNotFoundError(slug);
    }

    return found;
  }

  public async create(input: CreateDashboardInput): Promise<Dashboard> {
    const existing = readOwnedDashboards(this.ownerId);
    const allSlugs = [
      ...this.builtIns().map((entry) => entry.slug),
      ...existing.map((entry) => entry.slug),
    ];
    const candidateSlug = ensureUniqueSlug(slugify(input.name), allSlugs);
    const timestamp = now();

    let widgets: readonly WidgetInstance[] = [];
    let layouts: Record<DashboardBreakpoint, readonly LayoutItem[]> = normaliseLayouts(undefined);

    if (input.duplicateOf) {
      // Deep-copy the source's widget set + layouts, minting new ids
      // so drag operations on the new dashboard don't collide with
      // the original's react-grid-layout keys.
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
      // Seed from a shipped template — auto-layout at every
      // breakpoint so first render is sensible.
      const template = DASHBOARD_TEMPLATES.find((entry) => entry.id === input.fromTemplate);

      if (template) {
        const materialised = materialiseTemplate(template, this.ownerId, widgetSpan);

        widgets = materialised.widgets;
        layouts = normaliseLayouts(materialised.layouts);
      }
    }

    const record: Dashboard = {
      id: randomId(),
      tenantId: this.tenantId,
      ownerId: this.ownerId,
      name: input.name,
      slug: candidateSlug,
      icon: input.icon,
      color: input.color,
      visibility: input.visibility ?? "private",
      // Every new dashboard starts private in-app; the owner can flip
      // this in the share dialog. Kept independent of `visibility`
      // (which governs embed-token issue) so the two axes don't
      // collide — see the note on {@link DashboardShareLevel}.
      shareLevel: input.shareLevel ?? "private",
      isPinned: false,
      isDefault: false,
      isBuiltIn: false,
      layoutMode: input.layoutMode ?? "grid",
      // Cozy is the app-wide default — mirrors the built-in seeds
      // in `defaults.ts` so a user's first custom dashboard reads
      // at the same rhythm as Overview / Analytics.
      density: input.density ?? "cozy",
      layouts,
      widgets,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    writeOwnedDashboards(this.ownerId, [...existing, record]);

    return record;
  }

  public async update(id: string, input: UpdateDashboardInput): Promise<Dashboard> {
    if (id === BUILT_IN_OVERVIEW_ID || id === BUILT_IN_ANALYTICS_ID) {
      throw new Error("Built-in dashboards cannot be edited.");
    }

    const existing = readOwnedDashboards(this.ownerId);
    const index = existing.findIndex((entry) => entry.id === id);

    if (index < 0) {
      throw new DashboardNotFoundError(id);
    }

    const current = existing[index];

    if (!current) {
      throw new DashboardNotFoundError(id);
    }

    // Optimistic lock — the client passes the version it read; a
    // mismatch means someone else (or another tab) has already
    // updated the dashboard. The UI surfaces a "reload and try
    // again" toast.
    if (input.version !== current.version) {
      throw new OptimisticLockError(input.version, current.version);
    }

    // Slug can be renamed — auto-suffix if it collides with a
    // sibling. Rename to the current slug is a no-op.
    const nextSlug =
      input.slug === undefined
        ? current.slug
        : ensureUniqueSlug(
            slugify(input.slug),
            [...this.builtIns().map((entry) => entry.slug), ...existing.map((entry) => entry.slug)],
            current.slug,
          );

    // At most one dashboard per user carries `isDefault === true` —
    // if the client sets this row default we unset every sibling in
    // the same write.
    let siblings = existing;

    if (input.isDefault === true) {
      siblings = existing.map((entry) => ({ ...entry, isDefault: false }));
    }

    const merged: Dashboard = {
      ...current,
      ...input,
      slug: nextSlug,
      layouts: input.layouts ? normaliseLayouts(input.layouts) : current.layouts,
      widgets: input.widgets ?? current.widgets,
      // Preserve density on a rename-only update. `input.density`
      // wins when the caller sets it explicitly; otherwise we keep
      // whatever the current record has (or fall back to cozy for
      // documents written before the field shipped).
      density: input.density ?? current.density ?? "cozy",
      version: current.version + 1,
      updatedAt: now(),
    };

    const next = siblings.map((entry) => (entry.id === id ? merged : entry));

    writeOwnedDashboards(this.ownerId, next);

    return merged;
  }

  public async remove(id: string): Promise<void> {
    if (id === BUILT_IN_OVERVIEW_ID || id === BUILT_IN_ANALYTICS_ID) {
      throw new Error("Built-in dashboards cannot be deleted.");
    }

    const existing = readOwnedDashboards(this.ownerId);
    const next = existing.filter((entry) => entry.id !== id);

    if (next.length === existing.length) {
      throw new DashboardNotFoundError(id);
    }

    writeOwnedDashboards(this.ownerId, next);

    // Cascade — revoke every embed token tied to this dashboard so
    // a deleted dashboard's public URL stops resolving. Prod does
    // this via ON DELETE CASCADE on the FK.
    const tokens = readEmbedTokens();
    const keptTokens: EmbedTokenStore = {};

    for (const [raw, entry] of Object.entries(tokens)) {
      if (entry.dashboardId !== id) {
        keptTokens[raw] = entry;
      }
    }

    writeEmbedTokens(keptTokens);

    // Cascade — drop every share grant, version snapshot, and
    // annotation attached to this dashboard. Same rationale as the
    // embed-token cascade: production runs this via ON DELETE
    // CASCADE on the FK; the playground has to walk the stores by
    // hand.
    const grants = readShareGrants();
    const keptGrants: Record<string, DashboardShareGrant> = {};

    for (const [grantId, grant] of Object.entries(grants)) {
      if (grant.dashboardId !== id) {
        keptGrants[grantId] = grant;
      }
    }

    writeShareGrants(keptGrants);

    const versions = readVersionSnapshots();
    const keptVersions = versions.filter((entry) => entry.dashboardId !== id);

    writeVersionSnapshots(keptVersions);

    const annotations = readAnnotations();
    const keptAnnotations = annotations.filter((entry) => entry.dashboardId !== id);

    writeAnnotations(keptAnnotations);

    return Promise.resolve();
  }

  public async duplicate(id: string): Promise<Dashboard> {
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

  public async togglePin(id: string, next: boolean): Promise<Dashboard> {
    return this.update(id, { version: (await this.get(id)).version, isPinned: next });
  }

  public async setDefault(id: string): Promise<Dashboard> {
    return this.update(id, { version: (await this.get(id)).version, isDefault: true });
  }

  public async issueEmbedToken(id: string, input: IssueEmbedTokenInput): Promise<IssuedEmbedToken> {
    const dashboard = await this.get(id);

    if (dashboard.visibility !== "shared") {
      throw new Error(
        `Only shared dashboards can issue embed tokens — set "${dashboard.name}" to Shared first.`,
      );
    }

    const raw = randomToken();
    const kind = input.kind ?? "embed";

    // Hash the password (if any) before persisting — the raw string
    // is discarded after this point and never round-trips back to
    // the client. Playground uses SHA-256 because it ships without
    // a bundled Argon2 implementation; the backend spec upgrades to
    // Argon2id.
    const passwordHash = input.password ? await sha256Hex(input.password) : undefined;

    // Filter the extra-dashboards list down to sibling dashboards
    // the caller actually owns + shares. Silent-drop keeps issue
    // idempotent when the caller stapled a stale id, and prevents
    // a broadcast from leaking a dashboard the owner doesn't
    // control.
    const extraDashboardIds = await this.filterOwnedSharedIds(input.extraDashboardIds ?? [], id);

    // Phase-2/3/4 fields — silent-normalise so callers can dump
    // textareas straight into arrays without stripping whitespace
    // or empty lines. `undefined` = "not restricted / not set".
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
      createdAt: now(),
      kind,
      extraDashboardIds: extraDashboardIds.length > 0 ? extraDashboardIds : undefined,
      rotationSeconds: input.rotationSeconds,
      refreshMs: input.refreshMs,
      passwordHash,
      unlockSessionSeconds: input.unlockSessionSeconds,
      // Phase-2 access controls
      ipAllowlist,
      refererAllowlist,
      viewerEmailAllowlist,
      viewerDomainAllowlist,
      maxUses,
      // Phase-3 data protection
      watermark,
      disableCopy: input.disableCopy === true ? true : undefined,
      dataWindowFrom: input.dataWindowFrom?.trim() || undefined,
      dataWindowTo: input.dataWindowTo?.trim() || undefined,
      piiMask: input.piiMask === true ? true : undefined,
      // Phase-4 whitelabel
      whitelabel,
    };

    const store = readEmbedTokens();

    store[raw] = record;
    writeEmbedTokens(store);

    const origin = typeof window === "undefined" ? "" : window.location.origin;

    // New links land on `/broadcast/:token` — the gate-aware route.
    // The old `/embed/dashboard/:token` route continues to resolve
    // for links minted before the broadcast Phase-1 landing.
    return {
      ...record,
      rawToken: raw,
      embedUrl: `${origin}/broadcast/${raw}`,
    };
  }

  public async revokeEmbedToken(dashboardId: string, tokenId: string): Promise<void> {
    const store = readEmbedTokens();

    for (const [raw, entry] of Object.entries(store)) {
      if (entry.dashboardId === dashboardId && entry.id === tokenId) {
        store[raw] = { ...entry, revokedAt: now() };
      }
    }

    writeEmbedTokens(store);

    return Promise.resolve();
  }

  public async listEmbedTokens(dashboardId: string): Promise<readonly EmbedTokenRecord[]> {
    const store = readEmbedTokens();

    return Promise.resolve(
      Object.values(store).filter((entry) => entry.dashboardId === dashboardId),
    );
  }

  public async resolveEmbedToken(
    token: string,
    sessionKey?: string,
  ): Promise<PublicEmbedDashboard> {
    const store = readEmbedTokens();
    const entry = store[token];

    if (!entry) {
      throw new EmbedTokenInvalidError();
    }

    if (entry.revokedAt) {
      throw new EmbedTokenInvalidError();
    }

    if (entry.expiresAt && entry.expiresAt <= now()) {
      throw new EmbedTokenInvalidError();
    }

    // Password gate — every request against a password-protected
    // broadcast must carry a live session key. Wrong / missing /
    // expired session keys look identical to the caller so the gate
    // page can only prompt the viewer once per failure without
    // leaking which step failed.
    if (entry.passwordHash) {
      const session = sessionKey ? readUnlockSession(sessionKey) : null;

      const isLive = session !== null && session.token === token && session.expiresAt > now();

      if (!isLive) {
        throw new EmbedTokenPasswordRequiredError();
      }
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
      lastUsedAt: now(),
    };
    writeEmbedTokens(store);

    // Public embed sanitizer — see history in the prior implementation:
    // owner / tenant / version / share-level are deliberately omitted.
    const primary = this.sanitiseForEmbed(dashboard);

    // Broadcast presentation policy — carried alongside the payload
    // so the viewer honours the owner's cadence + rotation without
    // a second round-trip. Extra dashboards are resolved through
    // the same sanitiser; any that no longer resolve (deleted /
    // un-shared) drop silently rather than 404 the whole broadcast.
    const kind = entry.kind ?? "embed";
    let dashboards: readonly PublicEmbedDashboard[] | undefined;

    if (kind === "present" && entry.extraDashboardIds && entry.extraDashboardIds.length > 0) {
      const extras: PublicEmbedDashboard[] = [];

      for (const extraId of entry.extraDashboardIds) {
        try {
          const extra = await this.get(extraId);

          if (extra.visibility === "shared") {
            extras.push(this.sanitiseForEmbed(extra));
          }
        } catch {
          // Ignore — the primary dashboard still resolves.
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
        // Phase-3 protection fields — echoed so the viewer can render
        // the watermark / disable-copy / pii-mask overlays without a
        // second round-trip. `undefined` sentinels are preserved so
        // consumers can toggle behaviour off by re-issuing the token.
        watermark: entry.watermark,
        disableCopy: entry.disableCopy,
        dataWindowFrom: entry.dataWindowFrom,
        dataWindowTo: entry.dataWindowTo,
        piiMask: entry.piiMask,
        // Phase-4 whitelabel — the viewer needs the accent + logo
        // eagerly, so it rides along in the sanitised payload.
        whitelabel: entry.whitelabel,
      },
    };
  }

  public async unlockEmbedToken(
    token: string,
    input: UnlockEmbedTokenInput,
  ): Promise<UnlockedEmbedSession> {
    const store = readEmbedTokens();
    const entry = store[token];

    // Every failure path throws the same error so the gate page
    // cannot distinguish between "bad password", "unknown token",
    // and "revoked / expired". Enumeration protection.
    const genericFail = (): never => {
      throw new EmbedTokenInvalidError();
    };

    if (!entry || entry.revokedAt) return genericFail();
    if (entry.expiresAt && entry.expiresAt <= now()) return genericFail();
    if (!entry.passwordHash) return genericFail();

    const expected = entry.passwordHash;
    const actual = await sha256Hex(input.password);

    // Constant-time hex comparison so a timing side-channel doesn't
    // reveal password prefixes. Playground: SHA-256 hex strings are
    // fixed 64 chars so the constant-time compare is trivially
    // uniform.
    if (!constantTimeEquals(expected, actual)) return genericFail();

    const ttlSec = entry.unlockSessionSeconds ?? 3600;
    const sessionKey = randomToken();
    const expiresAt = new Date(Date.now() + ttlSec * 1000).toISOString();

    writeUnlockSession(sessionKey, {
      token,
      expiresAt,
    });

    return { sessionKey, expiresAt };
  }

  /**
   * Filter a caller-supplied list of dashboard ids down to those the
   * current owner actually owns AND has flipped to `visibility ===
   * "shared"`. Silent-drop keeps issue idempotent when the caller
   * stapled a stale id, and prevents a broadcast from cycling a
   * dashboard the operator has since un-shared.
   *
   * The `primaryId` argument is excluded from the returned list —
   * the primary dashboard always leads the rotation and shouldn't
   * appear twice in a viewer's cycle.
   */
  private async filterOwnedSharedIds(ids: readonly string[], primaryId: string): Promise<string[]> {
    const owned = await this.list();
    const ownedSharedById = new Map<string, Dashboard>();

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

  /** Redact a Dashboard down to its public-facing shape. */
  private sanitiseForEmbed(dashboard: Dashboard): PublicEmbedDashboard {
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

  /** Synthesise the built-in dashboards for the current owner. */
  private builtIns(): Dashboard[] {
    return [
      buildOverviewDashboard(this.ownerId, this.tenantId, widgetSpan),
      buildAnalyticsDashboard(this.ownerId, this.tenantId, widgetSpan),
    ];
  }

  // -------------------------------------------------------------------------
  // Share grants — the role-based access surface layered on top of
  // {@link Dashboard.shareLevel}. Grants persist in a global map keyed
  // by grant id so the cascade path and the viewer's access check both
  // stay single-key reads.
  // -------------------------------------------------------------------------

  public async listShareGrants(dashboardId: string): Promise<readonly DashboardShareGrant[]> {
    const store = readShareGrants();
    // Filter by owning dashboard, then sort by grant time so the
    // dialog renders the newest grants at the top. `Array.sort` is
    // stable across every browser we support, so ties (same
    // millisecond) preserve insertion order.
    const grants = Object.values(store).filter((entry) => entry.dashboardId === dashboardId);

    grants.sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));

    return Promise.resolve(grants);
  }

  public async addShareGrant(
    dashboardId: string,
    input: CreateShareGrantInput,
  ): Promise<DashboardShareGrant> {
    // Confirm the dashboard exists — mirrors the production
    // behaviour where the FK check happens server-side. Trying to
    // grant against a missing dashboard is a client-side bug worth
    // failing loudly on.
    await this.get(dashboardId);

    const store = readShareGrants();

    // Idempotency: a grant is uniquely identified by
    // `(dashboardId, targetType, targetId)`. Re-granting the same
    // triple returns the existing record verbatim rather than
    // minting a duplicate row.
    const existing = Object.values(store).find(
      (entry) =>
        entry.dashboardId === dashboardId &&
        entry.targetType === input.targetType &&
        entry.targetId === input.targetId,
    );

    if (existing) {
      return existing;
    }

    const grant: DashboardShareGrant = {
      id: randomId(),
      dashboardId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      // The playground has no auth surface yet; every mutation
      // attributes itself to the singleton owner id.
      grantedBy: this.ownerId,
      grantedAt: now(),
    };

    store[grant.id] = grant;
    writeShareGrants(store);

    return grant;
  }

  public async removeShareGrant(grantId: string): Promise<void> {
    const store = readShareGrants();

    // Idempotent: unknown ids resolve as a no-op so the UI can
    // revoke without pre-fetching. Matches the semantic of the
    // production DELETE endpoint returning 204 on both hit + miss.
    if (grantId in store) {
      delete store[grantId];
      writeShareGrants(store);
    }

    return Promise.resolve();
  }

  // -------------------------------------------------------------------------
  // Version snapshots — dashboards persist a rolling window of
  // {@link VERSIONS_PER_DASHBOARD} snapshots. Snapshots are appended
  // on every mutating write and consumed by the version-history UI.
  // -------------------------------------------------------------------------

  public async listVersions(dashboardId: string): Promise<readonly DashboardVersionSnapshot[]> {
    const entries = readVersionSnapshots().filter((entry) => entry.dashboardId === dashboardId);

    // Newest first — the history dialog renders in reverse-chronological
    // order and localStorage doesn't guarantee append-only writes on
    // its own after a JSON serialize / deserialize.
    entries.sort((a, b) => b.changedAt.localeCompare(a.changedAt));

    return Promise.resolve(entries);
  }

  public async restoreVersion(dashboardId: string, versionId: string): Promise<Dashboard> {
    const entries = readVersionSnapshots();
    const target = entries.find(
      (entry) => entry.dashboardId === dashboardId && entry.id === versionId,
    );

    if (!target) {
      throw new DashboardNotFoundError(versionId);
    }

    // Restoring goes through `update()` so the optimistic-lock
    // path stays honest — a concurrent editor in another tab is
    // still guarded against and the version counter still bumps
    // monotonically.
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

  // -------------------------------------------------------------------------
  // Widget annotations — plain-text notes pinned to a widget
  // instance. Owner-private; the public embed path never surfaces
  // annotations regardless of the dashboard's visibility.
  // -------------------------------------------------------------------------

  public async listAnnotations(dashboardId: string): Promise<readonly WidgetAnnotation[]> {
    const entries = readAnnotations().filter((entry) => entry.dashboardId === dashboardId);

    // Oldest first — the widget-hover pin shows a stack of notes in
    // conversational order (top = oldest, bottom = latest).
    entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return Promise.resolve(entries);
  }

  public async addAnnotation(
    dashboardId: string,
    widgetInstanceId: string,
    body: string,
  ): Promise<WidgetAnnotation> {
    // Confirm the dashboard exists so the annotation isn't orphaned
    // — the same FK-check pattern we use for grants.
    await this.get(dashboardId);

    const annotation: WidgetAnnotation = {
      id: randomId(),
      widgetInstanceId,
      dashboardId,
      // Playground stub — swaps to the real user display name when
      // the auth surface lands.
      author: "You",
      body,
      createdAt: now(),
    };

    const entries = readAnnotations();

    writeAnnotations([...entries, annotation]);

    return annotation;
  }

  public async updateAnnotation(annotationId: string, body: string): Promise<WidgetAnnotation> {
    const entries = readAnnotations();
    const index = entries.findIndex((entry) => entry.id === annotationId);

    if (index < 0) {
      throw new DashboardNotFoundError(annotationId);
    }

    const target = entries[index];

    if (!target) {
      throw new DashboardNotFoundError(annotationId);
    }

    const updated: WidgetAnnotation = {
      ...target,
      body,
      updatedAt: now(),
    };
    const next = entries.slice();

    next[index] = updated;
    writeAnnotations(next);

    return updated;
  }

  public async removeAnnotation(annotationId: string): Promise<void> {
    const entries = readAnnotations();
    const next = entries.filter((entry) => entry.id !== annotationId);

    if (next.length !== entries.length) {
      writeAnnotations(next);
    }

    return Promise.resolve();
  }

  // -------------------------------------------------------------------------
  // Broadcast Phase-6 — audit log.
  //
  // The localStorage playground has no real audit trail — every
  // resolve call touches the token record in-place rather than
  // appending an immutable event row. Returning an empty array
  // keeps consumers honest (they see the empty state until the
  // backend lands) without forcing the UI to branch on a null.
  // -------------------------------------------------------------------------

  public async listBroadcastViewLog(
    embedTokenId: string,
  ): Promise<readonly BroadcastViewLogRecord[]> {
    // Playground stub — the localStorage adapter does not maintain
    // an audit trail. `embedTokenId` is accepted so the signature
    // matches the production API; production ships GET
    // `/api/dashboards/{userDashboard}/embed-tokens/{tokenId}/view-log`.
    void embedTokenId;

    return Promise.resolve([]);
  }

  // -------------------------------------------------------------------------
  // Broadcast Phase-7 — rotation.
  //
  // Mint a fresh token inheriting every field from the source and
  // mark the source with a grace window so any in-flight viewer
  // sessions don't 404 mid-slideshow.
  // -------------------------------------------------------------------------

  public async rotateEmbedToken(
    dashboardId: string,
    tokenId: string,
    graceSeconds: number,
  ): Promise<IssuedEmbedToken> {
    const store = readEmbedTokens();
    // Find the source record by its owning dashboard + id so a
    // stale token id from another dashboard doesn't accidentally
    // rotate the wrong link.
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
    // inherits every field (kind, refresh, protection, whitelabel,
    // …) verbatim. The password can't be reused since we only kept
    // the digest, so a rotated password-gated link ships without a
    // gate — the operator can re-issue with a new password if they
    // want the gate back. Mirrors the backend contract.
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
    // don't clobber the entry `issueEmbedToken` just wrote for the
    // successor.
    const nextStore = readEmbedTokens();
    const existing = nextStore[sourceRaw];

    if (existing) {
      const clampedGrace = Number.isFinite(graceSeconds) && graceSeconds > 0 ? graceSeconds : 0;
      const graceExpiresAt = new Date(Date.now() + clampedGrace * 1000).toISOString();

      nextStore[sourceRaw] = {
        ...existing,
        supersededByTokenId: issued.id,
        graceExpiresAt,
      };
      writeEmbedTokens(nextStore);
    }

    return issued;
  }

  // -------------------------------------------------------------------------
  // Broadcast Phase-7 — templates.
  //
  // The playground exposes a per-user visibility rule: private
  // templates are only surfaced to their creator, shared ones are
  // visible to every user in the tenant. In production the
  // ownership + tenant scope come from the API.
  // -------------------------------------------------------------------------

  public async listBroadcastTemplates(): Promise<readonly BroadcastTemplate[]> {
    const store = readBroadcastTemplates();
    // Sort by `updatedAt` desc so a freshly-saved template lands
    // at the top of the picker.
    const list = Object.values(store);

    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return Promise.resolve(list);
  }

  public async createBroadcastTemplate(
    input: CreateBroadcastTemplateInput,
  ): Promise<BroadcastTemplate> {
    const name = input.name.trim();

    if (!name) {
      throw new Error("Template name is required.");
    }

    const store = readBroadcastTemplates();
    const timestamp = now();
    const template: BroadcastTemplate = {
      id: randomId(),
      name,
      description: input.description?.trim() || undefined,
      icon: input.icon?.trim() || undefined,
      // Persist the config verbatim; every field is optional so
      // downstream consumers merge with their own form defaults.
      config: input.config,
      isShared: input.isShared === true,
      useCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store[template.id] = template;
    writeBroadcastTemplates(store);

    return template;
  }

  public async deleteBroadcastTemplate(id: string): Promise<void> {
    const store = readBroadcastTemplates();

    if (id in store) {
      delete store[id];
      writeBroadcastTemplates(store);
    }

    return Promise.resolve();
  }

  // -------------------------------------------------------------------------
  // Broadcast Phase-7 — bulk revoke.
  //
  // The preview + apply paths share `matchingTokens` so the count
  // rendered in the modal and the count reported in the toast can
  // never drift out of sync (a common bug when preview + apply are
  // implemented as two independent filters).
  // -------------------------------------------------------------------------

  public async previewBulkRevoke(filters: BulkRevokeFilters): Promise<BulkRevokeResult> {
    return Promise.resolve({ revoked: this.matchingTokens(filters).length });
  }

  public async bulkRevokeEmbedTokens(filters: BulkRevokeFilters): Promise<BulkRevokeResult> {
    const store = readEmbedTokens();
    const matching = this.matchingTokens(filters);
    const timestamp = now();
    let revoked = 0;

    for (const [raw, entry] of matching) {
      // Idempotent — already-revoked entries are still counted
      // by the preview so the "This will affect N" number matches
      // the user's mental model of "tokens the filter selects",
      // not "tokens the filter will change". The toast still
      // reports the *changed* count so the operator can spot a
      // no-op run.
      if (!entry.revokedAt) {
        store[raw] = { ...entry, revokedAt: timestamp };
        revoked += 1;
      }
    }

    if (revoked > 0) {
      writeEmbedTokens(store);
    }

    return { revoked };
  }

  /**
   * Compute the set of tokens matching a bulk-revoke filter. Kept
   * private + shared between `preview` and `apply` so the two
   * paths cannot diverge.
   *
   * Returns `[rawToken, record]` tuples so `bulkRevokeEmbedTokens`
   * can write directly against the same map without a second
   * lookup.
   *
   * `ownerId` is currently a no-op — the playground token store
   * doesn't record the issuer. When the backend lands the resolver
   * will scope by the issuer's user id. We leave the field in the
   * type contract now so the UI shape doesn't churn later.
   */
  private matchingTokens(filters: BulkRevokeFilters): [string, EmbedTokenStoreEntry][] {
    const store = readEmbedTokens();
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
      // `ownerId` is stubbed — see the comment on the private
      // method. When the token store grows an issuer field this
      // branch narrows the results by owner.

      results.push([raw, entry]);
    }

    return results;
  }
}

/**
 * Singleton storage instance for the playground. Consumers import
 * this rather than the class so the identity binding stays private.
 * Swapping the backend is a one-line change here.
 */
export const dashboardStorage: DashboardStorageAdapter = new LocalStorageDashboardStorage(
  PLAYGROUND_OWNER_ID,
  PLAYGROUND_TENANT_ID,
);

/**
 * Widget-catalogue projection used by the customise panel's "Add
 * widget" drawer. Returns every catalogue entry — the caller filters
 * against the current dashboard's widget instances to distinguish
 * "already added" from "available".
 */
export function catalogueWidgets(): readonly WidgetEntry[] {
  return WIDGET_CATALOGUE;
}
