/**
 * @file branding.test.ts
 * @module lib/tenancy/branding.test
 *
 * @description
 * Unit coverage for the hex → oklch conversion, the CSS variable map
 * builder, and the DOM writer. Every assertion is on the emitted CSS
 * string, the `document.documentElement.style`, the `document.title`, or
 * the `<link rel="icon">` element — no mocks needed beyond jsdom.
 */

import { afterEach, describe, expect, it } from "vitest";

import type { TenantBranding } from "@/types";

import {
  applyBrandingToDom,
  brandingToCssVars,
  hexToOklch,
  readableForegroundFor,
} from "@/lib/tenancy/branding";

/** Base branding used across the DOM tests. */
function makeBranding(overrides: Partial<TenantBranding> = {}): TenantBranding {
  return {
    logo_url: null,
    favicon_url: null,
    primary_color: "#3b82f6",
    secondary_color: null,
    accent_color: null,
    email_from_name: null,
    email_from_address: null,
    email_reply_to: null,
    custom_css: null,
    ...overrides,
  };
}

afterEach(() => {
  // Reset the CSS variables + title + favicon between tests. Passing null
  // instructs applyBrandingToDom to remove everything it has ever written,
  // and we also reset the title separately so the "leaves title alone"
  // scenarios below have a clean slate.
  applyBrandingToDom(null, null);
  document.documentElement.removeAttribute("style");
  document.title = "";

  // Clean up any test-injected favicon so we don't accumulate them.
  document.head
    .querySelectorAll("link[data-tenant-favicon], link[rel~='icon']")
    .forEach((el) => el.remove());
});

describe("hexToOklch", () => {
  it("converts a 6-digit hex to an oklch() literal", () => {
    // #3b82f6 is Tailwind's blue-500 — a well-known reference color.
    const oklch = hexToOklch("#3b82f6");

    expect(oklch).not.toBeNull();
    expect(oklch).toMatch(/^oklch\(\d+(\.\d+)?%\s\d+(\.\d+)?\s\d+(\.\d+)?\)$/);
  });

  it("accepts a leading hash and a shorthand #RGB", () => {
    // #fff → white → high lightness, near-zero chroma. We only assert the
    // shape here; the numeric detail lives in the round-trip test below.
    expect(hexToOklch("#fff")).toMatch(/^oklch\(/);
  });

  it("accepts an #RRGGBBAA hex by dropping the alpha channel", () => {
    // Both should emit the same oklch since alpha is intentionally
    // discarded (we don't paint transparent brand colors).
    const withAlpha = hexToOklch("#3b82f680");
    const withoutAlpha = hexToOklch("#3b82f6");

    expect(withAlpha).toBe(withoutAlpha);
  });

  it("returns null for malformed input", () => {
    expect(hexToOklch("")).toBeNull();
    expect(hexToOklch("not-a-color")).toBeNull();
    expect(hexToOklch("#zz")).toBeNull();
    expect(hexToOklch("#12345")).toBeNull();
  });

  it("produces a lightness close to 100% for white and near 0% for black", () => {
    // Extract the L component (the percent before the space) and check
    // ordering — white must land higher than black.
    const white = hexToOklch("#ffffff") ?? "";
    const black = hexToOklch("#000000") ?? "";

    const parseL = (oklch: string): number => {
      const match = /^oklch\((\d+(?:\.\d+)?)%/.exec(oklch);

      return match?.[1] ? Number.parseFloat(match[1]) : Number.NaN;
    };

    expect(parseL(white)).toBeGreaterThan(99);
    expect(parseL(black)).toBeLessThan(1);
  });
});

describe("readableForegroundFor", () => {
  it("returns a dark foreground for a bright accent (L >= 65)", () => {
    expect(readableForegroundFor(80)).toBe("oklch(15% 0 0)");
    expect(readableForegroundFor(65)).toBe("oklch(15% 0 0)");
  });

  it("returns a light foreground for a dark accent (L < 65)", () => {
    expect(readableForegroundFor(50)).toBe("oklch(99.11% 0 0)");
    expect(readableForegroundFor(10)).toBe("oklch(99.11% 0 0)");
  });
});

describe("brandingToCssVars", () => {
  it("returns the four brand variables when primary_color is set", () => {
    const vars = brandingToCssVars(makeBranding({ primary_color: "#3b82f6" }));

    expect(Object.keys(vars).sort()).toEqual(
      ["--accent", "--accent-foreground", "--focus", "--link"].sort(),
    );
    expect(vars["--accent"]).toMatch(/^oklch\(/);
    expect(vars["--focus"]).toBe(vars["--accent"]);
    expect(vars["--link"]).toBe(vars["--accent"]);
    expect(vars["--accent-foreground"]).toMatch(/^oklch\(/);
  });

  it("returns an empty object when primary_color is null or malformed", () => {
    expect(brandingToCssVars(makeBranding({ primary_color: null }))).toEqual({});
    expect(brandingToCssVars(makeBranding({ primary_color: "" }))).toEqual({});
    expect(brandingToCssVars(makeBranding({ primary_color: "not a color" }))).toEqual({});
  });

  it("picks a dark foreground for a bright brand color", () => {
    // #fef3c7 is Tailwind's amber-100 (very light) → dark foreground.
    const vars = brandingToCssVars(makeBranding({ primary_color: "#fef3c7" }));

    expect(vars["--accent-foreground"]).toBe("oklch(15% 0 0)");
  });

  it("picks a light foreground for a dark brand color", () => {
    // #1e3a8a is Tailwind's blue-900 (dark) → light foreground.
    const vars = brandingToCssVars(makeBranding({ primary_color: "#1e3a8a" }));

    expect(vars["--accent-foreground"]).toBe("oklch(99.11% 0 0)");
  });
});

describe("applyBrandingToDom", () => {
  it("writes the accent variables onto <html>", () => {
    applyBrandingToDom(makeBranding({ primary_color: "#3b82f6" }));

    const root = document.documentElement;

    expect(root.style.getPropertyValue("--accent")).toMatch(/^oklch\(/);
    expect(root.style.getPropertyValue("--accent-foreground")).toMatch(/^oklch\(/);
    expect(root.style.getPropertyValue("--focus")).toMatch(/^oklch\(/);
    expect(root.style.getPropertyValue("--link")).toMatch(/^oklch\(/);
  });

  it("updates document.title when a tenant name is provided", () => {
    applyBrandingToDom(makeBranding(), "Riverside");

    expect(document.title).toBe("Riverside · Academorix");
  });

  it("resets document.title to the product name when tenantName is null", () => {
    document.title = "Something · Academorix";

    applyBrandingToDom(null, null);

    expect(document.title).toBe("Academorix");
  });

  it("leaves document.title alone when tenantName is undefined", () => {
    document.title = "Untouched";

    applyBrandingToDom(makeBranding());

    expect(document.title).toBe("Untouched");
  });

  it("creates a <link rel='icon'> when the branding has a favicon", () => {
    applyBrandingToDom(makeBranding({ favicon_url: "https://cdn.example/logo.ico" }));

    const link = document.head.querySelector<HTMLLinkElement>("link[data-tenant-favicon]");

    expect(link).not.toBeNull();
    expect(link?.href).toContain("cdn.example/logo.ico");
    expect(link?.rel).toContain("icon");
  });

  it("re-uses an existing tenant favicon link on subsequent applies", () => {
    applyBrandingToDom(makeBranding({ favicon_url: "https://cdn.example/first.ico" }));
    applyBrandingToDom(makeBranding({ favicon_url: "https://cdn.example/second.ico" }));

    const links = document.head.querySelectorAll("link[data-tenant-favicon]");

    expect(links).toHaveLength(1);
    expect((links[0] as HTMLLinkElement).href).toContain("second.ico");
  });

  it("removes every written CSS variable when branding is null", () => {
    applyBrandingToDom(makeBranding({ primary_color: "#3b82f6" }));

    // Sanity check — variables land first.
    expect(document.documentElement.style.getPropertyValue("--accent")).not.toBe("");

    applyBrandingToDom(null);

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--accent-foreground")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--focus")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--link")).toBe("");
  });
});
