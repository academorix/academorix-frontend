/**
 * @file csp.test.ts
 * @module @academorix/pwa/security/__tests__/csp.test
 *
 * @description
 * Tests for {@link buildContentSecurityPolicy}. Covers:
 *
 *  - Empty input falls back to `DEFAULT_CSP_INPUT`.
 *  - Every directive is emitted with correct spacing / joining.
 *  - `upgradeInsecureRequests: true` is emitted as a value-less directive.
 *  - `blockAllMixedContent` defaults to off.
 *  - `extra` map is appended AFTER standard directives, order preserved.
 *  - Empty-array directives are dropped entirely.
 *  - Overriding one directive doesn't wipe defaults for others.
 */

import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, DEFAULT_CSP_INPUT } from "../csp.util";

/**
 * Split a CSP header string into individual directives for
 * order-independent assertions.
 */
function splitDirectives(header: string): string[] {
  return header.split("; ").filter(Boolean);
}

describe("buildContentSecurityPolicy() — empty input", () => {
  it("uses DEFAULT_CSP_INPUT when called with no argument", () => {
    const header = buildContentSecurityPolicy();

    for (const [, directive] of [
      ["defaultSrc", "default-src"],
      ["scriptSrc", "script-src"],
      ["styleSrc", "style-src"],
      ["imgSrc", "img-src"],
      ["fontSrc", "font-src"],
      ["connectSrc", "connect-src"],
      ["frameAncestors", "frame-ancestors"],
      ["formAction", "form-action"],
      ["baseUri", "base-uri"],
      ["objectSrc", "object-src"],
    ] as const) {
      expect(header).toContain(directive);
    }
  });

  it("emits the default upgrade-insecure-requests directive", () => {
    expect(buildContentSecurityPolicy()).toContain("upgrade-insecure-requests");
  });

  it("uses DEFAULT_CSP_INPUT when the argument is an empty object", () => {
    const withEmpty = buildContentSecurityPolicy({});
    const withDefault = buildContentSecurityPolicy(DEFAULT_CSP_INPUT);

    expect(withEmpty).toBe(withDefault);
  });
});

describe("buildContentSecurityPolicy() — directive formatting", () => {
  it("joins the values of each directive with single spaces", () => {
    const header = buildContentSecurityPolicy({
      scriptSrc: ["'self'", "'unsafe-inline'", "https://vercel.live"],
    });

    expect(header).toContain("script-src 'self' 'unsafe-inline' https://vercel.live");
  });

  it("joins directives with a semicolon-space", () => {
    const header = buildContentSecurityPolicy({
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    });

    const directives = splitDirectives(header);

    expect(directives).toContain("default-src 'self'");
    expect(directives).toContain("script-src 'self'");
  });

  it("emits directive value with a single space between key and values", () => {
    const header = buildContentSecurityPolicy({
      imgSrc: ["'self'", "data:", "https:"],
    });

    expect(header).toMatch(/(^|; )img-src 'self' data: https:(;|$)/);
  });
});

describe("buildContentSecurityPolicy() — upgradeInsecureRequests", () => {
  it("appends 'upgrade-insecure-requests' as a value-less directive when true", () => {
    const header = buildContentSecurityPolicy({ upgradeInsecureRequests: true });
    const directives = splitDirectives(header);

    expect(directives).toContain("upgrade-insecure-requests");
  });

  it("omits 'upgrade-insecure-requests' when explicitly false", () => {
    const header = buildContentSecurityPolicy({
      // Wipe the defaults so nothing implicit shows up.
      defaultSrc: ["'self'"],
      upgradeInsecureRequests: false,
    });

    expect(header).not.toContain("upgrade-insecure-requests");
  });
});

describe("buildContentSecurityPolicy() — blockAllMixedContent", () => {
  it("does not emit 'block-all-mixed-content' by default", () => {
    const header = buildContentSecurityPolicy();

    expect(header).not.toContain("block-all-mixed-content");
  });

  it("emits 'block-all-mixed-content' when explicitly enabled", () => {
    const header = buildContentSecurityPolicy({ blockAllMixedContent: true });
    const directives = splitDirectives(header);

    expect(directives).toContain("block-all-mixed-content");
  });
});

describe("buildContentSecurityPolicy() — extra directives", () => {
  it("appends extra directives after the standard set", () => {
    const header = buildContentSecurityPolicy({
      extra: { "report-uri": ["/csp-report"] },
    });

    // The extra directive should sit at the end of the string.
    const directives = splitDirectives(header);

    expect(directives[directives.length - 1]).toBe("report-uri /csp-report");
  });

  it("preserves the insertion order of multiple extra directives", () => {
    const header = buildContentSecurityPolicy({
      extra: {
        "report-uri": ["/csp-report"],
        "trusted-types": ["default"],
        "require-trusted-types-for": ["'script'"],
      },
    });

    const directives = splitDirectives(header);
    const extraDirectives = directives.filter((d) =>
      ["report-uri", "trusted-types", "require-trusted-types-for"].some((k) =>
        d.startsWith(`${k} `),
      ),
    );

    expect(extraDirectives).toEqual([
      "report-uri /csp-report",
      "trusted-types default",
      "require-trusted-types-for 'script'",
    ]);
  });

  it("drops extra directives whose value array is empty", () => {
    const header = buildContentSecurityPolicy({
      extra: {
        "report-uri": ["/csp-report"],
        "trusted-types": [],
      },
    });

    expect(header).toContain("report-uri /csp-report");
    expect(header).not.toContain("trusted-types");
  });
});

describe("buildContentSecurityPolicy() — empty directives dropped", () => {
  it("drops standard directives whose value array is empty", () => {
    const header = buildContentSecurityPolicy({
      defaultSrc: [],
    });

    // The empty defaultSrc should NOT appear, but other defaults should
    // still be emitted (default merge keeps them).
    expect(header).not.toMatch(/(^|; )default-src( |;|$)/);
    expect(header).toContain("script-src");
  });
});

describe("buildContentSecurityPolicy() — merge semantics", () => {
  it("overriding one directive leaves the other defaults intact", () => {
    const header = buildContentSecurityPolicy({
      scriptSrc: ["'self'", "https://vercel.live"],
    });

    // Custom scriptSrc wins.
    expect(header).toContain("script-src 'self' https://vercel.live");
    // Defaults for other directives are still there.
    expect(header).toContain("default-src 'self'");
    expect(header).toContain("style-src 'self' 'unsafe-inline'");
    expect(header).toContain("object-src 'none'");
    expect(header).toContain("frame-ancestors 'none'");
  });

  it("connectSrc override does not touch the imgSrc default", () => {
    const header = buildContentSecurityPolicy({
      connectSrc: ["'self'", "wss://reverb.academorix.app"],
    });

    expect(header).toContain("connect-src 'self' wss://reverb.academorix.app");
    // Default imgSrc = ['self', 'data:', 'https:'] is retained.
    expect(header).toContain("img-src 'self' data: https:");
  });
});
