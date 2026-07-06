/**
 * @file format.ts
 * @module lib/format
 *
 * @description
 * Small, locale-aware display formatters shared across modules (dates, date-times,
 * and money). Centralising these keeps list/show rendering consistent and avoids
 * duplicating `Intl` calls in every page.
 */

/** Renders an ISO date/timestamp as a short local date, or `"—"` when empty/invalid. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

/** Renders an ISO timestamp as a short local date + time, or `"—"` when empty/invalid. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

/**
 * Formats a decimal-string amount in the given ISO-4217 currency. Amounts are
 * strings (as the API serializes them) to avoid float drift; parsing happens
 * only at display time.
 *
 * @param amount - Decimal string, e.g. `"120.00"`.
 * @param currency - ISO-4217 code, e.g. `"USD"`. Defaults to `"USD"`.
 */
export function formatMoney(amount: string | number | null | undefined, currency = "USD"): string {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numeric = typeof amount === "number" ? amount : Number.parseFloat(amount);

  if (Number.isNaN(numeric)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(numeric);
}
