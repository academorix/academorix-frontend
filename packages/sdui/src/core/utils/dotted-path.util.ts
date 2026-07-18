/**
 * @file dotted-path.util.ts
 * @module @stackra/sdui/core/utils
 * @description Immutable dotted-path helpers reused by the runtime context.
 */

/**
 * Read a value from a nested object by dotted path.
 */
export function getAtPath(source: unknown, path: string): unknown {
  if (source == null || path.length === 0) return source;
  const segments = path.split('.');
  let cursor: unknown = source;
  for (const key of segments) {
    if (cursor == null || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

/**
 * Immutably set a value at a nested dotted path.
 *
 * Clones only the touched spine; unrelated branches share identity with
 * the original so React `useMemo` / `Object.is` comparisons stay cheap.
 */
export function setAtPath<T extends object>(source: T, path: string, value: unknown): T {
  if (path.length === 0) return source;
  const segments = path.split('.');

  function step(cursor: unknown, index: number): unknown {
    const key = segments[index]!;
    const container: Record<string, unknown> =
      cursor != null && typeof cursor === 'object'
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
