/**
 * @file create-mock-matcher-context.util.ts
 * @module @stackra/routing/testing
 * @description Factory for `IMatcherContext` test fixtures.
 */

import type { IApplication, IMatcherContext } from "@stackra/contracts";

import { createMockContainer } from "./create-mock-container.util";

/**
 * Overridable fields for `createMockMatcherContext`.
 *
 * Every field is optional — omitted fields fall back to sensible
 * defaults that pass a "does this match?" call against every
 * pass-through builder combination.
 */
export interface IMockMatcherContextOverrides {
  readonly subdomain?: string | null;
  readonly hostname?: string;
  readonly path?: string;
  readonly query?: URLSearchParams | Record<string, string>;
  readonly headers?: Headers | Record<string, string>;
  readonly hash?: string;
  readonly params?: Readonly<Record<string, string>>;
  readonly url?: URL | string;
  readonly container?: IApplication;
}

/**
 * Create a mock `IMatcherContext` for unit tests.
 *
 * @param overrides - Overridable fields. Missing fields fall back to
 *   defaults that model an apex request to `/` with no query / headers.
 * @returns A fully-populated `IMatcherContext`.
 */
export function createMockMatcherContext(
  overrides: IMockMatcherContextOverrides = {},
): IMatcherContext {
  // Resolve the URL first because several other fields default from it.
  // Relative paths resolve against `http://localhost/` so tests can
  // pass `url: '/dashboard'` without wrapping the value.
  const urlSource = overrides.url ?? "http://localhost/";
  const url = urlSource instanceof URL ? urlSource : new URL(urlSource, "http://localhost/");

  // Normalise query — accept a plain object for ergonomics.
  const query =
    overrides.query instanceof URLSearchParams
      ? overrides.query
      : new URLSearchParams(overrides.query ?? {});

  // Same normalisation for headers — WHATWG `Headers` accepts a record.
  const headers =
    overrides.headers instanceof Headers ? overrides.headers : new Headers(overrides.headers ?? {});

  const container = overrides.container ?? createMockContainer();

  const request = new Request(url.toString(), { headers });

  return {
    subdomain: overrides.subdomain ?? null,
    hostname: overrides.hostname ?? url.hostname,
    path: overrides.path ?? url.pathname,
    query,
    headers,
    // The URL hash arrives WITHOUT the leading `#` — normalise so
    // caller-side ergonomics don't matter.
    hash: (overrides.hash ?? url.hash).replace(/^#/, ""),
    params: overrides.params ?? {},
    request,
    url,
    container,
  };
}
