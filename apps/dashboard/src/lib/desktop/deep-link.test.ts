/**
 * @file deep-link.test.ts
 * @module desktop/deep-link.test
 *
 * @description
 * Exhaustive tests for {@link resolveDeepLinkPath} — the pure URL
 * parser that maps `academorix://` URLs to React Router paths.
 *
 * The routing table from DESKTOP_PLAN.md §4.5:
 *
 *  - `academorix://workspace/{slug}` → `/{slug}/dashboard`
 *  - `academorix://workspace/{slug}/{resource}` → `/{slug}/{resource}`
 *  - `academorix://reset-password?token=…&email=…` → `/reset-password?…`
 *  - `academorix://invite?code=…` → `/invite/{code}`
 *  - `academorix://join?token=…` → `/onboarding/join?…`
 *
 * Anything else (unknown host, wrong scheme, malformed URL) resolves
 * to `{ handled: false }` so the caller can log-and-continue.
 */

import { describe, expect, it } from "vitest";

import { resolveDeepLinkPath } from "@/lib/desktop/deep-link";

describe("resolveDeepLinkPath — workspace routes", () => {
  it("maps academorix://workspace/{slug} to /{slug}/dashboard", () => {
    const result = resolveDeepLinkPath("academorix://workspace/nike");

    expect(result.handled).toBe(true);
    expect(result.path).toBe("/nike/dashboard");
  });

  it("maps academorix://workspace/{slug}/{resource} to /{slug}/{resource}", () => {
    const result = resolveDeepLinkPath("academorix://workspace/nike/athletes");

    expect(result.handled).toBe(true);
    expect(result.path).toBe("/nike/athletes");
  });

  it("preserves nested resource paths", () => {
    const result = resolveDeepLinkPath("academorix://workspace/nike/athletes/abc");

    expect(result.handled).toBe(true);
    expect(result.path).toBe("/nike/athletes/abc");
  });

  it("preserves query params on workspace paths", () => {
    const result = resolveDeepLinkPath("academorix://workspace/nike/athletes?filter=active");

    expect(result.handled).toBe(true);
    expect(result.path).toBe("/nike/athletes?filter=active");
  });

  it("returns handled=false for workspace URL with no slug", () => {
    const result = resolveDeepLinkPath("academorix://workspace");

    expect(result.handled).toBe(false);
  });
});

describe("resolveDeepLinkPath — password reset", () => {
  it("maps reset-password with query params", () => {
    const result = resolveDeepLinkPath(
      "academorix://reset-password?token=abc&email=user%40example.com",
    );

    expect(result.handled).toBe(true);
    expect(result.path).toBe("/reset-password?token=abc&email=user%40example.com");
  });
});

describe("resolveDeepLinkPath — invite", () => {
  it("maps invite with code to /invite/{code}", () => {
    const result = resolveDeepLinkPath("academorix://invite?code=xyz-123");

    expect(result.handled).toBe(true);
    expect(result.path).toBe("/invite/xyz-123");
  });

  it("returns handled=false for invite with no code", () => {
    const result = resolveDeepLinkPath("academorix://invite");

    expect(result.handled).toBe(false);
  });

  it("URI-encodes the code so a `+` in the code doesn't break the path", () => {
    const result = resolveDeepLinkPath("academorix://invite?code=user+foo");

    expect(result.handled).toBe(true);
    // The parser decodes the query string once, then re-encodes for
    // the path — so `+` in the query (which URL decodes to space)
    // rides back as `%20`.
    expect(result.path).toBe("/invite/user%20foo");
  });
});

describe("resolveDeepLinkPath — join", () => {
  it("maps join with query params", () => {
    const result = resolveDeepLinkPath("academorix://join?token=abc123");

    expect(result.handled).toBe(true);
    expect(result.path).toBe("/onboarding/join?token=abc123");
  });
});

describe("resolveDeepLinkPath — unknown routes", () => {
  it("returns handled=false for unknown hosts", () => {
    const result = resolveDeepLinkPath("academorix://not-a-real-route");

    expect(result.handled).toBe(false);
  });

  it("returns handled=false for non-academorix schemes", () => {
    // Guardrail: we mustn't accidentally handle `javascript:` /
    // `data:` / other schemes even if forwarded through the shell.
    const result = resolveDeepLinkPath("https://academorix.com/workspace/nike");

    expect(result.handled).toBe(false);
  });

  it("returns handled=false for malformed URLs", () => {
    const result = resolveDeepLinkPath("not a url");

    expect(result.handled).toBe(false);
  });
});
