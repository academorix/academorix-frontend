/**
 * @file duplicate-tag.error.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `DuplicatePublishableTagError` — the
 *   fail-loud error thrown when two modules try to claim the same
 *   `--tag=<name>` across the workspace.
 */

import { describe, expect, it } from "vitest";

import { ConsoleError } from "@/errors";
import { DuplicatePublishableTagError } from "@/publishing/errors/duplicate-tag.error";

describe("DuplicatePublishableTagError", () => {
  it("extends ConsoleError so a workspace-wide catch can catch it", () => {
    // The base `ConsoleError` is the family root — every console
    // error inherits so a top-level try/catch in the CLI kernel can
    // funnel them into a single failure path.
    const err = new DuplicatePublishableTagError("cache-config", "First", "Second");
    expect(err).toBeInstanceOf(ConsoleError);
    expect(err).toBeInstanceOf(Error);
  });

  it("sets `.name` to the concrete class name", () => {
    // Callers grep `.name` in logs — the string must match the
    // exported class name exactly.
    const err = new DuplicatePublishableTagError("cache-config", "First", "Second");
    expect(err.name).toBe("DuplicatePublishableTagError");
  });

  it("preserves the tag + both offender names as public fields", () => {
    const err = new DuplicatePublishableTagError("cache-config", "FirstModule", "SecondModule");
    expect(err.tag).toBe("cache-config");
    expect(err.firstSource).toBe("FirstModule");
    expect(err.secondSource).toBe("SecondModule");
  });

  it("weaves tag + BOTH sources into the message so operators can trace both offenders", () => {
    const err = new DuplicatePublishableTagError("routing-config", "RoutingModule", "SecondModule");
    // Full, hand-written expectation of the message — this is a
    // user-facing string that operators read. Any change to the
    // message shape should be a deliberate PR, not an accident.
    expect(err.message).toContain("routing-config");
    expect(err.message).toContain("RoutingModule");
    expect(err.message).toContain("SecondModule");
    expect(err.message).toContain("already registered");
    expect(err.message).toContain("re-register");
    expect(err.message).toContain("unique");
  });

  it("suggests a mitigation (rename one of the tags)", () => {
    // The error message should give the operator a concrete next
    // step — the fail-loud contract requires it.
    const err = new DuplicatePublishableTagError("foo-bar", "A", "B");
    expect(err.message).toMatch(/rename/i);
  });
});
