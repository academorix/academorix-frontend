/**
 * @file security-headers.test.ts
 * @module @academorix/pwa/security/__tests__/security-headers.test
 *
 * @description
 * Tests for {@link getSecurityHeaders}. Covers:
 *
 *  - Every default header key is present with the expected value.
 *  - `frameOptions: "SAMEORIGIN"` overrides the default `DENY`.
 *  - `enableHsts: false` drops `Strict-Transport-Security`.
 *  - Custom `permissionsPolicy` string wins.
 *  - `extra` merges on top of the baseline.
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_PERMISSIONS_POLICY, getSecurityHeaders } from "../security-headers.util";

describe("getSecurityHeaders() — default baseline", () => {
  it("emits Content-Security-Policy composed from buildContentSecurityPolicy", () => {
    const headers = getSecurityHeaders();

    expect(headers["Content-Security-Policy"]).toBeTypeOf("string");
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
  });

  it("emits X-Content-Type-Options as nosniff", () => {
    expect(getSecurityHeaders()["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("emits X-Frame-Options as DENY by default", () => {
    expect(getSecurityHeaders()["X-Frame-Options"]).toBe("DENY");
  });

  it("emits Referrer-Policy as strict-origin-when-cross-origin", () => {
    expect(getSecurityHeaders()["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("emits Permissions-Policy using the default policy", () => {
    expect(getSecurityHeaders()["Permissions-Policy"]).toBe(DEFAULT_PERMISSIONS_POLICY);
  });

  it("emits Strict-Transport-Security with the two-year preload directive", () => {
    expect(getSecurityHeaders()["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
  });
});

describe("getSecurityHeaders() — frameOptions", () => {
  it("emits 'SAMEORIGIN' when frameOptions is SAMEORIGIN", () => {
    expect(getSecurityHeaders({ frameOptions: "SAMEORIGIN" })["X-Frame-Options"]).toBe(
      "SAMEORIGIN",
    );
  });

  it("emits 'DENY' when frameOptions is DENY", () => {
    expect(getSecurityHeaders({ frameOptions: "DENY" })["X-Frame-Options"]).toBe("DENY");
  });
});

describe("getSecurityHeaders() — enableHsts", () => {
  it("does not include Strict-Transport-Security when enableHsts is false", () => {
    const headers = getSecurityHeaders({ enableHsts: false });

    expect("Strict-Transport-Security" in headers).toBe(false);
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });

  it("includes Strict-Transport-Security when enableHsts is explicitly true", () => {
    const headers = getSecurityHeaders({ enableHsts: true });

    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
  });
});

describe("getSecurityHeaders() — permissionsPolicy", () => {
  it("uses a custom Permissions-Policy string when provided", () => {
    const custom = "camera=(self), microphone=()";

    expect(getSecurityHeaders({ permissionsPolicy: custom })["Permissions-Policy"]).toBe(custom);
  });

  it("falls back to DEFAULT_PERMISSIONS_POLICY when omitted", () => {
    expect(getSecurityHeaders({})["Permissions-Policy"]).toBe(DEFAULT_PERMISSIONS_POLICY);
  });

  it("locks down high-impact APIs in the default policy string", () => {
    // Sanity-check that the shipped default disables the APIs we say
    // we don't use — regression guard against accidental relaxation.
    expect(DEFAULT_PERMISSIONS_POLICY).toContain("camera=()");
    expect(DEFAULT_PERMISSIONS_POLICY).toContain("microphone=()");
    expect(DEFAULT_PERMISSIONS_POLICY).toContain("geolocation=()");
    expect(DEFAULT_PERMISSIONS_POLICY).toContain("payment=()");
    expect(DEFAULT_PERMISSIONS_POLICY).toContain("usb=()");
  });
});

describe("getSecurityHeaders() — extra headers", () => {
  it("merges extra headers on top of the baseline", () => {
    const headers = getSecurityHeaders({
      extra: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-site",
      },
    });

    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("same-site");
  });

  it("keeps the baseline headers intact when extra is provided", () => {
    const headers = getSecurityHeaders({ extra: { "X-Custom": "1" } });

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Custom"]).toBe("1");
  });

  it("allows extra to override a baseline header (last-write-wins)", () => {
    // Override the default X-Frame-Options with a custom extra entry.
    const headers = getSecurityHeaders({
      extra: { "X-Frame-Options": "ALLOWALL" },
    });

    expect(headers["X-Frame-Options"]).toBe("ALLOWALL");
  });
});

describe("getSecurityHeaders() — CSP composition", () => {
  it("passes the csp option through to the CSP composer", () => {
    const headers = getSecurityHeaders({
      csp: {
        connectSrc: ["'self'", "https://api.academorix.app"],
      },
    });

    expect(headers["Content-Security-Policy"]).toContain(
      "connect-src 'self' https://api.academorix.app",
    );
  });
});
