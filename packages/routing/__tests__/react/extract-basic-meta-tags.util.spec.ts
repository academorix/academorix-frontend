/**
 * @file extract-basic-meta-tags.util.spec.ts
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the RRv7 meta-channel bridge.
 */

import { describe, expect, it } from "vitest";

import { extractBasicMetaTags } from "@/react/adapt-page-module/extract-basic-meta-tags.util";

describe("extractBasicMetaTags", () => {
  it("emits a title tag when seo.title is set", () => {
    const tags = extractBasicMetaTags({ title: "Home" });
    expect(tags).toContainEqual({ title: "Home" });
  });

  it("applies titleTemplate when both are set", () => {
    const tags = extractBasicMetaTags({
      title: "Blog",
      titleTemplate: "%s | Site",
    });
    expect(tags).toContainEqual({ title: "Blog | Site" });
  });

  it("emits a description meta when seo.description is set", () => {
    const tags = extractBasicMetaTags({ description: "A description" });
    expect(tags).toContainEqual({ name: "description", content: "A description" });
  });

  it("emits the robots directive with tokens joined", () => {
    const tags = extractBasicMetaTags({
      robots: { index: false, follow: true } as never,
    });
    expect(tags).toContainEqual({ name: "robots", content: "noindex, follow" });
  });

  it("emits basic OpenGraph tags when seo.openGraph is present", () => {
    const tags = extractBasicMetaTags({
      openGraph: {
        title: "Blog",
        description: "Read",
        type: "article",
      } as never,
    });
    expect(tags).toContainEqual({ property: "og:title", content: "Blog" });
    expect(tags).toContainEqual({ property: "og:description", content: "Read" });
    expect(tags).toContainEqual({ property: "og:type", content: "article" });
  });

  it("returns an empty array when seo is undefined", () => {
    expect(extractBasicMetaTags(undefined)).toEqual([]);
  });
});
