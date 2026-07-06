/**
 * @file contact.config.ts
 * @module config/contact.config
 *
 * @description
 * Every inbound + outbound contact channel the marketing surface
 * advertises — support / sales / press / careers / privacy / security
 * / DPO emails, the Calendly demo booking link, and the contact-form
 * POST endpoint. Env-var overrides let us swap endpoints per
 * environment (staging Calendly, sandbox form endpoint) without
 * touching code.
 *
 * ## Source-of-truth alignment
 *
 * `emails.support` and `emails.sales` mirror `contact_email` and
 * `sales_email` in `public/data/{locale}/site.json`. Keep both in
 * sync when they change — the site.json values are what get rendered
 * in the visible copy per locale; the config values are what
 * cross-locale code (JSON-LD, mailto helpers) reads at build time.
 */

/** Contact channel registry. */
export const contact = {
  emails: {
    /** General product support. Mirrors `site.json.contact_email`. */
    support: "hello@academorix.com",
    /** Sales / demo requests. Mirrors `site.json.sales_email`. */
    sales: "sales@academorix.com",
    /** Press inquiries + media assets. */
    press: "press@academorix.com",
    /** Careers / recruiting. */
    careers: "careers@academorix.com",
    /** Privacy / data-subject requests. */
    privacy: "privacy@academorix.com",
    /** Security disclosures. */
    security: "security@academorix.com",
    /** Data-protection officer. */
    dpo: "dpo@academorix.com",
  },

  /**
   * Calendly demo booking URL — override per env with
   * `NEXT_PUBLIC_CALENDLY_URL`. Falls back to the canonical
   * Academorix demo link.
   */
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL ?? "https://calendly.com/academorix/demo",

  /**
   * POST endpoint for the `/contact-sales` form. Defaults to the
   * app's own API route (proxy to the backend). Override with
   * `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT` for a hosted form service
   * (Formspark, Getform, HubSpot Forms).
   */
  formEndpoint: process.env.NEXT_PUBLIC_CONTACT_FORM_ENDPOINT ?? "/api/contact",

  /**
   * Business hours displayed on `/contact-sales` and the footer.
   * ISO-8601 time strings; the render layer localises them per
   * visitor via `Intl.DateTimeFormat`.
   */
  hours: {
    start: "09:00",
    end: "18:00",
    /** Canonical IANA timezone the hours are declared in. */
    timezone: "Europe/London",
    /**
     * Days the desk is staffed (Mon = 1, Sun = 7 — ISO week). Sat/Sun
     * excluded by default.
     */
    weekdays: [1, 2, 3, 4, 5] as readonly number[],
  },
} as const;

/**
 * Convenience builder for `mailto:` links with an optional subject
 * prefill.
 *
 * @param address - Target inbox (from `contact.emails`).
 * @param subject - Optional pre-populated subject line.
 */
export function mailto(address: string, subject?: string): string {
  return subject ? `mailto:${address}?subject=${encodeURIComponent(subject)}` : `mailto:${address}`;
}
