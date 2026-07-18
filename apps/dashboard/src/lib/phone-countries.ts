/**
 * @file phone-countries.ts
 * @module lib/phone-countries
 *
 * @description
 * Curated country table for the `PhoneInput` composite. Ships every
 * country the Academorix launch cares about (MENA + core anglophone
 * markets + South Asia) with ISO 3166-1 alpha-2, human name, emoji
 * flag, and E.164 dial code.
 *
 * Keeping this list here (instead of pulling `libphonenumber-js` metadata)
 * saves ~150 KB gzipped from the bundle while covering every real
 * onboarding today. When strict per-country validation lands, upgrade
 * `PhoneInput` with a dynamic-imported metadata lookup — the public
 * API of that component doesn't need to change.
 */

/** One entry in {@link PHONE_COUNTRIES}. */
export type PhoneCountry = {
  /** ISO 3166-1 alpha-2 (e.g. `"SA"`). Stable primary key. */
  iso2: string;
  /** Display name — will pass through the i18n layer at render time. */
  name: string;
  /** Emoji flag glyph. */
  flag: string;
  /** Dial prefix with the leading `+` (e.g. `"+966"`). */
  dialCode: string;
};

/** Default when no other signal is available. Riyadh-first launch. */
export const DEFAULT_PHONE_COUNTRY_ISO2 = "SA";

/**
 * Ordering here is intentional: MENA countries first (that's where
 * the initial tenants live), then EU + North America + APAC. Grouping
 * by region — not alphabetical — cuts the picker's average
 * time-to-selection because most tenants pick from the top of the
 * list. Alphabetise if the list crosses ~50 entries.
 */
export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  // MENA
  { iso2: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966" },
  { iso2: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
  { iso2: "EG", name: "Egypt", flag: "🇪🇬", dialCode: "+20" },
  { iso2: "KW", name: "Kuwait", flag: "🇰🇼", dialCode: "+965" },
  { iso2: "QA", name: "Qatar", flag: "🇶🇦", dialCode: "+974" },
  { iso2: "BH", name: "Bahrain", flag: "🇧🇭", dialCode: "+973" },
  { iso2: "OM", name: "Oman", flag: "🇴🇲", dialCode: "+968" },
  { iso2: "JO", name: "Jordan", flag: "🇯🇴", dialCode: "+962" },
  { iso2: "LB", name: "Lebanon", flag: "🇱🇧", dialCode: "+961" },
  { iso2: "IQ", name: "Iraq", flag: "🇮🇶", dialCode: "+964" },
  { iso2: "MA", name: "Morocco", flag: "🇲🇦", dialCode: "+212" },
  { iso2: "TN", name: "Tunisia", flag: "🇹🇳", dialCode: "+216" },
  { iso2: "TR", name: "Turkey", flag: "🇹🇷", dialCode: "+90" },

  // Europe
  { iso2: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { iso2: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { iso2: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { iso2: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34" },
  { iso2: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39" },
  { iso2: "NL", name: "Netherlands", flag: "🇳🇱", dialCode: "+31" },
  { iso2: "SE", name: "Sweden", flag: "🇸🇪", dialCode: "+46" },
  { iso2: "NO", name: "Norway", flag: "🇳🇴", dialCode: "+47" },

  // North America
  { iso2: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { iso2: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { iso2: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52" },

  // APAC
  { iso2: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { iso2: "NZ", name: "New Zealand", flag: "🇳🇿", dialCode: "+64" },
  { iso2: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { iso2: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
  { iso2: "BD", name: "Bangladesh", flag: "🇧🇩", dialCode: "+880" },
  { iso2: "PH", name: "Philippines", flag: "🇵🇭", dialCode: "+63" },
  { iso2: "ID", name: "Indonesia", flag: "🇮🇩", dialCode: "+62" },
  { iso2: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60" },
  { iso2: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
  { iso2: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { iso2: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82" },
  { iso2: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },

  // Africa & LATAM common
  { iso2: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27" },
  { iso2: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
  { iso2: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254" },
  { iso2: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
  { iso2: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
];

/**
 * Lookup by ISO 3166-1 alpha-2.
 *
 * Case-insensitive to be forgiving of API payloads that use lowercase
 * codes. Returns `undefined` when the code isn't in the curated table
 * — callers should fall back to {@link DEFAULT_PHONE_COUNTRY_ISO2}.
 */
export function findCountryByIso2(iso2: string | null | undefined): PhoneCountry | undefined {
  if (!iso2) return undefined;
  const upper = iso2.toUpperCase();

  return PHONE_COUNTRIES.find((entry) => entry.iso2 === upper);
}

/**
 * Best-effort parser: takes an E.164-ish string ("+9665551234567") and
 * splits it into `{country, nationalNumber}` by matching the longest
 * dial-code prefix from the table.
 *
 * Deliberately *not* validating the national number — that's a backend
 * concern (Laravel Propaganistas). We just want to render the composite
 * cleanly on load.
 *
 * Returns `undefined` when the input doesn't start with `+` or no dial
 * code prefix matches. Callers fall back to `DEFAULT_PHONE_COUNTRY_ISO2`.
 *
 * @example
 * parseE164("+15551234567") // → {country: US, nationalNumber: "5551234567"}
 * parseE164("+966555123456") // → {country: SA, nationalNumber: "555123456"}
 * parseE164("hello") // → undefined
 */
export function parseE164(
  value: string,
): { country: PhoneCountry; nationalNumber: string } | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();

  if (!trimmed.startsWith("+")) return undefined;

  // Sort longest-first so `+9665551234567` isn't misattributed to `+9`
  // (which doesn't exist) instead of `+966`.
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const match = sorted.find((entry) => trimmed.startsWith(entry.dialCode));

  if (!match) return undefined;

  return { country: match, nationalNumber: trimmed.slice(match.dialCode.length) };
}

/**
 * Compose an E.164 string from a country + national number. Strips
 * every non-digit before joining so users can type spaces and dashes
 * in the visible field without corrupting the emitted value.
 *
 * Returns `""` when the national number is empty — matches "no value"
 * so downstream `coerceValue` drops the field from the payload.
 */
export function formatE164(country: PhoneCountry, nationalNumber: string): string {
  const digits = nationalNumber.replace(/[^\d]/g, "");

  if (digits.length === 0) return "";

  return `${country.dialCode}${digits}`;
}
