/**
 * @file dotted-path.util.ts
 * @module @stackra/state/actions/utils
 * @description Small immutable dotted-path helpers used by the state
 *   action handlers.
 */

/**
 * Read a value from a nested object by dotted path.
 *
 * @returns The value, or `undefined` if any intermediate segment is missing.
 */
export function getAtPath(source: unknown, path: string): unknown {
  if (source == null) return undefined;
  const segments = path.split(".");
  let cursor: unknown = source;
  for (const key of segments) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

/**
 * Immutably set a value at a nested dotted path — clones the touched
 * spine and returns a new object; unrelated branches share identity with
 * the original.
 */
export function setAtPath<T extends object>(source: T, path: string, value: unknown): T {
  const segments = path.split(".");
  if (segments.length === 0) return source;

  function step(cursor: unknown, index: number): unknown {
    const key = segments[index]!;
    const container: Record<string, unknown> =
      cursor != null && typeof cursor === "object"
        ? { ...(cursor as Record<string, unknown>) }
        : {};
    if (index === segments.length - 1) {
      container[key] = value;
    } else {
      container[key] = step(container[key], index + 1);
    }
    return container;
  }

  return step(source, 0) as T;
}
