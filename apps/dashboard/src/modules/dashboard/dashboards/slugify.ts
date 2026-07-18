/**
 * @file slugify.ts
 * @module modules/dashboard/dashboards/slugify
 *
 * @description
 * Small helpers used by the storage adapter to compute unique dashboard
 * slugs. Slug generation is idempotent — feeding a slug back through
 * `slugify` returns the same slug — and case-insensitive.
 *
 * Uniqueness is enforced by {@link ensureUniqueSlug} which walks a
 * candidate slug and appends `-2`, `-3`, … until it finds an unused
 * suffix. The adapter calls this at create + rename time.
 */

/** Reserved slugs the router owns — never allocate these. */
const RESERVED_SLUGS: readonly string[] = ["new", "create", "edit", "embed", "settings"];

/**
 * Normalise an arbitrary string into a URL-safe slug.
 *
 * Rules:
 *
 *   * Trim leading/trailing whitespace.
 *   * Lowercase.
 *   * Replace runs of any non-alphanumeric character (including
 *     accents) with a single hyphen.
 *   * Collapse consecutive hyphens.
 *   * Strip leading/trailing hyphens.
 *   * Cap at 60 characters (mirrors the backend column limit).
 */
export function slugify(input: string): string {
  const normalised = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const hyphenated = normalised.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const truncated = hyphenated.slice(0, 60);

  if (truncated === "" || RESERVED_SLUGS.includes(truncated)) {
    return `${truncated}${truncated === "" ? "" : "-"}dashboard`;
  }

  return truncated;
}

/**
 * Given a candidate slug and the list of existing slugs, returns the
 * candidate itself when free or `<candidate>-2`, `<candidate>-3`, …
 * until an unused suffix is found. `ignoreSlug` lets the rename path
 * exclude the record's own current slug from the collision check.
 */
export function ensureUniqueSlug(
  candidate: string,
  existing: readonly string[],
  ignoreSlug?: string,
): string {
  const taken = new Set(existing.filter((entry) => entry !== ignoreSlug));

  if (!taken.has(candidate)) {
    return candidate;
  }

  let counter = 2;

  while (taken.has(`${candidate}-${counter}`)) {
    counter += 1;
  }

  return `${candidate}-${counter}`;
}
