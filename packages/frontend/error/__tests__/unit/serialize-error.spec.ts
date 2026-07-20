/**
 * @file serialize-error.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for `serializeError(value)` — convert
 *   any thrown value into a JSON-safe `SerializedError` snapshot.
 */

import { describe, expect, it } from "vitest";

import { serializeError } from "@/core/utils/serialize-error.util";

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("serializeError", () => {
  it("produces a plain object with `name`, `message`, and `stack` for a regular Error", () => {
    const err = new Error("boom");
    const snapshot = serializeError(err);
    expect(snapshot.name).toBe("Error");
    expect(snapshot.message).toBe("boom");
    // Stack is populated when the runtime provides one — jsdom does.
    expect(typeof snapshot.stack).toBe("string");
  });

  it("preserves the constructor name of Error subclasses via `.name`", () => {
    class ValidationError extends Error {
      public constructor() {
        super("invalid");
        this.name = "ValidationError";
      }
    }
    const snapshot = serializeError(new ValidationError());
    expect(snapshot.name).toBe("ValidationError");
  });

  it("serialises a nested `cause` chain recursively", () => {
    // ES2022 `Error` chaining: an Error can wrap another Error via
    // the `cause` field. `serializeError` walks the chain end-to-end.
    const root = new Error("root cause");
    const middle = new Error("middle", { cause: root });
    const outer = new Error("outer", { cause: middle });

    const snapshot = serializeError(outer);
    expect(snapshot.message).toBe("outer");
    expect(snapshot.cause?.message).toBe("middle");
    expect(snapshot.cause?.cause?.message).toBe("root cause");
  });

  it("normalises non-Error thrown values before serialising", () => {
    // Strings, plain objects, primitives — every input reaches the
    // same `{ name, message, stack? }` shape.
    const snapshot = serializeError("boom");
    expect(snapshot.name).toBe("Error");
    expect(snapshot.message).toBe("boom");
  });

  it("is JSON-safe — the snapshot round-trips through JSON.stringify", () => {
    const err = new Error("a", { cause: new Error("b") });
    const roundTripped = JSON.parse(JSON.stringify(serializeError(err))) as {
      message: string;
      cause?: { message: string };
    };
    expect(roundTripped.message).toBe("a");
    expect(roundTripped.cause?.message).toBe("b");
  });

  it("omits `cause` when the original error has no cause", () => {
    const snapshot = serializeError(new Error("plain"));
    expect(snapshot.cause).toBeUndefined();
  });

  it("does not walk into a `null` cause", () => {
    const err = new Error("x");
    // Some libraries set `error.cause = null` explicitly. The helper
    // treats it as "no cause" (guard: `!== null`).
    (err as unknown as { cause: unknown }).cause = null;
    expect(serializeError(err).cause).toBeUndefined();
  });
});
