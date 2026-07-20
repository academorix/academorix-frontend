/**
 * @file operators.ts
 * @module @stackra/sdui/core/expression
 * @description Allow-listed operators for the sandboxed evaluator.
 *
 *   Every operator is total — passing unexpected operand types returns
 *   a JSON-safe fallback (`false`, `0`, `''`, `null`) rather than
 *   throwing. This keeps the evaluator predictable when server payloads
 *   are partially hydrated or contain edge cases.
 */

import type { SduiOperator } from "@stackra/contracts";

/**
 * A single operator implementation. Receives resolved (non-expression)
 * argument values.
 */
type OperatorFn = (args: readonly unknown[]) => unknown;

/** Operator table, keyed by `SduiOperator`. */
export const OPERATORS: Readonly<Record<SduiOperator, OperatorFn>> = Object.freeze({
  "==": ([a, b]) => a === b,
  "!=": ([a, b]) => a !== b,
  ">": ([a, b]) => Number(a) > Number(b),
  ">=": ([a, b]) => Number(a) >= Number(b),
  "<": ([a, b]) => Number(a) < Number(b),
  "<=": ([a, b]) => Number(a) <= Number(b),
  and: (args) => args.every(Boolean),
  or: (args) => args.some(Boolean),
  not: ([a]) => !a,
  concat: (args) => args.map((v) => (v == null ? "" : String(v))).join(""),
  coalesce: (args) => args.find((v) => v != null) ?? null,
});
