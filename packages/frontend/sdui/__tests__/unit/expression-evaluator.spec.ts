/**
 * @file expression-evaluator.spec.ts
 * @description Unit tests for the sandboxed SDUI expression evaluator.
 */

import { describe, expect, it } from "vitest";
import type { ISduiEvalScope } from "@stackra/contracts";
import {
  evaluateExpression,
  isExpression,
  resolveBindable,
  evaluateBoolean,
} from "@/core/expression";

const scope: ISduiEvalScope = {
  data: { user: { name: "Ada", age: 42 }, count: 3 },
  state: { form: { email: "ada@example.com" } },
  user: { id: "u_1" },
};

describe("expression evaluator", () => {
  it("resolves a path expression", () => {
    expect(evaluateExpression({ $exp: "$.data.user.name" }, scope)).toBe("Ada");
  });

  it("returns undefined for a missing path segment", () => {
    expect(evaluateExpression({ $exp: "$.data.missing.field" }, scope)).toBeUndefined();
  });

  it("evaluates an operator expression", () => {
    expect(evaluateExpression({ $op: ">", args: [{ $exp: "$.data.count" }, 1] }, scope)).toBe(true);
  });

  it("resolves nested operators", () => {
    expect(
      evaluateExpression(
        {
          $op: "and",
          args: [
            { $op: ">", args: [{ $exp: "$.data.count" }, 0] },
            { $op: "==", args: [{ $exp: "$.data.user.name" }, "Ada"] },
          ],
        },
        scope,
      ),
    ).toBe(true);
  });

  it("never throws on ill-defined operand types", () => {
    // `>` receives undefined and 'x' — coerced to NaN, returns false.
    const result = evaluateExpression({ $op: ">", args: [{ $exp: "$.data.missing" }, "x"] }, scope);
    expect(result).toBe(false);
  });

  it("coalesce returns the first non-null argument", () => {
    expect(
      evaluateExpression(
        { $op: "coalesce", args: [{ $exp: "$.data.missing" }, "fallback"] },
        scope,
      ),
    ).toBe("fallback");
  });

  it("concat produces a single string", () => {
    expect(
      evaluateExpression(
        {
          $op: "concat",
          args: ["Hello, ", { $exp: "$.data.user.name" }, "!"],
        },
        scope,
      ),
    ).toBe("Hello, Ada!");
  });

  it("isExpression discriminates plain objects from expressions", () => {
    expect(isExpression({ $exp: "$.x" })).toBe(true);
    expect(isExpression({ $op: "==", args: [1, 1] })).toBe(true);
    expect(isExpression({ x: 1 })).toBe(false);
    expect(isExpression("literal")).toBe(false);
    expect(isExpression(42)).toBe(false);
  });

  it("resolveBindable walks arrays and objects", () => {
    const bindable = {
      title: { $exp: "$.data.user.name" },
      counts: [{ $exp: "$.data.count" }, 100],
    };
    expect(resolveBindable(bindable, scope)).toEqual({
      title: "Ada",
      counts: [3, 100],
    });
  });

  it("evaluateBoolean coerces to a boolean", () => {
    expect(evaluateBoolean({ $exp: "$.data.user.name" }, scope)).toBe(true);
    expect(evaluateBoolean({ $exp: "$.data.missing" }, scope)).toBe(false);
    expect(evaluateBoolean(0, scope)).toBe(false);
    expect(evaluateBoolean("x", scope)).toBe(true);
  });
});
