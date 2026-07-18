/**
 * @file types.ts
 * @module modules/dashboard/dashboards/types
 *
 * @description
 * Domain types for the per-user dashboard system — the playground's
 * implementation of the plan agreed on the design pass. A dashboard is
 * a JSON document owned by a user; the tenant may host many. Built-in
 * dashboards (Overview, Analytics) are always present and read-only.
 *
 * These types are the **wire shape** intended to map 1:1 onto the
 * Laravel `user_dashboards` table (see
 * `backend/modules/Dashboard/src/Contracts/UserDashboardInterface.php`).
 * The playground stores the same shape in `localStorage` so the swap
 * from local persistence to Refine's data-provider is a single-file
 * change (`storage.ts`).
 *
 * ## Design guardrails
 *
 *   * **Optimistic locking** — every mutating operation carries a
 *     `version`. The storage layer rejects stale writes with a
 *     dedicated error class so the UI can surface a merge conflict.
 *   * **Widget instances, not widget keys** — the same widget can
 *     appear multiple times per dashboard with different configs.
 *     Layouts reference an instance `id`, so drag-and-drop stays
 *     unambiguous.
 *   * **Immutable IO** — collection fields on {@link Dashboard} are
 *     `readonly` so consumers must clone before mutation; the editor
 *     hook centralises those clones inside a controlled reducer.
 *   * **Built-ins live in memory** — the storage layer never
 *     persists built-in records; they're synthesised on read so a
 *     future schema change is a code edit, not a data migration.
 */

/**
 * Which responsive breakpoint the widget grid is currently rendering
 * against. Matches react-grid-layout's convention of one layout array
 * per breakpoint.
 */
export type DashboardBreakpoint = "lg" | "md" | "sm";

/**
 * Visibility scope for a dashboard.
 *
 *   * `private` — only the owner can see the dashboard.
 *   * `shared` — every user in the tenant with the `dashboards.viewAll`
 *     permission can see the dashboard. Embed tokens can only be
 *     issued on shared dashboards.
 */
export type DashboardVisibility = "private" | "shared";

/**
 * In-app access scope layered on top of {@link DashboardVisibility}.
 * The two axes serve different concerns and stay orthogonal:
 *
 *   * `visibility` governs **embed-token issue** — only `"shared"`
 *     dashboards can mint public embed links.
 *   * `shareLevel` governs **in-app access** — who sees the
 *     dashboard in the tenant sidebar / palette / listing surfaces.
 *
 * Values:
 *
 *   * `private` — only the owner sees it in-app. Default for every
 *     new dashboard.
 *   * `shared` — every authenticated tenant member sees it.
 *   * `role-restricted` — only users matching a
 *     {@link DashboardShareGrant} (by role, individual id, or the
 *     `everyone` sentinel) see it in-app. Embed links continue to
 *     work per `visibility` — they bypass this rule and are publicly
 *     reachable.
 */
export type DashboardShareLevel = "private" | "shared" | "role-restricted";

/**
 * A single access grant for a `role-restricted` dashboard. Grants
 * are additive — a user matching any grant sees the dashboard. The
 * `targetType` discriminates the semantics of {@link targetId}:
 *
 *   * `role` — `targetId` is a role slug (e.g. `"coach"`).
 *   * `user` — `targetId` is a stable user id.
 *   * `everyone` — `targetId` is the literal `"*"`; the grant
 *     matches every tenant member. Handy for temporarily opening a
 *     restricted dashboard without discarding the grant list.
 *
 * {@link targetLabel} is the human-readable form persisted alongside
 * the id so the share dialog can render the grant list without an
 * extra fetch. Kept immutable at grant time — renames on the
 * backing user / role don't retroactively update the grant.
 */
export interface DashboardShareGrant {
  /** UUID primary key. */
  id: string;
  /** Owning dashboard. Cascade-deleted with the dashboard row. */
  dashboardId: string;
  /** Target kind — see the note above. */
  targetType: "role" | "user" | "everyone";
  /** Role slug, user id, or `"*"` for `everyone`. */
  targetId: string;
  /** Display label frozen at grant time ("Coaches", "Alex Morgan", …). */
  targetLabel: string;
  /** User id of the granter — used by the audit log. */
  grantedBy: string;
  /** ISO-8601 when the grant was minted. */
  grantedAt: string;
}

/**
 * Layout engine mode.
 *
 *   * `grid` — react-grid-layout style drag-and-drop grid. Default.
 *   * `flow` — vertical stack of full-width widgets. Report-oriented.
 */
export type DashboardLayoutMode = "grid" | "flow";

/**
 * Spacing density preset applied to the dashboard canvas. Sits
 * orthogonal to {@link DashboardLayoutMode} — layout mode picks
 * *shape*, density picks *breathing room*.
 *
 *   * `compact`     — tightest grid gaps. Ideal for information-
 *                    dense dashboards where the operator scans many
 *                    widgets at once (e.g. a control tower view).
 *   * `cozy`        — the default. Balanced spacing that reads well
 *                    at 1440px without feeling cramped.
 *   * `comfortable` — extra breathing room for presentation surfaces
 *                    (large monitors, projected slideshows) where
 *                    the extra whitespace anchors each widget.
 *
 * Persisted through {@link Dashboard.density}. Consumers should
 * treat `undefined` on read as `"cozy"` so old dashboards keep
 * rendering unchanged after the field ships.
 */
export type DashboardDensity = "compact" | "cozy" | "comfortable";

/**
 * A single widget instance placed on a dashboard.
 *
 * The `widgetType` matches a key registered in the widget catalogue
 * (`widgets.catalogue.ts`). Two instances of the same widget type are
 * legal — each has its own `id` and independent `config`.
 */
export interface WidgetInstance {
  /** Instance identifier (UUID). Stable across layout edits. */
  id: string;
  /** Catalogue key — matches a widget renderer entry. */
  widgetType: string;
  /**
   * Optional user-facing title override. When absent, the widget
   * renders the catalogue's default title.
   */
  title?: string;
  /**
   * Widget-specific configuration payload. Shape is opaque to the
   * dashboard framework — every widget owns its own runtime schema.
   */
  config?: Record<string, unknown>;
  /**
   * Per-instance filter override (task F3). When present, the
   * widget renders against these filters *instead of* the
   * dashboard-level {@link Dashboard.filters}. Dashboard-level
   * filters are treated as **defaults** the operator can override
   * for a single tile without changing the surrounding page
   * (useful for comparison boards — same widget, different scope).
   *
   * Leave `undefined` to inherit the dashboard-level filters
   * verbatim. An empty object (`{}`) resets every override without
   * discarding the field — handy for the drawer's Reset action.
   */
  filters?: DashboardFilters;
}

/**
 * A single layout entry — describes where and how a widget renders
 * inside the responsive grid at a given breakpoint. Coordinates are
 * grid-column / grid-row units.
 */
export interface LayoutItem {
  /** Reference to {@link WidgetInstance.id}. */
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

/**
 * Optional dashboard-level filters propagated to every opted-in
 * widget. Widgets that don't opt in ignore these fields.
 */
export interface DashboardFilters {
  /** ISO-8601 inclusive start date. */
  dateFrom?: string;
  /** ISO-8601 inclusive end date. */
  dateTo?: string;
  /** Scope overrides — pin a dashboard to a specific slice. */
  scope?: {
    organizationId?: string;
    branchId?: string;
    seasonId?: string;
    cohortId?: string;
  };
}

/**
 * The full dashboard document — the shape the backend serialises out
 * of `user_dashboards` and the shape the storage adapter reads /
 * writes to localStorage.
 */
export interface Dashboard {
  /** UUID primary key. */
  id: string;
  /** Owning tenant (server-enforced in production). */
  tenantId: string;
  /** Owner user id. */
  ownerId: string;

  /** Human-facing name. */
  name: string;
  /** URL slug — `/dashboard/{slug}` resolves to this dashboard. */
  slug: string;
  /** Iconify token from the shared icon set. Optional. */
  icon?: string;
  /**
   * Accent color from the palette — any HeroUI semantic token
   * (`accent`, `success`, `danger`) or a hand-picked hex. Optional.
   */
  color?: string;

  visibility: DashboardVisibility;
  /**
   * In-app access scope. Defaults to `"private"`. See
   * {@link DashboardShareLevel} for the axis compared to
   * {@link visibility}.
   */
  shareLevel: DashboardShareLevel;
  isPinned: boolean;
  isDefault: boolean;
  /**
   * Whether the dashboard is built into the app rather than
   * persisted. Built-ins (`Overview`, `Analytics`) can be viewed but
   * never renamed, deleted, or reordered.
   */
  isBuiltIn: boolean;

  layoutMode: DashboardLayoutMode;
  /**
   * Spacing density applied to the widget canvas. Optional so a
   * dashboard document written before the field shipped still
   * parses — every read path defaults `undefined` to `"cozy"`. See
   * {@link DashboardDensity} for the semantic tiers.
   */
  density?: DashboardDensity;
  layouts: Record<DashboardBreakpoint, readonly LayoutItem[]>;
  widgets: readonly WidgetInstance[];
  filters?: DashboardFilters;

  /**
   * Optimistic-locking version. Increments on every mutating
   * operation. Passed on every update; a mismatch throws
   * {@link OptimisticLockError}.
   */
  version: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Snapshot of a dashboard at a specific `version`. Snapshots are
 * written by the storage adapter **before** every mutating call
 * (`update` and `remove`), plus one more when the user explicitly
 * restores an older version — the restore itself is a mutation, so
 * the pre-restore state is captured too. That guarantees the
 * version-history list is always append-only: nothing the user
 * does in the editor can drop a snapshot that was already recorded.
 *
 * We store the **full dashboard document** (denormalised) rather
 * than a diff so a restore is a single write — no rebuild-from-log
 * pass, no dependency on preceding snapshots. Storage is small
 * (a few KB per snapshot); the cap at 50 per dashboard is enough
 * for real usage without ballooning localStorage.
 *
 * `summary` is a short, human-facing "what changed" string computed
 * by the adapter (`"Renamed to Athletics Ops"`, `"Added 2 widgets"`,
 * `"Restored from v3"`). It powers the version-history dialog list
 * without forcing the UI to diff two blobs at render time.
 */
export interface DashboardVersionSnapshot {
  /** Version-record UUID — stable identifier for the snapshot. */
  id: string;
  /** FK back to the owning dashboard. */
  dashboardId: string;
  /** Matches the value of {@link Dashboard.version} at snapshot time. */
  version: number;
  /** Full dashboard document at that version — denormalised for O(1) restore. */
  snapshot: Dashboard;
  /** ISO-8601 timestamp of the mutation that prompted the snapshot. */
  changedAt: string;
  /** Optional actor id — the playground uses `"playground-user"`. */
  changedBy?: string;
  /** Short "what changed" string; used verbatim in the history list. */
  summary?: string;
}

/**
 * A single note pinned to a widget instance. Owner-private: the
 * public embed viewer never sees these regardless of the dashboard's
 * visibility. Field ordering intentionally mirrors
 * {@link DashboardVersionSnapshot} — audit metadata (`author`,
 * `createdAt`, `updatedAt`) sits after the payload so a future
 * backend swap can drop them into an `audit_*` join without
 * touching the type contract.
 */
export interface WidgetAnnotation {
  /** UUID primary key. */
  id: string;
  /** Reference to {@link WidgetInstance.id}. */
  widgetInstanceId: string;
  /** Reference to {@link Dashboard.id} — indexes the cascade path. */
  dashboardId: string;
  /** Author display label — the playground uses `"You"`. */
  author: string;
  /** Plain-text note body. Markdown is rendered as-is (no XSS today). */
  body: string;
  /** ISO-8601 timestamp — when the annotation was created. */
  createdAt: string;
  /** ISO-8601 timestamp — set on every edit. Absent on brand-new records. */
  updatedAt?: string;
}

/**
 * The delivery format a broadcast serves.
 *
 *   * `embed`   — single dashboard rendered inline, chromeless.
 *                 The historical `/embed/dashboard/:token` shape.
 *   * `present` — full-viewport kiosk slideshow that rotates
 *                 through the `dashboardIds` list on the configured
 *                 `rotationSeconds` cadence.
 */
export type BroadcastKind = "embed" | "present";

/** Public embed / broadcast token metadata (raw token only returned once). */
export interface EmbedTokenRecord {
  id: string;
  dashboardId: string;
  label?: string;
  /** ISO-8601 expiry; `undefined` = never expires. */
  expiresAt?: string;
  revokedAt?: string;
  lastUsedAt?: string;
  useCount: number;
  createdAt: string;

  // ------------------------------------------------------------------
  // Broadcast Phase-7 — rotation
  //
  // A rotate operation mints a **new** token record and keeps the
  // current one alive for a grace period so any in-flight viewer
  // sessions don't 404 mid-slideshow. The two fields below are set
  // on the *old* record at rotate-time: `supersededByTokenId`
  // points at the freshly-minted successor, and `graceExpiresAt`
  // marks the wall-clock at which the resolver will start refusing
  // requests against the superseded link.
  // ------------------------------------------------------------------

  /**
   * When set, points at the {@link EmbedTokenRecord.id} of the token
   * that superseded this one via a rotation. Callers rendering the
   * "Existing links" list can badge these rows as "rotated" and
   * link the operator to the successor without a second fetch.
   */
  supersededByTokenId?: string;

  /**
   * ISO-8601 wall-clock at which the resolver will treat a
   * superseded link as expired. Independent of the link's own
   * {@link expiresAt} so an owner can rotate a "never expires"
   * link and still grant a short grace window.
   */
  graceExpiresAt?: string;

  // ------------------------------------------------------------------
  // Broadcast Phase-1 extensions
  //
  // Every field below is optional — the historical `embed` broadcast
  // path continues to work without any of them set. When a caller
  // opts into a field, the resolver enforces it before returning
  // the dashboard payload.
  // ------------------------------------------------------------------

  /**
   * Broadcast delivery format. Defaults to `"embed"` when omitted
   * so the historical single-dashboard, chromeless embed path stays
   * the zero-config option.
   */
  kind?: BroadcastKind;

  /**
   * Additional dashboards the broadcast should cycle through when
   * `kind === "present"`. `dashboardId` remains the "primary"
   * dashboard (rendered first); extras trail it in order.
   */
  extraDashboardIds?: readonly string[];

  /**
   * Auto-rotation cadence in seconds when `kind === "present"`.
   * Ignored by `embed`. Defaults to 30s at consumption time.
   */
  rotationSeconds?: number;

  /**
   * Auto-refresh cadence in **milliseconds**. `0` (or omitted)
   * disables refresh. Applies to every kind — the viewer polls
   * the resolve endpoint at this interval so long-running kiosks
   * pick up dashboard edits without a manual reload.
   */
  refreshMs?: number;

  /**
   * Argon2id (playground: SHA-256) hex digest of the broadcast
   * password. `undefined` means no password gate. The raw password
   * is never persisted — only the digest, so a database dump does
   * not leak passwords.
   */
  passwordHash?: string;

  /**
   * When `passwordHash` is set, the gate page grants an unlock
   * cookie valid for this many seconds before the viewer must
   * re-enter the password. Defaults to 3600 (1h) at consumption
   * time. Kept per-broadcast so a high-sensitivity link can force
   * a shorter session than a public marketing embed.
   */
  unlockSessionSeconds?: number;

  // ------------------------------------------------------------------
  // Broadcast Phase-2 — access controls
  //
  // Every list defaults to "no restriction" when omitted. A caller
  // opting in narrows the audience; the resolver rejects requests
  // that don't match at least one entry per configured list.
  // ------------------------------------------------------------------

  /**
   * IP allowlist expressed as CIDR strings (`10.0.0.0/8`,
   * `2001:db8::/32`, single-address `1.2.3.4/32`). When populated,
   * the resolver only serves the payload to viewers whose remote IP
   * matches one of the ranges. The frontend stores the raw strings
   * verbatim; the backend normalises + validates them at issue time.
   */
  ipAllowlist?: readonly string[];

  /**
   * Referer allowlist expressed as URL prefixes
   * (`https://partner.example.com/`, `https://intra.corp/`). When
   * populated, the resolver only serves the payload to viewers whose
   * `Referer` header starts with one of the prefixes. Wildcard-free
   * on purpose — the operator writes the origin they trust.
   */
  refererAllowlist?: readonly string[];

  /**
   * Viewer-email allowlist for the (future) magic-link viewer flow.
   * When populated together with `viewerDomainAllowlist`, either
   * match unlocks the payload. Individual entries are lowercased +
   * trimmed at issue time.
   */
  viewerEmailAllowlist?: readonly string[];

  /**
   * Viewer-domain allowlist for the (future) magic-link viewer flow.
   * Entries are bare domains (`example.com`, `partner.example.com`) —
   * the resolver matches suffixes so `partner.example.com` also
   * grants `client.partner.example.com`.
   */
  viewerDomainAllowlist?: readonly string[];

  /**
   * Hard cap on the number of successful resolves before the token
   * revokes itself. `undefined` (or `0`) means unlimited. Useful for
   * one-time investor decks: `maxUses = 1` mints a single-use link.
   */
  maxUses?: number;

  // ------------------------------------------------------------------
  // Broadcast Phase-3 — data protection
  //
  // Rendered by the viewer only; the resolver echoes the fields back
  // in the sanitised payload so the presentation layer can honour
  // them without pulling additional data.
  // ------------------------------------------------------------------

  /**
   * Diagonal watermark overlaid on the viewer surface. `text`
   * supports `{brand}` and `{date}` substitutions at render time.
   * When `enabled` is `false` the watermark is not rendered even
   * if `text` is set — matches the Phase-3 spec where the toggle
   * is the source of truth.
   */
  watermark?: { enabled: boolean; text?: string };

  /**
   * When `true`, the viewer disables the right-click menu, drag
   * gestures, and text selection, plus surfaces a toast when a
   * screenshot key is detected. Best-effort — browsers cannot
   * reliably prevent screenshots.
   */
  disableCopy?: boolean;

  /**
   * ISO-8601 date bounding the earliest data point the viewer may
   * see. Widgets that opt into date filtering intersect this with
   * their own configured range.
   */
  dataWindowFrom?: string;

  /**
   * ISO-8601 date bounding the latest data point the viewer may
   * see. Same intersection rule as `dataWindowFrom`.
   */
  dataWindowTo?: string;

  /**
   * When `true`, widgets that render viewer PII (names, emails) add
   * `pii-name` / `pii-email` classes so a viewer-side blur filter
   * masks the values. Hovering an element reveals it (documented,
   * intentional escape hatch for legitimate one-off lookups).
   */
  piiMask?: boolean;

  // ------------------------------------------------------------------
  // Broadcast Phase-4 — presentation / whitelabel
  //
  // Optional owner-supplied branding that overrides the app chrome
  // on the viewer surface. When absent, the viewer falls back to
  // Academorix branding (BrandIsotipo + brand.name).
  // ------------------------------------------------------------------

  /**
   * Owner-configured whitelabel overrides applied to the viewer's
   * header + accent color. Every field is optional so the owner
   * can supply just a logo, just a welcome message, or the full
   * kit. Kept as a nested object rather than three flat fields so
   * the sanitised payload's shape is stable when whitelabelling is
   * off.
   */
  whitelabel?: {
    /** Logo URL served in place of the Academorix isotipo. */
    logoUrl?: string;
    /**
     * Accent color as a hex string (`#ff8800`) or any CSS color the
     * runtime resolves. Applied as `--accent` on the viewer root
     * so child components inherit it via the token cascade.
     */
    accent?: string;
    /** Header welcome copy replacing the default "brand · dashboard" chip. */
    welcomeText?: string;
  };
}

/**
 * Freshly-issued embed token — returned once by the issue call. The
 * raw token is never persisted (in prod: only its SHA-256 digest is).
 */
export interface IssuedEmbedToken extends EmbedTokenRecord {
  rawToken: string;
  /** Full URL the user can copy — origin + embed route + token. */
  embedUrl: string;
}

/**
 * Public embed / broadcast payload — the redacted shape the
 * unauthenticated viewer receives. Never carries owner id, tenant
 * id, or version.
 */
export interface PublicEmbedDashboard {
  name: string;
  icon?: string;
  color?: string;
  layoutMode: DashboardLayoutMode;
  layouts: Record<DashboardBreakpoint, readonly LayoutItem[]>;
  widgets: readonly WidgetInstance[];
  filters?: DashboardFilters;
  visibility: DashboardVisibility;
  updatedAt: string;

  /**
   * Presentation policy carried alongside the payload so the
   * viewer can honour the broadcast owner's refresh cadence and
   * present-mode rotation without a second request.
   */
  broadcast?: {
    kind: BroadcastKind;
    refreshMs?: number;
    rotationSeconds?: number;
    /**
     * The full ordered list of dashboards the viewer should cycle
     * through. Includes the primary dashboard as its first entry.
     * `present` mode uses this; `embed` mode ignores it.
     */
    dashboards?: readonly PublicEmbedDashboard[];

    // ----------------------------------------------------------------
    // Phase-3 data-protection echoes — the resolver copies these
    // fields from the token record so the viewer can render the
    // corresponding overlays without a second round-trip. Phase-2
    // access controls are enforced server-side and NOT echoed here
    // (an attacker inspecting the payload should not learn the
    // guardrails). Phase-4 whitelabel is echoed because the viewer
    // needs the accent / logo to render at all.
    // ----------------------------------------------------------------

    /**
     * Diagonal watermark overlay policy. `enabled === true` renders
     * the watermark; `text` supports `{brand}` + `{date}` tokens.
     */
    watermark?: { enabled: boolean; text?: string };

    /** Disable copy / drag / text selection on the viewer surface. */
    disableCopy?: boolean;

    /** ISO-8601 lower bound for widget data. */
    dataWindowFrom?: string;

    /** ISO-8601 upper bound for widget data. */
    dataWindowTo?: string;

    /**
     * When `true`, viewer blurs `.pii-name` / `.pii-email` elements.
     * Opt-in per widget — widgets that don't add the class stay
     * un-masked.
     */
    piiMask?: boolean;

    /**
     * Owner-configured whitelabel overrides applied to the viewer's
     * header + accent color.
     */
    whitelabel?: {
      logoUrl?: string;
      accent?: string;
      welcomeText?: string;
    };
  };
}

/** Payload for creating a new dashboard. */
export interface CreateDashboardInput {
  name: string;
  icon?: string;
  color?: string;
  visibility?: DashboardVisibility;
  /**
   * Initial in-app access scope. Defaults to `"private"`. Grants can
   * be added afterwards via the share dialog.
   */
  shareLevel?: DashboardShareLevel;
  layoutMode?: DashboardLayoutMode;
  /**
   * Initial spacing density. Defaults to `"cozy"` when omitted so
   * new dashboards match the rest of the app out of the gate.
   */
  density?: DashboardDensity;
  fromTemplate?: string;
  duplicateOf?: string;
}

/** Partial-update payload; `version` is required for optimistic lock. */
export interface UpdateDashboardInput {
  version: number;
  name?: string;
  slug?: string;
  icon?: string;
  color?: string;
  visibility?: DashboardVisibility;
  /** In-app access scope. */
  shareLevel?: DashboardShareLevel;
  isPinned?: boolean;
  isDefault?: boolean;
  layoutMode?: DashboardLayoutMode;
  /** Density preset — see {@link DashboardDensity}. */
  density?: DashboardDensity;
  layouts?: Record<DashboardBreakpoint, readonly LayoutItem[]>;
  widgets?: readonly WidgetInstance[];
  filters?: DashboardFilters;
}

/** Payload for issuing an embed / broadcast token. */
export interface IssueEmbedTokenInput {
  label?: string;
  /** ISO-8601 expiry. Omit for never-expires. */
  expiresAt?: string;

  // ------------------------------------------------------------------
  // Broadcast Phase-1 extensions — mirror {@link EmbedTokenRecord}
  // fields. Every one is optional; the historical zero-arg issue
  // still mints a plain chromeless embed link.
  // ------------------------------------------------------------------
  kind?: BroadcastKind;
  /** Extra dashboards to include in the present-mode rotation. */
  extraDashboardIds?: readonly string[];
  /** Rotation cadence in seconds when `kind === "present"`. */
  rotationSeconds?: number;
  /** Auto-refresh cadence in milliseconds. `0` disables refresh. */
  refreshMs?: number;
  /**
   * Plaintext password the storage adapter should hash before
   * persisting. Never round-trips back to the client.
   */
  password?: string;
  /** Unlock-session TTL in seconds. Defaults to 3600 when omitted. */
  unlockSessionSeconds?: number;

  // ------------------------------------------------------------------
  // Broadcast Phase-2 — access controls. Mirrors the persistence-side
  // fields on {@link EmbedTokenRecord}. Every list is optional; a
  // caller opting in narrows the audience.
  // ------------------------------------------------------------------

  /** CIDR strings the resolver must match against the viewer IP. */
  ipAllowlist?: readonly string[];
  /** URL-prefix strings the resolver must match against the referer. */
  refererAllowlist?: readonly string[];
  /** Viewer-email allowlist for the magic-link flow (future). */
  viewerEmailAllowlist?: readonly string[];
  /** Viewer-domain allowlist for the magic-link flow (future). */
  viewerDomainAllowlist?: readonly string[];
  /** Cap on successful resolves before self-revoke. `0` / undefined = unlimited. */
  maxUses?: number;

  // ------------------------------------------------------------------
  // Broadcast Phase-3 — data protection. Mirrors the persistence-side
  // fields on {@link EmbedTokenRecord}.
  // ------------------------------------------------------------------

  /** Diagonal watermark overlaid on the viewer surface. */
  watermark?: { enabled: boolean; text?: string };
  /** Disable right-click / drag / text selection on the viewer. */
  disableCopy?: boolean;
  /** ISO-8601 lower bound for the widget data window. */
  dataWindowFrom?: string;
  /** ISO-8601 upper bound for the widget data window. */
  dataWindowTo?: string;
  /** When `true`, viewer blurs `.pii-name` / `.pii-email` elements. */
  piiMask?: boolean;

  // ------------------------------------------------------------------
  // Broadcast Phase-4 — presentation / whitelabel.
  // ------------------------------------------------------------------

  /** Owner-configured whitelabel overrides applied to the viewer. */
  whitelabel?: {
    logoUrl?: string;
    accent?: string;
    welcomeText?: string;
  };
}

/**
 * Payload the viewer submits to
 * {@link DashboardStorageAdapter.unlockEmbedToken}. `password` is the
 * raw string the viewer typed into the gate page. The adapter
 * hashes it and compares against the persisted `passwordHash`.
 */
export interface UnlockEmbedTokenInput {
  password: string;
}

/**
 * Handshake returned by
 * {@link DashboardStorageAdapter.unlockEmbedToken} on success. The
 * gate page stashes the `sessionKey` in sessionStorage so the
 * viewer can call `resolveEmbedToken` with it and skip the gate
 * for the TTL window.
 */
export interface UnlockedEmbedSession {
  sessionKey: string;
  expiresAt: string;
}

/**
 * Payload passed to {@link DashboardStorageAdapter.addShareGrant}.
 * The server mints `id`, `dashboardId`, `grantedBy`, and `grantedAt`
 * so callers cannot forge them; the client only supplies the target
 * triple.
 */
export type CreateShareGrantInput = Pick<
  DashboardShareGrant,
  "targetType" | "targetId" | "targetLabel"
>;

/**
 * Error thrown by the storage adapter when a client's `version` is
 * stale. The frontend re-fetches, merges, and retries.
 */
export class OptimisticLockError extends Error {
  public readonly serverVersion: number;
  public readonly clientVersion: number;

  public constructor(clientVersion: number, serverVersion: number) {
    super(
      `Dashboard version mismatch: client sent ${clientVersion}, server has ${serverVersion}. ` +
        `Refresh the dashboard and try again.`,
    );
    this.name = "OptimisticLockError";
    this.clientVersion = clientVersion;
    this.serverVersion = serverVersion;
  }
}

/**
 * Error thrown by the storage adapter when a dashboard id doesn't
 * exist (deleted, wrong tenant, wrong user). Callers surface a 404
 * page or a toast.
 */
export class DashboardNotFoundError extends Error {
  public constructor(idOrSlug: string) {
    super(`Dashboard "${idOrSlug}" not found.`);
    this.name = "DashboardNotFoundError";
  }
}

/**
 * Error thrown by {@link DashboardStorageAdapter.resolveEmbedToken}
 * when the token is unknown, revoked, or expired. The public embed
 * page maps this to an opaque 404 so viewers can't tell which case
 * hit.
 */
export class EmbedTokenInvalidError extends Error {
  public constructor() {
    super("Embed token is invalid, revoked, or expired.");
    this.name = "EmbedTokenInvalidError";
  }
}

/**
 * Error thrown by {@link DashboardStorageAdapter.resolveEmbedToken}
 * when the token carries a password gate and the caller either did
 * not present a session key or presented one that does not match /
 * has expired. The gate page catches this to prompt the viewer.
 */
export class EmbedTokenPasswordRequiredError extends Error {
  public constructor() {
    super("Broadcast requires a password.");
    this.name = "EmbedTokenPasswordRequiredError";
  }
}

/**
 * The five inspector tabs the customise panel exposes. Kept as a
 * literal union so the tab registry stays type-checked. `history`
 * sits between `settings` and `filters` so the ordering matches the
 * user's mental grouping: shape → identity → history → filters.
 *
 * The AI assistant previously lived here as a sixth `"assistant"`
 * tab; it moved to a header-launched Sheet
 * ({@link "@/modules/dashboard/components/ai-assistant-sheet"}) so
 * it sits alongside Present / Share / Customise as a peer action
 * rather than being buried inside Customise's tab list.
 */
export type CustomizePanelTab = "widgets" | "layout" | "settings" | "history" | "filters";

/**
 * The kinds of change an AI suggestion can propose. Kept as a
 * literal union so switch statements narrow cleanly.
 *
 *   * `add-widget` — insert a fresh widget instance into the current
 *     dashboard's draft. Payload carries the catalogue key + span
 *     hint the mock backend inferred from the prompt.
 *   * `reorder`    — reorder existing widgets by id. Payload carries
 *     the target order.
 *   * `rename`     — patch the dashboard's display name. Payload
 *     carries `{name: string}`.
 *   * `explain`    — no mutation; a summary the assistant emits when
 *     it can't infer a concrete change (fallback branch).
 */
export type AiSuggestionKind = "add-widget" | "reorder" | "rename" | "explain";

/**
 * A single proposal on an assistant turn. Suggestions are individually
 * accept/dismiss-able so the user can cherry-pick when the assistant
 * returns multiple proposals in one turn.
 *
 * Payload shape depends on {@link kind}:
 *
 *   * `add-widget` → `{widgetType: string; span?: "full" | "half" | "third"}`
 *   * `reorder`    → `{orderedIds: readonly string[]}`
 *   * `rename`     → `{name: string}`
 *   * `explain`    → `{summary: string}`
 */
export interface AiSuggestion {
  /** Stable id — used as the React key + accept/dismiss target. */
  id: string;
  kind: AiSuggestionKind;
  /** Short human summary for the suggestion card header. */
  title: string;
  /** Longer description rendered under the title. */
  description?: string;
  /** Payload — shape depends on `kind`. */
  payload: unknown;
}

/**
 * A single message in the copilot chat history. `user` turns carry
 * the raw prompt; `assistant` turns carry the mock backend's reply
 * plus (optionally) a list of {@link AiSuggestion}s the user can
 * apply.
 *
 * ## Persistence
 *
 * Chat state is **ephemeral** — it resets when the customise panel
 * closes. No storage adapter changes are needed for G4.
 */
export interface AiTurn {
  /** Stable id — used as the React key. */
  id: string;
  role: "user" | "assistant";
  content: string;
  /** ISO-8601 timestamp — used for the "Xm ago" caption. */
  createdAt: string;
  /** Only populated on assistant turns. */
  suggestions?: AiSuggestion[];
}

/**
 * Sidebar / palette nav projection — small subset used by the shell.
 */
export interface DashboardNavEntry {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  isBuiltIn: boolean;
  isPinned: boolean;
  isDefault: boolean;
}

// ---------------------------------------------------------------------------
// Broadcast Phase-6 — audit log
//
// A single row from the broadcast view-log store. Mirrors the
// Laravel `BroadcastViewLogResponseData` DTO so the wire shape and
// the frontend contract stay 1:1. Fields carrying viewer PII
// (`viewerEmail`) are redacted on the backend before the row ships
// over the wire — the frontend never sees a raw email.
// ---------------------------------------------------------------------------

/**
 * A single row from a broadcast token's view-log store. Events are
 * append-only, per-broadcast, and rendered by the share dialog's
 * "Activity" section.
 *
 * `eventType` is the machine value; `eventTypeLabel` is the
 * human-facing string the backend has already localised. The same
 * pattern applies to `denialReason` / `denialReasonLabel` — the
 * frontend never has to translate reason codes.
 */
export interface BroadcastViewLogRecord {
  /** UUID primary key for the log row. */
  readonly id: string;
  /** FK back to the owning {@link EmbedTokenRecord.id}. */
  readonly embedTokenId: string;
  /**
   * Session identifier for correlating multiple events from the
   * same viewer flow (unlock → resolve). Absent when the event
   * pre-dates the session-key surface.
   */
  readonly sessionId?: string;
  /**
   * Machine-readable event type. Fixed enum matching the resolver's
   * state transitions.
   */
  readonly eventType:
    "unlock_success" | "unlock_failure" | "resolve_success" | "resolve_denied" | "revoked";
  /** Human-facing event label already localised on the backend. */
  readonly eventTypeLabel: string;
  /**
   * SHA-256 hash of the viewer IP. Truncated to the first 8 chars
   * in the UI so the operator can spot repeat viewers without
   * being handed a fingerprint.
   */
  readonly viewerIpHash?: string;
  /** SHA-256 hash of the viewer User-Agent. */
  readonly viewerUaHash?: string;
  /** ISO 3166-1 alpha-2 country code inferred from the viewer IP. */
  readonly countryCode?: string;
  /**
   * Viewer email — surfaced only for magic-link flow. Redacted
   * server-side (`a****@example.com`) so a leaked audit log doesn't
   * expose the audience.
   */
  readonly viewerEmail?: string;
  /** Machine reason code for a `resolve_denied` / `unlock_failure`. */
  readonly denialReason?: string;
  /** Human-facing denial reason already localised on the backend. */
  readonly denialReasonLabel?: string;
  /** Referenced dashboard id — useful in present-mode logs. */
  readonly dashboardId?: string;
  /** ISO-8601 event timestamp. */
  readonly occurredAt: string;
}

// ---------------------------------------------------------------------------
// Broadcast Phase-7 — templates
//
// A saved bundle of broadcast issue-options the operator can apply
// on subsequent link creations. `config` mirrors the shape of
// {@link IssueEmbedTokenInput} so applying a template is a spread.
// ---------------------------------------------------------------------------

/**
 * A saved broadcast template — the operator's shortcut for spinning
 * up new links with a preset combination of delivery, access, and
 * branding fields. Templates are per-user by default; setting
 * `isShared` publishes them to the tenant so teammates can pick
 * from the same list.
 */
export interface BroadcastTemplate {
  /** UUID primary key. */
  readonly id: string;
  /** Short human-facing name shown in the picker. */
  readonly name: string;
  /** Optional description surfaced under the name in the picker. */
  readonly description?: string;
  /** Iconify token from the shared icon set (see `customize-panel`). */
  readonly icon?: string;
  /**
   * The bundled issue options. Partial so the template can leave
   * any field unset — the applied form falls back to its own
   * defaults for those fields.
   */
  readonly config: Partial<IssueEmbedTokenInput>;
  /**
   * When `true`, the template is visible to every tenant member.
   * Private templates are only surfaced to their creator.
   */
  readonly isShared: boolean;
  /**
   * Number of times this template has been used to mint a link.
   * Incremented on every issue that carries a `templateId` — the
   * playground stub doesn't yet track this, but the type mirrors
   * the backend contract so no follow-up migration is needed.
   */
  readonly useCount: number;
  /** ISO-8601 wall-clock of the most recent use. */
  readonly lastUsedAt?: string;
  /** ISO-8601 creation time. */
  readonly createdAt: string;
  /** ISO-8601 mutation time. */
  readonly updatedAt: string;
}

/**
 * Payload for {@link DashboardStorageAdapter.createBroadcastTemplate}.
 * Backend mints `id`, `useCount`, `createdAt`, `updatedAt`; the
 * caller supplies the descriptive payload and initial share flag.
 */
export interface CreateBroadcastTemplateInput {
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly config: Partial<IssueEmbedTokenInput>;
  readonly isShared?: boolean;
}

// ---------------------------------------------------------------------------
// Broadcast Phase-7 — bulk revoke
//
// Filter descriptor the bulk-revoke modal builds and submits. Each
// field narrows the affected set; at least one must be non-empty.
// ---------------------------------------------------------------------------

/**
 * Bulk-revoke filter descriptor. All fields are optional; the
 * modal validates that at least one is populated before submitting.
 *
 *   * `ownerId`        — revoke every token issued by the given
 *                        user. Playground stub — production sources
 *                        this from the identity table.
 *   * `dashboardId`    — revoke every token attached to a single
 *                        shared dashboard.
 *   * `dashboardIds`   — same, but for many dashboards at once.
 *                        Additive with `dashboardId`.
 *   * `beforeDate`     — restrict the affected set to tokens
 *                        created strictly before this ISO date.
 *                        Useful for "purge everything older than
 *                        Q1" clean-ups.
 */
export interface BulkRevokeFilters {
  readonly ownerId?: string;
  readonly dashboardId?: string;
  readonly dashboardIds?: readonly string[];
  readonly beforeDate?: string;
}

/**
 * Result of a bulk revoke — the number of tokens that were
 * flipped to `revokedAt`. The dialog surfaces this in a toast so
 * the operator can spot a no-op filter without inspecting the
 * link list.
 */
export interface BulkRevokeResult {
  readonly revoked: number;
}

/**
 * Storage adapter contract — abstracts persistence so the UI never
 * knows about `localStorage` vs Refine data-provider. When the
 * backend lands, we swap one file (`storage.ts`) for a Refine-based
 * implementation; every hook keeps working unchanged.
 */
export interface DashboardStorageAdapter {
  list: () => Promise<readonly Dashboard[]>;
  get: (id: string) => Promise<Dashboard>;
  getBySlug: (slug: string) => Promise<Dashboard>;
  create: (input: CreateDashboardInput) => Promise<Dashboard>;
  update: (id: string, input: UpdateDashboardInput) => Promise<Dashboard>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<Dashboard>;
  togglePin: (id: string, next: boolean) => Promise<Dashboard>;
  setDefault: (id: string) => Promise<Dashboard>;
  issueEmbedToken: (id: string, input: IssueEmbedTokenInput) => Promise<IssuedEmbedToken>;
  revokeEmbedToken: (id: string, tokenId: string) => Promise<void>;
  listEmbedTokens: (id: string) => Promise<readonly EmbedTokenRecord[]>;
  /**
   * Resolve a broadcast token for the public viewer.
   *
   * When the token carries a `passwordHash`, callers must first
   * call {@link unlockEmbedToken} and pass the returned
   * `sessionKey` here; otherwise the resolver throws
   * {@link EmbedTokenPasswordRequiredError}.
   */
  resolveEmbedToken: (token: string, sessionKey?: string) => Promise<PublicEmbedDashboard>;
  /**
   * Verify a password against a password-gated broadcast and mint a
   * short-lived session key the viewer stashes and passes to
   * subsequent `resolveEmbedToken` calls. Throws
   * {@link EmbedTokenInvalidError} for wrong passwords /
   * revoked / expired tokens — never distinguishing between them so
   * an attacker cannot enumerate valid tokens.
   */
  unlockEmbedToken: (token: string, input: UnlockEmbedTokenInput) => Promise<UnlockedEmbedSession>;
  /**
   * Enumerate every access grant tied to the dashboard. Grants are
   * additive — a viewer matching **any** returned grant sees the
   * dashboard in the tenant sidebar / palette.
   */
  listShareGrants: (dashboardId: string) => Promise<readonly DashboardShareGrant[]>;
  /**
   * Persist a new access grant for the dashboard. The server mints
   * `id`, `dashboardId`, `grantedBy`, and `grantedAt`. Duplicate
   * grants (same `targetType` + `targetId`) resolve to a no-op that
   * returns the existing record.
   */
  addShareGrant: (
    dashboardId: string,
    input: CreateShareGrantInput,
  ) => Promise<DashboardShareGrant>;
  /**
   * Revoke a single grant by id. Missing ids resolve as a no-op —
   * the caller can revoke idempotently without pre-fetching.
   */
  removeShareGrant: (grantId: string) => Promise<void>;
  /**
   * Read every persisted snapshot for a dashboard, most-recent
   * first. Callers must treat the result as read-only: mutating
   * snapshots directly would defeat the audit trail.
   */
  listVersions: (dashboardId: string) => Promise<readonly DashboardVersionSnapshot[]>;
  /**
   * Restore a dashboard to a persisted snapshot. Reuses the
   * optimistic-lock path so a concurrent editor in another tab
   * still gets a fresh version bump; a new snapshot is written
   * capturing the pre-restore state. Returns the resulting
   * dashboard document at its new version.
   */
  restoreVersion: (dashboardId: string, versionId: string) => Promise<Dashboard>;
  /**
   * Read every annotation for a dashboard, ordered chronologically
   * (oldest first). Owner-private — never surfaced through the
   * embed path.
   */
  listAnnotations: (dashboardId: string) => Promise<readonly WidgetAnnotation[]>;
  /**
   * Append a new annotation to a widget. Returns the persisted
   * record with its server-assigned id + timestamps.
   */
  addAnnotation: (
    dashboardId: string,
    widgetInstanceId: string,
    body: string,
  ) => Promise<WidgetAnnotation>;
  /**
   * Edit an existing annotation's body. Sets `updatedAt` to the
   * current ISO-8601 timestamp. Returns the updated record.
   */
  updateAnnotation: (annotationId: string, body: string) => Promise<WidgetAnnotation>;
  /** Remove an annotation. Idempotent: unknown ids resolve without error. */
  removeAnnotation: (annotationId: string) => Promise<void>;

  // -------------------------------------------------------------------------
  // Broadcast Phase-6 — audit log
  // -------------------------------------------------------------------------

  /**
   * Enumerate every audit event tied to a broadcast token. Events
   * are returned in reverse-chronological order (most recent first)
   * so the "Activity" tab can render the freshest transitions
   * without a client-side sort.
   *
   * Playground implementation returns an empty array — the
   * localStorage adapter has no real audit trail. When the backend
   * lands this hits `GET /api/dashboards/{userDashboard}/embed-tokens/{tokenId}/view-log`.
   */
  listBroadcastViewLog: (embedTokenId: string) => Promise<readonly BroadcastViewLogRecord[]>;

  // -------------------------------------------------------------------------
  // Broadcast Phase-7 — rotation
  // -------------------------------------------------------------------------

  /**
   * Rotate a broadcast token. Mints a fresh {@link IssuedEmbedToken}
   * inheriting every field from the source and marks the source
   * with a `graceExpiresAt` window equal to `graceSeconds` from
   * now. During the grace period the old URL still resolves so
   * in-flight viewer sessions don't 404 mid-slideshow.
   *
   * @param dashboardId  Dashboard the source token was issued for.
   * @param tokenId      {@link EmbedTokenRecord.id} of the source token.
   * @param graceSeconds How long the superseded link stays alive.
   */
  rotateEmbedToken: (
    dashboardId: string,
    tokenId: string,
    graceSeconds: number,
  ) => Promise<IssuedEmbedToken>;

  // -------------------------------------------------------------------------
  // Broadcast Phase-7 — templates
  // -------------------------------------------------------------------------

  /**
   * Enumerate every template the caller can see — private
   * templates authored by the current user + every shared template
   * across the tenant.
   */
  listBroadcastTemplates: () => Promise<readonly BroadcastTemplate[]>;

  /** Persist a new template. Returns the freshly-minted record. */
  createBroadcastTemplate: (input: CreateBroadcastTemplateInput) => Promise<BroadcastTemplate>;

  /** Delete a template. Idempotent — unknown ids resolve without error. */
  deleteBroadcastTemplate: (id: string) => Promise<void>;

  // -------------------------------------------------------------------------
  // Broadcast Phase-7 — bulk revoke
  // -------------------------------------------------------------------------

  /**
   * Preview how many tokens would be revoked by the given filter
   * set. The bulk-revoke modal renders this eagerly so the
   * operator can spot a no-op filter before hitting Confirm.
   */
  previewBulkRevoke: (filters: BulkRevokeFilters) => Promise<BulkRevokeResult>;

  /**
   * Revoke every token matching the filter set. Returns the number
   * of tokens that flipped from live to revoked. Callers that need
   * the resulting list re-fetch through {@link listEmbedTokens}.
   */
  bulkRevokeEmbedTokens: (filters: BulkRevokeFilters) => Promise<BulkRevokeResult>;
}

/**
 * Runtime layout data used by the widget grid — merges the current
 * user's saved layout with the built-in defaults at the active
 * breakpoint. Handy for the renderer, which reads a compact map by id.
 */
export interface RenderableLayout {
  breakpoint: DashboardBreakpoint;
  items: readonly LayoutItem[];
  widgetsById: Map<string, WidgetInstance>;
}
