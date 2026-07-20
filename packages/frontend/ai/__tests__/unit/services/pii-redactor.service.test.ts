/**
 * @file pii-redactor.service.test.ts
 * @description Unit tests for {@link PiiRedactor} — field-path rules,
 *   regex-pattern rules, deep-clone (non-mutation), and idempotence
 *   (Req 12.6). Property 7 (idempotence over random inputs) lives in
 *   `../../property/pii-idempotence.test.ts`.
 */

import { describe, expect, it } from "vitest";
import type { IAiConfig, IAiContextFrame, IPiiRule } from "@stackra/contracts";

import { PiiRedactor } from "@/core/services/pii-redactor.service";

function makeRedactor(rules: IPiiRule[]): PiiRedactor {
  const config: IAiConfig = {
    baseUrl: "https://x",
    authProvider: {
      getCredentials: () => Promise.resolve({}),
      refresh: () => Promise.resolve({}),
    },
    context: { piiRules: rules },
  };
  return new PiiRedactor(config);
}

const frame = (snapshot: unknown): IAiContextFrame => ({
  key: "k",
  snapshot,
  priority: 0,
  seq: 0,
});

describe("PiiRedactor field rules", () => {
  it("replaces a top-level field with the default replacement", () => {
    const redactor = makeRedactor([{ field: "email" }]);
    const output = redactor.redact(frame({ email: "ada@example.com", name: "Ada" }));
    expect(output.snapshot).toEqual({ email: "[REDACTED]", name: "Ada" });
  });

  it("replaces a nested field via dot-path", () => {
    const redactor = makeRedactor([{ field: "user.email" }]);
    const output = redactor.redact(frame({ user: { email: "a@b.com", role: "admin" } }));
    expect(output.snapshot).toEqual({ user: { email: "[REDACTED]", role: "admin" } });
  });

  it("uses a custom replacement token when supplied", () => {
    const redactor = makeRedactor([{ field: "email", replacement: "***" }]);
    const output = redactor.redact(frame({ email: "x@y" }));
    expect(output.snapshot).toEqual({ email: "***" });
  });

  it("leaves the snapshot untouched when the field is absent", () => {
    const redactor = makeRedactor([{ field: "ssn" }]);
    const output = redactor.redact(frame({ email: "a@b" }));
    expect(output.snapshot).toEqual({ email: "a@b" });
  });
});

describe("PiiRedactor pattern rules", () => {
  it("replaces regex matches inside string values", () => {
    // Simple email regex.
    const redactor = makeRedactor([
      { pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", replacement: "[EMAIL]" },
    ]);
    const output = redactor.redact(frame({ note: "Contact ada@example.com or bob@example.com" }));
    expect(output.snapshot).toEqual({ note: "Contact [EMAIL] or [EMAIL]" });
  });

  it("walks arrays and nested objects", () => {
    const redactor = makeRedactor([{ pattern: "\\d{3}-\\d{2}-\\d{4}", replacement: "[SSN]" }]);
    const output = redactor.redact(
      frame({
        notes: ["SSN: 123-45-6789 on file"],
        user: { record: "123-45-6789" },
      }),
    );
    expect(output.snapshot).toEqual({
      notes: ["SSN: [SSN] on file"],
      user: { record: "[SSN]" },
    });
  });

  it("ignores invalid regex rules (logs a warning, does not throw)", () => {
    const redactor = makeRedactor([{ pattern: "([unclosed" }]);
    expect(() => redactor.redact(frame({ x: "y" }))).not.toThrow();
  });
});

describe("PiiRedactor non-mutation", () => {
  it("does not mutate the original snapshot", () => {
    const redactor = makeRedactor([{ field: "email" }]);
    const original = { email: "a@b", name: "Ada" };
    redactor.redact(frame(original));
    expect(original).toEqual({ email: "a@b", name: "Ada" });
  });
});

describe("PiiRedactor idempotence (Req 12.6)", () => {
  it("field-rule: redact(redact(x)) === redact(x)", () => {
    const redactor = makeRedactor([{ field: "user.email" }]);
    const once = redactor.redact(frame({ user: { email: "a@b", name: "Ada" } }));
    const twice = redactor.redact(once);
    expect(twice.snapshot).toEqual(once.snapshot);
  });

  it("pattern-rule with safe replacement is idempotent", () => {
    const redactor = makeRedactor([
      { pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", replacement: "[EMAIL]" },
    ]);
    const once = redactor.redact(frame({ note: "Ada @ ada@example.com" }));
    const twice = redactor.redact(once);
    expect(twice.snapshot).toEqual(once.snapshot);
  });
});
