/**
 * @file pipeline-error.spec.ts
 * @module @stackra/pipeline/__tests__/unit
 * @description Behavioural spec for `PipelineError` — the shared error
 *   class every pipeline diagnostic wraps. Verifies the machine-
 *   readable code, cause chain preservation, and Error-family shape.
 */

import { describe, expect, it } from "vitest";

import { PipelineError } from "@/errors/pipeline.error";

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("PipelineError", () => {
  it("inherits from Error and keeps `.name`, `.message`, and default `.code`", () => {
    const error = new PipelineError("something broke");

    // Constructor sets `name` to `'PipelineError'` explicitly so
    // `error.constructor.name` and `error.name` agree even after
    // minification.
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PipelineError);
    expect(error.name).toBe("PipelineError");
    expect(error.message).toBe("something broke");
    // The `code` default lives inside the constructor signature.
    expect(error.code).toBe("PIPELINE_ERROR");
    // No cause supplied — cause stays undefined.
    expect(error.cause).toBeUndefined();
  });

  it("stores a supplied machine-readable code", () => {
    const error = new PipelineError("boom", "PIPE_RESOLUTION_FAILED");

    // The code is exposed as a public readonly field so callers can
    // switch/case on it without string-matching the message.
    expect(error.code).toBe("PIPE_RESOLUTION_FAILED");
  });

  it("preserves the original error under `.cause`", () => {
    const original = new TypeError("bad arg");
    const wrapped = new PipelineError("pipeline failed", "PIPE_EXECUTION_FAILED", original);

    // The cause is available for `console.error` chain output and for
    // programmatic root-cause inspection.
    expect(wrapped.cause).toBe(original);
    expect(wrapped.cause?.name).toBe("TypeError");
  });

  it("is throwable and catchable as a PipelineError specifically", () => {
    try {
      throw new PipelineError("boom", "CUSTOM");
    } catch (error) {
      // `instanceof` works reliably because the constructor sets
      // `Object.setPrototypeOf(this, PipelineError.prototype)` — a
      // known workaround for `extends Error` under ES5 target.
      expect(error).toBeInstanceOf(PipelineError);
      expect((error as PipelineError).code).toBe("CUSTOM");
    }
  });
});
