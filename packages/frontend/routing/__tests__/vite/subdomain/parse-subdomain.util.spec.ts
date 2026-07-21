/**
 * @file parse-subdomain.util.spec.ts
 * @module @stackra/routing/tests/vite/subdomain
 * @description Unit tests for `parseSubdomain` — the host-to-subdomain
 *   parser shared by the dev middleware + the runtime matcher context.
 *
 *   Every case matters: PLAN v3.4 explicitly locks the "www is the
 *   apex" rule and the "tenant with dots stays intact" rule.
 */

import { describe, expect, it } from "vitest";

import { parseSubdomain } from "@/vite/subdomain/parse-subdomain.util";

describe("parseSubdomain", () => {
  const rootDomain = "stackra.app";

  it("returns null when host is undefined", () => {
    expect(parseSubdomain(undefined, rootDomain)).toBeNull();
  });

  it("returns null when rootDomain is undefined", () => {
    expect(parseSubdomain("admin.stackra.app", undefined)).toBeNull();
  });

  it("returns null on an exact apex match", () => {
    expect(parseSubdomain("stackra.app", rootDomain)).toBeNull();
  });

  it("returns null on an exact apex match with port", () => {
    expect(parseSubdomain("stackra.app:5173", rootDomain)).toBeNull();
  });

  it("returns null on www.<root> (treated as apex)", () => {
    expect(parseSubdomain("www.stackra.app", rootDomain)).toBeNull();
  });

  it("parses a single-segment subdomain", () => {
    expect(parseSubdomain("admin.stackra.app", rootDomain)).toBe("admin");
  });

  it("lowercases the parsed subdomain", () => {
    expect(parseSubdomain("Admin.Stackra.App", rootDomain)).toBe("admin");
  });

  it("strips the port before parsing", () => {
    expect(parseSubdomain("admin.stackra.app:5173", rootDomain)).toBe("admin");
  });

  it("keeps nested subdomain segments intact", () => {
    // Tenant identifiers can contain dots (e.g. a "canary" pool under
    // "tenant-alpha"). The whole path is returned verbatim so tenant
    // lookups match on the exact identifier.
    expect(parseSubdomain("canary.tenant-alpha.stackra.app", rootDomain)).toBe(
      "canary.tenant-alpha",
    );
  });

  it("returns null when host does not match rootDomain", () => {
    // Foreign host — the middleware should NOT route it into a
    // tenant shell.
    expect(parseSubdomain("admin.example.com", rootDomain)).toBeNull();
  });

  it("returns null when host ends with rootDomain but is not a proper subdomain", () => {
    // A host like `evilstackra.app` accidentally shares a suffix.
    // The `.` boundary catches it.
    expect(parseSubdomain("evilstackra.app", rootDomain)).toBeNull();
  });

  it("handles localhost-style hosts", () => {
    // The `.localhost` root is the zero-setup dev mode. Same parsing
    // rules apply — `admin.localhost` → 'admin'.
    expect(parseSubdomain("admin.localhost:5173", "localhost")).toBe("admin");
    expect(parseSubdomain("localhost:5173", "localhost")).toBeNull();
    expect(parseSubdomain("www.localhost:5173", "localhost")).toBeNull();
  });
});
