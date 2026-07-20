/**
 * @file public-embed-dashboard.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Redacted dashboard payload the unauthenticated viewer
 *   receives. Never carries owner id, tenant id, or version.
 */

import type { BroadcastKind } from "@/core/types/broadcast-kind.type";
import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";
import type { DashboardLayoutMode } from "@/core/types/dashboard-layout-mode.type";
import type { DashboardVisibility } from "@/core/types/dashboard-visibility.type";

import type { IDashboardFilters } from "./dashboard-filters.interface";
import type { ILayoutItem } from "./layout-item.interface";
import type { IWidgetInstance } from "./widget-instance.interface";

/**
 * Public embed / broadcast payload — the redacted shape the
 * unauthenticated viewer receives. Never carries owner id, tenant id,
 * or version.
 *
 * The `broadcast` field carries the presentation policy so the viewer
 * can honour rotation / refresh / watermark / whitelabel without a
 * second round-trip.
 */
export interface IPublicEmbedDashboard {
  /** Dashboard display name. */
  name: string;

  /** Iconify token from the shared icon set. */
  icon?: string;

  /** Accent colour. */
  color?: string;

  /** Layout engine mode. */
  layoutMode: DashboardLayoutMode;

  /** Per-breakpoint layouts. */
  layouts: Record<DashboardBreakpoint, readonly ILayoutItem[]>;

  /** Widget instances placed on the dashboard. */
  widgets: readonly IWidgetInstance[];

  /** Dashboard-level filter defaults. */
  filters?: IDashboardFilters;

  /** Visibility scope. Always `"shared"` for a resolved payload. */
  visibility: DashboardVisibility;

  /** ISO-8601 last-mutation timestamp. */
  updatedAt: string;

  /**
   * Presentation policy carried alongside the payload so the viewer
   * honours the broadcast owner's cadence + rotation + protections.
   */
  broadcast?: {
    /** Delivery format. */
    kind: BroadcastKind;
    /** Auto-refresh cadence in milliseconds. */
    refreshMs?: number;
    /** Present-mode rotation cadence in seconds. */
    rotationSeconds?: number;
    /**
     * Full ordered list of dashboards the viewer cycles through.
     * Includes the primary dashboard as its first entry. `present`
     * mode uses this; `embed` mode ignores it.
     */
    dashboards?: readonly IPublicEmbedDashboard[];

    // Phase-3 data-protection echoes — echoed for the viewer's
    // rendering pipeline. Access controls (Phase-2) are NOT echoed;
    // enforcement is server-side and disclosure would help attackers.

    /** Diagonal watermark overlay policy. */
    watermark?: {
      /** When `false`, the watermark is not rendered. */
      enabled: boolean;
      /** Overlay copy; `{brand}` + `{date}` are substituted. */
      text?: string;
    };

    /** Disable copy / drag / text selection on the viewer surface. */
    disableCopy?: boolean;

    /** ISO-8601 lower bound for widget data. */
    dataWindowFrom?: string;

    /** ISO-8601 upper bound for widget data. */
    dataWindowTo?: string;

    /** When `true`, viewer blurs `.pii-name` / `.pii-email` elements. */
    piiMask?: boolean;

    /**
     * Owner-configured whitelabel overrides applied to the viewer's
     * header + accent colour.
     */
    whitelabel?: {
      /** Logo URL served in place of the framework isotipo. */
      logoUrl?: string;
      /** Accent color applied as `--accent` on the viewer root. */
      accent?: string;
      /** Header welcome copy. */
      welcomeText?: string;
    };
  };
}
