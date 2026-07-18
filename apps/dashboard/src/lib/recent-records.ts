/**
 * @file recent-records.ts
 * @module lib/recent-records
 *
 * @description
 * Tracks the last 5 records the user opened, per §12 palette Recent group.
 * Persists to localStorage; expose an `add()` to write and `read()` to hydrate
 * the palette on open.
 */

const STORAGE_KEY = "academorix.recent-records.v1";
const MAX_RECENT = 5;

export type RecentRecord = {
  resource: string;
  id: string;
  label: string;
  icon?: string;
  visitedAt: number;
};

function readAll(): RecentRecord[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;

    if (!raw) return [];
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as RecentRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: RecentRecord[]): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECENT)));
    }
  } catch {
    // ignore quota errors
  }
}

/** Read the recent records in most-recent-first order. */
export function readRecentRecords(): RecentRecord[] {
  return readAll().sort((a, b) => b.visitedAt - a.visitedAt);
}

/** Push `record` to the front of the recents list, dedup on `resource+id`. */
export function pushRecentRecord(record: Omit<RecentRecord, "visitedAt">): void {
  const existing = readAll().filter(
    (entry) => !(entry.resource === record.resource && entry.id === record.id),
  );

  writeAll([{ ...record, visitedAt: Date.now() }, ...existing]);
}

/** Clear the recent records log. */
export function clearRecentRecords(): void {
  writeAll([]);
}
