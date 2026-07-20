/**
 * @file evaluator.ts
 * @module @stackra/sdui/core/expression
 * @description Sandboxed expression evaluator. Two forms — path
 *   (`{ $exp: '$.a.b' }`) and operator (`{ $op: '>', args: [...] }`).
 *
 *   Never uses `eval`, `Function`, `with`, `setTimeout(string)`, or any
 *   other dynamic code path. Every operator is total — ill-defined
 *   operands produce a JSON-safe fallback rather than throwing.
 */

import type { ISduiExpression, ISduiEvalScope, SduiBindable } from "@stackra/contracts";
import { OPERATORS } from "./operators";

/**
 * Type guard for an SDUI expression.
 */
export function isExpression(value: SduiBindable): value is ISduiExpression {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ("$exp" in (value as object) || "$op" in (value as object))
  );
}

/**
 * Read a value from the eval scope by dotted path (starting `$.`).
 * Returns `undefined` when any intermediate segment is missing.
 */
function readPath(path: string, scope: ISduiEvalScope): unknown {
  if (!path.startsWith("$.") && path !== "$") return undefined;
  const segments = path === "$" ? [] : path.slice(2).split(".").filter(Boolean);
  let cursor: unknown = scope;
  for (const segment of segments) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

/**
 * Evaluate an SDUI expression against the supplied scope.
 *
 * Total: never throws — operator errors and unknown operators produce a
 * JSON-safe fallback (`null`).
 */
export function evaluateExpression(expression: ISduiExpression, scope: ISduiEvalScope): unknown {
  if ("$exp" in expression) {
    return readPath(expression.$exp, scope);
  }
  const operator = OPERATORS[expression.$op];
  if (!operator) return null;
  const resolvedArgs = expression.args.map((arg) => resolveBindable(arg, scope));
  try {
    return operator(resolvedArgs);
  } catch {
    return null;
  }
}

/**
 * Resolve any bindable value against the eval scope.
 *
 * - Expressions are evaluated recursively.
 * - Arrays and plain objects are walked, resolving nested expressions.
 * - Scalars are returned unchanged.
 */
export function resolveBindable(value: SduiBindable, scope: ISduiEvalScope): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveBindable(item, scope));
  }
  if (isExpression(value)) {
    return evaluateExpression(value, scope);
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, SduiBindable>)) {
      result[key] = resolveBindable(nested, scope);
    }
    return result;
  }
  return value;
}

/**
 * Convenience for `visibleIf` guards — evaluate any bindable to a boolean.
 */
export function evaluateBoolean(value: SduiBindable, scope: ISduiEvalScope): boolean {
  return Boolean(resolveBindable(value, scope));
}
