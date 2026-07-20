/**
 * @file ensure-unique-slug.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Given a candidate slug and the list of existing slugs,
 *   return the candidate itself when free, or `<candidate>-2`,
 *   `<candidate>-3`, … until an unused suffix is found.
 *
 *   `ignoreSlug` lets the rename path exclude the record's own current
 *   slug from the collision check.
 */

/**
 * Resolve slug collisions by appending an incrementing suffix.
 *
 * @param candidate - Slug to test.
 * @param existing - Every slug currently in use.
 * @param ignoreSlug - Optional slug to exclude from the collision
 *   check (typically the record's own current slug on a rename).
 * @returns A slug guaranteed not to collide.
 */
export function ensureUniqueSlug(
  candidate: string,
  existing: readonly string[],
  ignoreSlug?: string,
): string {
  // Drop the ignored slug from the taken set so a rename that lands
  // on the same value as the current slug is a no-op.
  const taken = new Set(existing.filter((entry) => entry !== ignoreSlug));

  if (!taken.has(candidate)) {
    return candidate;
  }

  let counter = 2;

  // Walk numeric suffixes until we find a free one. Ordinal 2 rather
  // than 1 keeps the natural "Foo" / "Foo-2" pairing that matches
  // every "Untitled" flow users are already used to.
  while (taken.has(`${candidate}-${counter}`)) {
    counter += 1;
  }

  return `${candidate}-${counter}`;
}
