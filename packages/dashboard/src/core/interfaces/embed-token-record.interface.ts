/**
 * @file embed-token-record.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Persistent record for a public embed / broadcast token.
 *
 *   Every field beyond `id` / `dashboardId` / `useCount` / `createdAt`
 *   is optional so a plain zero-config embed link still shapes to
 *   `IEmbedTokenRecord`. Broadcast Phase-1..7 fields extend the shape
 *   without touching the historical embed path.
 *
 *   `watermark` and `whitelabel` inner shapes are inlined here (and
 *   also on {@link IPublicEmbedDashboard.broadcast}) — they satisfy the
 *   composite-family rule because callers exclusively assemble them
 *   via the outer records.
 */

import type { BroadcastKind } from "@/core/types/broadcast-kind.type";

/**
 * Persistent record of an issued embed / broadcast token. The raw token
 * itself is never persisted — only its `id` + metadata. Playground: the
 * raw token is the map key; production: the raw token's SHA-256 digest
 * is the map key.
 */
export interface IEmbedTokenRecord {
  /** UUID primary key for the record. */
  id: string;

  /** Owning dashboard's id. */
  dashboardId: string;

  /** Human-facing label shown in the "Existing links" list. */
  label?: string;

  /** ISO-8601 expiry; `undefined` = never expires. */
  expiresAt?: string;

  /** ISO-8601 revocation timestamp. Live tokens have this absent. */
  revokedAt?: string;

  /** ISO-8601 timestamp of the most recent successful resolve. */
  lastUsedAt?: string;

  /** Successful-resolve counter. */
  useCount: number;

  /** ISO-8601 creation timestamp. */
  createdAt: string;

  // ── Broadcast Phase-7 — rotation ──────────────────────────────

  /**
   * When set, points at the {@link IEmbedTokenRecord.id} of the token
   * that superseded this one via a rotation. UI badges these rows as
   * "rotated" and links the operator to the successor.
   */
  supersededByTokenId?: string;

  /**
   * ISO-8601 wall-clock at which the resolver treats a superseded
   * link as expired. Independent of `expiresAt` so an owner can
   * rotate a "never expires" link and still grant a short grace
   * window.
   */
  graceExpiresAt?: string;

  // ── Broadcast Phase-1 extensions ──────────────────────────────

  /**
   * Delivery format. Defaults to `"embed"` at consumption time when
   * omitted so the historical chromeless embed stays zero-config.
   */
  kind?: BroadcastKind;

  /**
   * Additional dashboards the broadcast should cycle through when
   * `kind === "present"`. `dashboardId` remains the primary.
   */
  extraDashboardIds?: readonly string[];

  /** Auto-rotation cadence in seconds when `kind === "present"`. */
  rotationSeconds?: number;

  /** Auto-refresh cadence in milliseconds. `0` disables refresh. */
  refreshMs?: number;

  /**
   * Argon2id (playground: SHA-256) hex digest of the broadcast
   * password. `undefined` means no password gate. The raw password is
   * never persisted — only the digest.
   */
  passwordHash?: string;

  /**
   * Unlock-session TTL granted after a successful password check.
   * Defaults to 3600 (1h) when omitted.
   */
  unlockSessionSeconds?: number;

  // ── Broadcast Phase-2 — access controls ───────────────────────

  /** CIDR strings the resolver must match against the viewer IP. */
  ipAllowlist?: readonly string[];

  /** URL-prefix strings the resolver must match against `Referer`. */
  refererAllowlist?: readonly string[];

  /** Viewer-email allowlist for the (future) magic-link viewer flow. */
  viewerEmailAllowlist?: readonly string[];

  /** Viewer-domain allowlist for the (future) magic-link viewer flow. */
  viewerDomainAllowlist?: readonly string[];

  /** Hard cap on successful resolves; `undefined` / `0` = unlimited. */
  maxUses?: number;

  // ── Broadcast Phase-3 — data protection ───────────────────────

  /**
   * Diagonal watermark policy. `text` supports `{brand}` + `{date}`
   * substitutions at render time.
   */
  watermark?: {
    /** When `false`, the watermark is not rendered. */
    enabled: boolean;
    /** Overlay copy; `{brand}` + `{date}` are substituted. */
    text?: string;
  };

  /** Disable right-click / drag / text selection on the viewer. */
  disableCopy?: boolean;

  /** ISO-8601 lower bound for the widget data window. */
  dataWindowFrom?: string;

  /** ISO-8601 upper bound for the widget data window. */
  dataWindowTo?: string;

  /** When `true`, viewer blurs `.pii-name` / `.pii-email` elements. */
  piiMask?: boolean;

  // ── Broadcast Phase-4 — presentation / whitelabel ─────────────

  /**
   * Owner-configured whitelabel overrides applied to the viewer's
   * header + accent color.
   */
  whitelabel?: {
    /** Logo URL served in place of the framework isotipo. */
    logoUrl?: string;
    /**
     * Accent color as a hex string or any CSS colour the runtime
     * resolves. Applied as `--accent` on the viewer root.
     */
    accent?: string;
    /** Header welcome copy replacing the default. */
    welcomeText?: string;
  };
}
