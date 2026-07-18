/**
 * @file issue-embed-token-input.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Payload for {@link IDashboardStorageAdapter.issueEmbedToken}.
 *   Every field beyond the historical `label`/`expiresAt` pair is
 *   optional — the historical zero-arg issue still mints a plain
 *   chromeless embed link.
 */

import type { BroadcastKind } from "@/core/types/broadcast-kind.type";

/**
 * Payload for minting a new embed / broadcast token.
 */
export interface IIssueEmbedTokenInput {
  /** Human-facing label shown in the "Existing links" list. */
  label?: string;

  /** ISO-8601 expiry. Omit for never-expires. */
  expiresAt?: string;

  // ── Broadcast Phase-1 extensions ──────────────────────────────

  /** Delivery format. Defaults to `"embed"` when omitted. */
  kind?: BroadcastKind;

  /** Extra dashboards to include in the present-mode rotation. */
  extraDashboardIds?: readonly string[];

  /** Rotation cadence in seconds when `kind === "present"`. */
  rotationSeconds?: number;

  /** Auto-refresh cadence in milliseconds. `0` disables refresh. */
  refreshMs?: number;

  /**
   * Plaintext password the storage adapter hashes before persisting.
   * Never round-trips back to the client.
   */
  password?: string;

  /** Unlock-session TTL in seconds. Defaults to 3600 when omitted. */
  unlockSessionSeconds?: number;

  // ── Broadcast Phase-2 — access controls ───────────────────────

  /** CIDR strings the resolver must match against the viewer IP. */
  ipAllowlist?: readonly string[];

  /** URL-prefix strings the resolver must match against `Referer`. */
  refererAllowlist?: readonly string[];

  /** Viewer-email allowlist for the magic-link flow (future). */
  viewerEmailAllowlist?: readonly string[];

  /** Viewer-domain allowlist for the magic-link flow (future). */
  viewerDomainAllowlist?: readonly string[];

  /** Cap on successful resolves; `0`/`undefined` = unlimited. */
  maxUses?: number;

  // ── Broadcast Phase-3 — data protection ───────────────────────

  /** Diagonal watermark overlaid on the viewer surface. */
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
   * Owner-configured whitelabel overrides applied to the viewer.
   */
  whitelabel?: {
    /** Logo URL served in place of the framework isotipo. */
    logoUrl?: string;
    /** Accent color applied as `--accent` on the viewer root. */
    accent?: string;
    /** Header welcome copy. */
    welcomeText?: string;
  };
}
