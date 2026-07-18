/**
 * @file csv.ts
 * @module lib/csv
 *
 * @description
 * Client-side CSV serialisation for the "Export CSV" bulk action. Flattens
 * one level of nested objects (so `status: {text, color}` renders as
 * `status.text` + `status.color` columns).
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);

  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;

  return str;
}

function collectHeaders(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>();

  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const sub of Object.keys(value as Record<string, unknown>)) {
          set.add(`${key}.${sub}`);
        }
      } else {
        set.add(key);
      }
    }
  }

  return [...set];
}

function readPath(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];

    return undefined;
  }, row);
}

/** Serialise `rows` to a CSV string. Nested objects are flattened one level deep. */
export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = collectHeaders(rows);
  const body = rows.map((row) =>
    headers.map((header) => escapeCell(readPath(row, header))).join(","),
  );

  return [headers.join(","), ...body].join("\n");
}

/** Trigger a download of `csv` as `<name>.csv`. Browser-only. */
export function downloadCsv(csv: string, name: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${name}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
