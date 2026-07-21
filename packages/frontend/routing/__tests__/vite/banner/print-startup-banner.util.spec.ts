/**
 * @file print-startup-banner.util.spec.ts
 * @module @stackra/routing/tests/vite/banner
 * @description Unit tests for `printStartupBanner` — captures stdout
 *   through the injected `writer` so the frame + subdomain list are
 *   asserted structurally.
 */

import { describe, expect, it } from "vitest";

import { printStartupBanner } from "@/vite/banner/print-startup-banner.util";

describe("printStartupBanner", () => {
  /**
   * Small helper: run the banner + return the captured lines.
   */
  function capture(input: Parameters<typeof printStartupBanner>[0]): string[] {
    const captured: string[] = [];
    printStartupBanner({
      ...input,
      writer: (line): void => {
        captured.push(line);
      },
    });
    return captured;
  }

  it("prints a top + bottom frame", () => {
    const lines = capture({ devSubdomains: [], devMode: "localhost" });
    expect(lines[0]).toContain("┌─ Stackra Routing");
    expect(lines[lines.length - 1]).toMatch(/^└─+$/);
  });

  it('prints the "no subdomains" hint when list is empty', () => {
    const lines = capture({
      devSubdomains: [],
      devMode: "localhost",
      rootDomain: "stackra.app",
    });
    // The empty-list branch surfaces a pointer to the config option.
    expect(lines.some((l) => l.includes("router({devSubdomains})"))).toBe(true);
  });

  it("lists every advertised subdomain", () => {
    const lines = capture({
      devSubdomains: ["admin", "ops"],
      devMode: "localhost",
      rootDomain: "stackra.app",
    });
    expect(lines.some((l) => l.includes("admin → http://admin.localhost:5173"))).toBe(true);
    expect(lines.some((l) => l.includes("ops   → http://ops.localhost:5173"))).toBe(true);
  });

  it("uses the configured port", () => {
    const lines = capture({
      devSubdomains: ["admin"],
      devMode: "localhost",
      rootDomain: "stackra.app",
      port: 5174,
    });
    expect(lines.some((l) => l.includes(":5174"))).toBe(true);
  });

  it("uses .rootDomain suffix in hosts-file mode", () => {
    const lines = capture({
      devSubdomains: ["admin"],
      devMode: "hosts-file",
      rootDomain: "stackra.app",
    });
    // hosts-file mode uses the real rootDomain suffix.
    expect(lines.some((l) => l.includes("admin.stackra.app"))).toBe(true);
  });

  it("describes the dev-mode in the header", () => {
    const lines = capture({
      devSubdomains: ["admin"],
      devMode: "localhost",
      rootDomain: "stackra.app",
    });
    expect(lines.some((l) => l.includes("*.localhost — zero setup"))).toBe(true);
  });

  it('renders "(none — single-domain SPA)" when no rootDomain is set', () => {
    const lines = capture({
      devSubdomains: [],
      devMode: "localhost",
    });
    expect(lines.some((l) => l.includes("single-domain SPA"))).toBe(true);
  });
});
