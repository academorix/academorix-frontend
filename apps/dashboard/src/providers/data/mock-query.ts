/**
 * @file mock-query.ts
 * @module providers/data/mock-query
 *
 * @description
 * Client-side implementations of Refine's filtering and sorting semantics,
 * used by the {@link createMockDataProvider mock data provider} to process
 * `public/data/*.json` fixtures the same way the Laravel API processes queries
 * server-side.
 *
 * Keeping this logic isolated (and pure) makes it straightforward to unit-test
 * every operator without touching the network or Refine.
 */

import type {
  BaseRecord,
  ConditionalFilter,
  CrudFilter,
  CrudFilters,
  CrudSorting,
  LogicalFilter,
} from "@refinedev/core";

/**
 * Coerces an arbitrary field value into something comparable:
 * numeric strings → numbers, date-like strings → epoch ms, everything else →
 * a lowercased string. This lets a single comparator order numbers, dates, and
 * text sensibly.
 */
function toComparable(value: unknown): number | string {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (value === null || value === undefined) {
    return "";
  }

  const asString = String(value);

  if (asString.trim() !== "" && !Number.isNaN(Number(asString))) {
    return Number(asString);
  }

  const asTime = Date.parse(asString);

  if (!Number.isNaN(asTime)) {
    return asTime;
  }

  return asString.toLowerCase();
}

/** Three-way comparison of two arbitrary values (ascending order). */
export function compareValues(a: unknown, b: unknown): number {
  const ca = toComparable(a);
  const cb = toComparable(b);

  if (typeof ca === "number" && typeof cb === "number") {
    return ca - cb;
  }

  return String(ca).localeCompare(String(cb));
}

/** Loose scalar equality by string coercion (so `1 === "1"`). */
function looseEquals(a: unknown, b: unknown): boolean {
  return String(a) === String(b);
}

/** Normalises a filter value that may be an array or a comma-separated string. */
function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return String(value).split(",");
}

/**
 * Evaluates a single Refine operator against a record's field value.
 * Unknown operators pass through as `true` (no filtering) so an unsupported
 * filter never silently empties a mock list.
 */
function matchOperator(
  fieldValue: unknown,
  operator: LogicalFilter["operator"],
  value: unknown,
): boolean {
  const haystack = String(fieldValue ?? "").toLowerCase();
  const needle = String(value ?? "").toLowerCase();

  switch (operator) {
    case "eq":
    case "eqs":
      return looseEquals(fieldValue, value);
    case "ne":
    case "nes":
      return !looseEquals(fieldValue, value);
    case "lt":
      return compareValues(fieldValue, value) < 0;
    case "lte":
      return compareValues(fieldValue, value) <= 0;
    case "gt":
      return compareValues(fieldValue, value) > 0;
    case "gte":
      return compareValues(fieldValue, value) >= 0;
    case "in":
    case "ina":
      return toArray(value).some((item) => looseEquals(item, fieldValue));
    case "nin":
    case "nina":
      return !toArray(value).some((item) => looseEquals(item, fieldValue));
    case "contains":
      return haystack.includes(needle);
    case "ncontains":
      return !haystack.includes(needle);
    case "containss":
      return String(fieldValue ?? "").includes(String(value ?? ""));
    case "ncontainss":
      return !String(fieldValue ?? "").includes(String(value ?? ""));
    case "startswith":
      return haystack.startsWith(needle);
    case "nstartswith":
      return !haystack.startsWith(needle);
    case "startswiths":
      return String(fieldValue ?? "").startsWith(String(value ?? ""));
    case "nstartswiths":
      return !String(fieldValue ?? "").startsWith(String(value ?? ""));
    case "endswith":
      return haystack.endsWith(needle);
    case "nendswith":
      return !haystack.endsWith(needle);
    case "endswiths":
      return String(fieldValue ?? "").endsWith(String(value ?? ""));
    case "nendswiths":
      return !String(fieldValue ?? "").endsWith(String(value ?? ""));
    case "null":
      return fieldValue === null || fieldValue === undefined;
    case "nnull":
      return fieldValue !== null && fieldValue !== undefined;
    case "between": {
      const [min, max] = toArray(value);

      return compareValues(fieldValue, min) >= 0 && compareValues(fieldValue, max) <= 0;
    }
    case "nbetween": {
      const [min, max] = toArray(value);

      return !(compareValues(fieldValue, min) >= 0 && compareValues(fieldValue, max) <= 0);
    }
    default:
      return true;
  }
}

/** Type guard distinguishing a conditional (`and`/`or`) filter. */
function isConditionalFilter(filter: CrudFilter): filter is ConditionalFilter {
  return filter.operator === "or" || filter.operator === "and";
}

/** Evaluates one filter (logical or nested conditional) against a record. */
function matchesFilter(record: BaseRecord, filter: CrudFilter): boolean {
  if (isConditionalFilter(filter)) {
    if (filter.operator === "or") {
      return filter.value.some((child) => matchesFilter(record, child));
    }

    return filter.value.every((child) => matchesFilter(record, child));
  }

  return matchOperator(record[filter.field], filter.operator, filter.value);
}

/**
 * Returns `true` when a record satisfies **every** top-level filter (Refine
 * ANDs the top-level filter array).
 */
export function matchesFilters(record: BaseRecord, filters: CrudFilters): boolean {
  return filters.every((filter) => matchesFilter(record, filter));
}

/**
 * Returns a new array sorted by the given sorters, applied in priority order
 * (first sorter wins; subsequent sorters break ties). Non-mutating.
 */
export function sortRecords<T extends BaseRecord>(records: T[], sorters: CrudSorting): T[] {
  return [...records].sort((a, b) => {
    for (const sorter of sorters) {
      const direction = sorter.order === "desc" ? -1 : 1;
      const result = compareValues(a[sorter.field], b[sorter.field]) * direction;

      if (result !== 0) {
        return result;
      }
    }

    return 0;
  });
}
