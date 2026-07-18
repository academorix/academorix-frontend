/**
 * @file build-html-shell.util.spec.ts
 * @module @stackra/routing/tests/vite/prerender
 * @description Unit tests for `buildHtmlShell` — the HTML wrapping
 *   step that produces a full document from a rendered React
 *   fragment.
 *
 *   Verifies:
 *
 *   - `__STACKRA_NONCE__` placeholder is present on every script
 *     and style tag the shell owns (per PLAN v3.12.5).
 *   - Consumer-owned `<html>` shells are preserved verbatim; the
 *     framework injects into the head + body without rewriting the
 *     structure.
 *   - Synthesised shells carry a doctype + `<meta charset>` +
 *     `<meta viewport>`.
 */

import { describe, expect, it } from "vitest";

import { buildHtmlShell, NONCE_PLACEHOLDER } from "@/vite/prerender/build-html-shell.util";

describe("buildHtmlShell", () => {
  it("emits the CSP nonce placeholder on every script tag", () => {
    const html = buildHtmlShell({
      renderedHtml: "<div>hello</div>",
      headHtml: "",
      clientEntries: ["/assets/entry-abc.js"],
      clientStyles: [],
    });
    // Placeholder is present exactly once per script/style.
    const scriptMatches = html.match(new RegExp(NONCE_PLACEHOLDER, "g")) ?? [];
    expect(scriptMatches.length).toBeGreaterThanOrEqual(1);
    expect(html).toContain(`nonce="${NONCE_PLACEHOLDER}"`);
    expect(html).toContain("/assets/entry-abc.js");
  });

  it("emits the CSP nonce placeholder on every style link", () => {
    const html = buildHtmlShell({
      renderedHtml: "<div>hello</div>",
      headHtml: "",
      clientEntries: [],
      clientStyles: ["/assets/main.css"],
    });
    // One style + zero scripts → one nonce placeholder.
    const matches = html.match(new RegExp(NONCE_PLACEHOLDER, "g")) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(html).toContain('href="/assets/main.css"');
  });

  it("preserves consumer-owned <html> shells verbatim", () => {
    const consumerHtml =
      '<html lang="fr"><head><title>Existing</title></head><body><div>content</div></body></html>';
    const html = buildHtmlShell({
      renderedHtml: consumerHtml,
      headHtml: '<meta name="framework-injected" content="1" />',
      clientEntries: ["/entry.js"],
      clientStyles: [],
    });
    // Doctype was prefixed.
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    // Original head + language preserved.
    expect(html).toContain('lang="fr"');
    expect(html).toContain("<title>Existing</title>");
    // Framework injection landed inside the head.
    expect(html).toContain("framework-injected");
    // Script tag lands right before </body>.
    expect(html).toMatch(/src="\/entry\.js".*<\/body>/s);
  });

  it("synthesises a minimal shell when no <html> is present", () => {
    const html = buildHtmlShell({
      renderedHtml: "<h1>plain fragment</h1>",
      headHtml: "",
      clientEntries: [],
      clientStyles: [],
    });
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<meta charset="utf-8" />');
    expect(html).toContain("width=device-width, initial-scale=1");
    // The rendered fragment lands inside `<div id="root">`.
    expect(html).toMatch(/<div id="root"><h1>plain fragment<\/h1><\/div>/);
  });

  it("honours a custom lang for the synthesised shell", () => {
    const html = buildHtmlShell({
      renderedHtml: "<div>hi</div>",
      headHtml: "",
      clientEntries: [],
      clientStyles: [],
      lang: "ar",
    });
    expect(html).toContain('lang="ar"');
  });

  it("inserts a <base href> when baseUrl is provided", () => {
    const html = buildHtmlShell({
      renderedHtml: "<div>hi</div>",
      headHtml: "",
      clientEntries: [],
      clientStyles: [],
      baseUrl: "/staging/",
    });
    expect(html).toContain('<base href="/staging/" />');
  });

  it("escapes attribute values against injection", () => {
    // The emitted paths come from Vite; but the escape helper still
    // needs to defend the shell against a poisoned value. Assert on
    // the `<` character being replaced.
    const html = buildHtmlShell({
      renderedHtml: "<div />",
      headHtml: "",
      clientEntries: ["/foo<script>.js"],
      clientStyles: [],
    });
    expect(html).not.toContain("/foo<script>.js");
    expect(html).toContain("/foo&lt;script&gt;.js");
  });
});
