/**
 * Common primitive schemas shared across every resource.
 *
 * These are the atoms every fixture is built from: timestamps, dates, money,
 * locales, tenant scoping, and free-form JSON. They are intentionally tolerant
 * (e.g. Timestamp accepts any ISO 8601 with a Z suffix; DateOnly accepts any
 * `YYYY-MM-DD` string) so that resource schemas can compose them without
 * fighting the exact date semantics of the underlying fixture.
 */

import { z } from "zod";

// -------- Scalars --------

/**
 * ISO 8601 UTC timestamp. All fixture timestamps end in `Z` — the naming
 * convention doc requires it.
 */
export const Timestamp = z.iso.datetime({ offset: false });
export type Timestamp = z.infer<typeof Timestamp>;

/**
 * ISO 8601 date without a time component (e.g. "2026-06-30").
 */
export const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export type DateOnly = z.infer<typeof DateOnly>;

/**
 * ISO 8601 time-of-day (e.g. "09:30", "09:30:00").
 */
export const TimeOfDay = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
export type TimeOfDay = z.infer<typeof TimeOfDay>;

/**
 * ISO 4217 currency code — always 3 uppercase letters.
 */
export const CurrencyCode = z.string().length(3);
export type CurrencyCode = z.infer<typeof CurrencyCode>;

/**
 * Locale tag — "en", "ar", "en-US". Free-form.
 */
export const Locale = z.string().min(2);
export type Locale = z.infer<typeof Locale>;

/**
 * URL-safe slug (used for keys like sport_key, program_key, plan.key).
 */
export const Slug = z.string().min(1);
export type Slug = z.infer<typeof Slug>;

/**
 * RFC 4122 UUID.
 */
export const Uuid = z.uuid();
export type Uuid = z.infer<typeof Uuid>;

/**
 * NFC UID — 7–14 uppercase hex chars.
 */
export const NfcUid = z.string().regex(/^[0-9A-F]+$/);
export type NfcUid = z.infer<typeof NfcUid>;

/**
 * Email — used for user records, invitation targets, tenant contact.
 */
export const Email = z.email();
export type Email = z.infer<typeof Email>;

/**
 * Free-form phone number. Fixtures use "+1 555 0100" style; we don't enforce
 * E.164 because staff/guardian records mix formats.
 */
export const PhoneNumber = z.string().min(3);
export type PhoneNumber = z.infer<typeof PhoneNumber>;

/**
 * URL. Kept tolerant — some fixtures store relative asset paths.
 */
export const UrlString = z.string();
export type UrlString = z.infer<typeof UrlString>;

// -------- Money --------

/**
 * Money is always integer minor units + currency code. Never a float.
 * See NAMING_CONVENTION.md §4.
 */
export const Money = z.object({
  amount_minor: z.number().int(),
  currency: CurrencyCode,
});
export type Money = z.infer<typeof Money>;

// -------- Localized string --------

/**
 * A per-locale bag: `{ "en": "Football U10", "ar": "..." }`. Every locale
 * value is a free-form string. Locales are always at least 2 chars.
 */
export const LocalizedString = z.record(z.string(), z.string());
export type LocalizedString = z.infer<typeof LocalizedString>;

// -------- Free-form JSON --------

/**
 * A single JSON value — used for metadata bags, notes payloads, and any
 * field where the fixture carries opaque configuration.
 */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

/**
 * A key/value bag. Every value is a JsonValue. Used for `metadata`,
 * `default_config`, `payload`, `context`, etc.
 */
export const Metadata = z.record(z.string(), JsonValueSchema);
export type Metadata = z.infer<typeof Metadata>;

// -------- Tenant scoping --------

/**
 * Every fixture record carries `tenant_id`. Some centrally-defined records
 * (retention policies, benchmarks, some report definitions, people)
 * intentionally set `tenant_id: null` to mark them as platform-scoped.
 */
export const TenantScope = z.string().min(1);
export type TenantScope = z.infer<typeof TenantScope>;

// -------- Range helpers --------

/**
 * Half-open time range: start inclusive, end exclusive. Both ISO 8601 UTC.
 */
export const TimeRange = z.object({
  start: Timestamp,
  end: Timestamp,
});
export type TimeRange = z.infer<typeof TimeRange>;

/**
 * Date range (dates without time component).
 */
export const DateRange = z.object({
  start: DateOnly,
  end: DateOnly,
});
export type DateRange = z.infer<typeof DateRange>;

// -------- Address --------

/**
 * Address block used by tenants, branches, and reception visits. Fields are
 * all optional strings so we can represent partial addresses.
 */
export const Address = z
  .object({
    line1: z.string().nullable().optional(),
    line2: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
  })
  .loose();
export type Address = z.infer<typeof Address>;
