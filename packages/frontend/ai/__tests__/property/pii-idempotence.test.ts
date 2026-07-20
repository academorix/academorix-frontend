/**
 * @file pii-idempotence.test.ts
 * @description Property 7 (Requirement 12.6) — for any random frame and
 *   any redaction ruleset with safe replacements, `redact(redact(x))`
 *   is structurally equal to `redact(x)`.
 *
 *   "Safe replacement" here means the replacement string does not itself
 *   satisfy the pattern — which is the correctness precondition for
 *   pattern-rule idempotence. We use `[REDACTED]` (default) and
 *   ASCII-safe custom tokens.
 */

import { describe, it } from "vitest";
import type { IAiConfig, IAiContextFrame, IPiiRule } from "@stackra/contracts";

import { PiiRedactor } from "@/core/services/pii-redactor.service";
import { deepEqual } from "@/core/utils/deep-equal.util";
import { forAll, type IPrng } from "./property-test.helper";

const WORDS = ["name", "email", "phone", "address", "ssn", "note"];
const VALUES = [
  "ada@example.com",
  "555-01-1234",
  "1600 Pennsylvania Ave",
  "user_42",
  "123-45-6789",
  "(555) 010-1234",
];

/** Generate a random JSON-serializable snapshot. */
function genSnapshot(r: IPrng, depth = 0): unknown {
  const kind = depth > 2 ? 0 : r.int(0, 5);
  switch (kind) {
    case 0:
      return r.pick(VALUES);
    case 1:
      return r.int(0, 1000);
    case 2:
      return r.bool();
    case 3: {
      const arr: unknown[] = [];
      const n = r.int(0, 4);
      for (let i = 0; i < n; i++) arr.push(genSnapshot(r, depth + 1));
      return arr;
    }
    default: {
      const obj: Record<string, unknown> = {};
      const n = r.int(1, 4);
      for (let i = 0; i < n; i++) obj[r.pick(WORDS)] = genSnapshot(r, depth + 1);
      return obj;
    }
  }
}

/** Generate a small ruleset with safe replacements. */
function genRules(r: IPrng): IPiiRule[] {
  const rules: IPiiRule[] = [];
  const n = r.int(0, 3);
  for (let i = 0; i < n; i++) {
    if (r.bool()) {
      rules.push({ field: r.pick(WORDS) });
    } else {
      // Regex that doesn't match the default replacement `[REDACTED]`.
      rules.push({
        pattern: "\\d{3}[- ]\\d{2}[- ]\\d{4}",
        replacement: `[X${i}]`,
      });
    }
  }
  return rules;
}

function makeRedactor(rules: IPiiRule[]): PiiRedactor {
  const config: IAiConfig = {
    baseUrl: "https://x",
    authProvider: { getCredentials: () => Promise.resolve({}), refresh: () => Promise.resolve({}) },
    context: { piiRules: rules },
  };
  return new PiiRedactor(config);
}

describe("Property 7: PII redactor idempotence (Req 12.6)", () => {
  it("redact(redact(x)) === redact(x)", () => {
    forAll(
      (r) => ({ snapshot: genSnapshot(r), rules: genRules(r) }),
      ({ snapshot, rules }) => {
        const redactor = makeRedactor(rules);
        const input: IAiContextFrame = { key: "k", snapshot, priority: 0, seq: 0 };
        const once = redactor.redact(input);
        const twice = redactor.redact(once);
        return deepEqual(once.snapshot, twice.snapshot);
      },
      { runs: 250 },
    );
  });
});
