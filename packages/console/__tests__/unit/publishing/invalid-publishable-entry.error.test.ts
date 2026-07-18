/**
 * @file invalid-publishable-entry.error.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `InvalidPublishableEntryError` — the
 *   register-time validation failure thrown when a publishable entry
 *   has bad shape (tag, packageRoot, files[], from, to, ...).
 */

import { describe, expect, it } from "vitest";

import { ConsoleError } from "@/errors";
import { InvalidPublishableEntryError } from "@/publishing/errors/invalid-publishable-entry.error";

describe("InvalidPublishableEntryError", () => {
  it("extends ConsoleError so it can be caught by workspace-wide handlers", () => {
    const err = new InvalidPublishableEntryError("tag", "must be non-empty", "SomeModule");
    expect(err).toBeInstanceOf(ConsoleError);
    expect(err).toBeInstanceOf(Error);
  });

  it("sets `.name` to the concrete class name", () => {
    const err = new InvalidPublishableEntryError("tag", "must be non-empty", "SomeModule");
    expect(err.name).toBe("InvalidPublishableEntryError");
  });

  it("preserves field, reason, and source as public fields", () => {
    const err = new InvalidPublishableEntryError("files[].from", "must be relative", "QueueModule");
    expect(err.field).toBe("files[].from");
    expect(err.reason).toBe("must be relative");
    expect(err.source).toBe("QueueModule");
  });

  it("weaves source, field, and reason into the message", () => {
    // Full sentence shape check — the emitted message contains the
    // source class name, the field name (in quotes), and the reason.
    const err = new InvalidPublishableEntryError("packageRoot", "must be absolute", "CacheModule");
    expect(err.message).toContain("CacheModule");
    expect(err.message).toContain("packageRoot");
    expect(err.message).toContain("must be absolute");
  });

  it("names ALL five field categories the registry checks", () => {
    // Guardrail — the field names below are the specific strings the
    // registry passes when it rejects an entry. If any of these
    // strings change, the tests below need to update in tandem.
    const cases = [
      "tag",
      "packageRoot",
      "files",
      "files[].from",
      "files[].to",
    ];
    for (const field of cases) {
      const err = new InvalidPublishableEntryError(field, "bad shape", "TestModule");
      expect(err.field).toBe(field);
      expect(err.message).toContain(field);
    }
  });
});
