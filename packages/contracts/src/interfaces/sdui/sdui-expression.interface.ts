/**
 * @file sdui-expression.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description The sandboxed expression contract for dynamic SDUI values.
 *   Two forms: path lookup (`$exp: '$.data.foo'`) and allow-listed
 *   operator invocation (`$op: '>', args: [...]`). Never evaluated via
 *   `eval` or `Function`.
 */

import type { SduiJsonValue } from "./sdui-primitive.type";

/**
 * The allow-listed operators the sandboxed evaluator supports.
 */
export type SduiOperator =
  "==" | "!=" | ">" | ">=" | "<" | "<=" | "and" | "or" | "not" | "concat" | "coalesce";

/**
 * A path-form expression — a dotted read from the eval scope.
 * `$exp: '$.data.user.name'` resolves to `scope.data.user.name`.
 */
export interface ISduiExpressionPath {
  readonly $exp: string;
}

/**
 * An operator-form expression — an allow-listed operator applied to
 * a fixed-arity list of arguments, each of which may itself be an
 * expression.
 */
export interface ISduiExpressionOp {
  readonly $op: SduiOperator;
  readonly args: readonly SduiBindable[];
}

/**
 * A single SDUI expression — either path form or operator form.
 */
export type ISduiExpression = ISduiExpressionPath | ISduiExpressionOp;

/**
 * A "bindable" value — a JSON scalar, structure, or an expression.
 * Anywhere the SDUI schema accepts dynamic input, it accepts a bindable.
 */
export type SduiBindable = SduiJsonValue | ISduiExpression;
