/**
 * @file legal.config.ts
 * @module config/legal.config
 *
 * @description
 * Corporate legal identity + last-updated dates for every legal page.
 * Complements the per-locale body copy under
 * `public/data/{locale}/legal.json` — this file owns the DATES +
 * entity metadata that must stay identical in every language.
 *
 * ## Update cadence
 *
 *  - Bump the corresponding `effectiveDates[…]` entry when a legal
 *    document is revised.
 *  - Also update the `effective_date` field in each locale's copy of
 *    `public/data/{locale}/legal.json` so the visible date on-page
 *    matches this config.
 *  - Notify workspace owners 30 days before any material change (see
 *    section 7 of the current Privacy Policy).
 */

/**
 * ISO-3166 subdivision codes where our legal entity is registered.
 * We use `US-DE` (Delaware) rather than plain `US` to be explicit.
 */
export type Jurisdiction = "GB" | "AE" | "US-DE" | "SA";

/** Canonical corporate identity. */
export const legal = {
  /** Registered corporate name. Used in DPA + terms + invoices. */
  entity: "Academorix Ltd",

  /**
   * Registered address as a single line. Split for structured
   * `schema.org` `PostalAddress` by consumers if they need
   * street / locality / region / postal-code granularity.
   */
  registeredAddress: "TBD — update before launch",

  /** Companies House number (or equivalent). */
  companyNumber: "TBD",

  /** VAT number if applicable. `null` when not VAT-registered. */
  vatNumber: null as string | null,

  /** Jurisdictions we operate under. Consumed by DPA + regional pages. */
  jurisdictions: ["GB", "AE", "US-DE", "SA"] as readonly Jurisdiction[],

  /** Data-protection officer email. Mirrors `contact.emails.dpo`. */
  dpo: "dpo@academorix.com",

  /**
   * Effective dates for every legal document. Keep in sync with the
   * `effective_date` field in each `public/data/{locale}/legal.json`
   * entry — bump both when a legal document is revised.
   */
  effectiveDates: {
    privacy: "2026-07-01",
    terms: "2026-07-01",
    cookies: "2026-07-01",
    dpa: "2026-07-01",
    security: "2026-07-01",
    acceptableUse: "2026-07-01",
  },
} as const;

/** Union of every legal document slug this app publishes. */
export type LegalDocSlug = keyof typeof legal.effectiveDates;
