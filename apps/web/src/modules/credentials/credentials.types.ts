/**
 * @file credentials.types.ts
 * @module modules/credentials/credentials.types
 *
 * @description
 * Module-local type for an access **Credential** — the NFC/RFID/QR token an
 * athlete taps to check in at the front desk. It is a thin, access-specific
 * projection, so the shape lives in the module rather than in the shared
 * `@/types`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.20 "Reception & Front Desk"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** A physical/virtual access credential issued to an athlete. */
export interface Credential extends BaseModel, TenantScoped {
  branch_id: string;
  /** The athlete the credential is issued to. */
  athlete_id: string;
  /** Credential technology. */
  type: "nfc" | "rfid" | "qr";
  /** The encoded credential value, e.g. `"NFC-0001"`. */
  code: string;
  status: "active" | "revoked" | "lost";
  /** ISO-8601 date the credential was issued. */
  issued_at: string;
}
