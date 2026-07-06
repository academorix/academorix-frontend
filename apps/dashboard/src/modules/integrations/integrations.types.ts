/**
 * @file integrations.types.ts
 * @module modules/integrations/integrations.types
 *
 * @description
 * Module-local shape for **third-party integrations** — external providers
 * (payments, messaging, calendar, realtime) and their connection status. Kept
 * local as a platform-settings projection.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.9 "Integrations"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** Connection state of an integration. */
export const INTEGRATION_STATUSES = ["connected", "disconnected", "error"] as const;

/** A single integration status (e.g. `"connected"`). */
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

/** Human-readable labels for {@link IntegrationStatus}. */
export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
};

/**
 * A **third-party integration** the tenant can connect. `provider` is the stable
 * key; `category` groups related providers in the UI.
 */
export interface Integration extends BaseModel, TenantScoped {
  /** Stable provider key, e.g. `"stripe"`, `"reverb"`. */
  provider: string;
  /** Display name, e.g. `"Stripe"`. */
  name: string;
  /** Grouping, e.g. `"payments"`, `"messaging"`, `"calendar"`, `"realtime"`. */
  category: string;
  status: IntegrationStatus;
  /** Whether the tenant has enabled this integration. */
  is_enabled: boolean;
  /** ISO-8601 last successful sync, or `null`. */
  last_synced_at: string | null;
  /** Short status/context note. */
  note: string | null;
}
