/**
 * @file seo.service.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the SeoService — descriptor merge across
 *   the match chain (parent → child), and site-wide defaults.
 */

import { describe, expect, it } from "vitest";

import { SeoService } from "@/seo/services/seo.service";
import type { IRoutingModuleOptions } from "@stackra/contracts";

/** Build a `SeoService` with the given site-wide config. */
function service(config?: IRoutingModuleOptions): SeoService {
  return new SeoService(config);
}

describe("SeoService", () => {
  it("resolves the site-wide defaults when no chain is provided", () => {
    const svc = service({
      seo: { defaults: { title: "Home", description: "Root" } },
    } as IRoutingModuleOptions);
    const merged = svc.resolve([]);
    expect(merged.title).toBe("Home");
    expect(merged.description).toBe("Root");
  });

  it("overrides scalar fields inner-most-wins", () => {
    const svc = service();
    const merged = svc.resolve([{ title: "Parent" }, { title: "Child" }]);
    expect(merged.title).toBe("Child");
  });

  it("accumulates JSON-LD nodes (children append, parents do not overwrite)", () => {
    const svc = service();
    const merged = svc.resolve([
      { jsonLd: [{ "@type": "Organization" }] },
      { jsonLd: [{ "@type": "Article" }] },
    ]);
    expect(merged.jsonLd).toEqual([{ "@type": "Organization" }, { "@type": "Article" }]);
  });

  it("shallow-merges openGraph between parent and child", () => {
    const svc = service();
    const merged = svc.resolve([
      { openGraph: { siteName: "Acme", type: "website" } },
      { openGraph: { type: "article" } },
    ]);
    // `siteName` inherited from the parent; `type` overridden by
    // the child.
    expect(merged.openGraph).toEqual({ siteName: "Acme", type: "article" });
  });

  it("applies the titleTemplate from the parent to the child title", () => {
    const svc = service();
    const merged = svc.resolve([{ titleTemplate: "%s | Acme" }, { title: "Home" }]);
    const tags = svc.collect([{ titleTemplate: "%s | Acme" }, { title: "Home" }]);
    // `resolve()` itself doesn't apply the template — `buildSeoTags`
    // does. But the merged descriptor should carry both fields.
    expect(merged.title).toBe("Home");
    expect(merged.titleTemplate).toBe("%s | Acme");
    // The rendered <title> uses the template.
    const titleTag = tags.find((t) => t.tag === "title");
    expect(titleTag?.text).toBe("Home | Acme");
  });

  it("dedupes and concatenates keywords across the chain", () => {
    const svc = service();
    const merged = svc.resolve([{ keywords: ["a", "b"] }, { keywords: ["b", "c"] }]);
    expect(merged.keywords).toEqual(["a", "b", "c"]);
  });

  it("produces a flat tag list via collect()", () => {
    const svc = service();
    const tags = svc.collect([{ title: "Home", description: "Root", canonical: "/" }]);
    const tagNames = tags.map((t) => t.key);
    expect(tagNames).toContain("title");
    expect(tagNames).toContain("desc");
    expect(tagNames).toContain("canonical");
  });

  it("absolutises canonical URLs against baseUrl", () => {
    const svc = service({
      seo: {
        baseUrl: "https://acme.com",
      },
    } as IRoutingModuleOptions);
    const tags = svc.collect([{ canonical: "/pricing" }]);
    const canonical = tags.find((t) => t.key === "canonical");
    expect(canonical?.attrs.href).toBe("https://acme.com/pricing");
  });

  it("returns undefined for baseUrl when unset", () => {
    expect(service().getBaseUrl()).toBeUndefined();
  });
});
