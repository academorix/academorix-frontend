/**
 * @file route-matcher.service.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the RouteMatcherService — exercises each
 *   of the four builder types against a synthetic matcher context.
 */

import { describe, expect, it } from "vitest";

import { RouteMatcherService } from "@/core/services/route-matcher.service";
import { subdomain, query, header, hash } from "@/matchers/builders";
import { createMockMatcherContext } from "@/testing/create-mock-matcher-context.util";

describe("RouteMatcherService", () => {
  const matcher = new RouteMatcherService();

  it("matches every context when spec is undefined", () => {
    expect(matcher.match(undefined, createMockMatcherContext())).toBe(true);
  });

  it("honours the subdomain predicate", () => {
    const ctx = createMockMatcherContext({ subdomain: "admin" });
    expect(matcher.match({ subdomain: subdomain.exact("admin") }, ctx)).toBe(true);
    expect(matcher.match({ subdomain: subdomain.exact("other") }, ctx)).toBe(false);
  });

  it("honours the query predicate", () => {
    const ctx = createMockMatcherContext({ query: { mode: "advanced" } });
    expect(matcher.match({ query: query.equals("mode", "advanced") }, ctx)).toBe(true);
    expect(matcher.match({ query: query.equals("mode", "basic") }, ctx)).toBe(false);
  });

  it("honours the header predicate", () => {
    const ctx = createMockMatcherContext({ headers: { "x-tenant": "acme" } });
    expect(matcher.match({ header: header.equals("x-tenant", "acme") }, ctx)).toBe(true);
    expect(matcher.match({ header: header.equals("x-tenant", "other") }, ctx)).toBe(false);
  });

  it("honours the hash predicate", () => {
    const ctx = createMockMatcherContext({ hash: "/dialog/foo" });
    expect(matcher.match({ hash: hash.startsWith("/dialog/") }, ctx)).toBe(true);
    expect(matcher.match({ hash: hash.exact("/other") }, ctx)).toBe(false);
  });

  it("bails on the first failing predicate (short-circuit AND semantics)", () => {
    const ctx = createMockMatcherContext({
      subdomain: "admin",
      query: { mode: "basic" },
    });
    // Subdomain matches, query doesn't — combined result is false.
    expect(
      matcher.match(
        {
          subdomain: subdomain.exact("admin"),
          query: query.equals("mode", "advanced"),
        },
        ctx,
      ),
    ).toBe(false);
  });

  it("passes through the async custom matcher return value", async () => {
    const ctx = createMockMatcherContext();
    const result = matcher.match({ custom: async () => true }, ctx);
    // `custom` returned a Promise — the service returns it directly.
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(true);
  });

  it("returns the sync custom matcher result directly", () => {
    const ctx = createMockMatcherContext();
    expect(matcher.match({ custom: () => true }, ctx)).toBe(true);
    expect(matcher.match({ custom: () => false }, ctx)).toBe(false);
  });
});
