/**
 * @file create-mock-guard-context.util.ts
 * @module @stackra/routing/testing
 * @description Factory for `IGuardContext` test fixtures.
 */

import type { IApplication, IGuardContext, IMatchDescriptor } from "@stackra/contracts";

import { createMockContainer } from "./create-mock-container.util";

/**
 * Overridable fields for `createMockGuardContext`.
 */
export interface IMockGuardContextOverrides<TState = Record<string, unknown>> {
  readonly url?: URL | string;
  readonly params?: Readonly<Record<string, string>>;
  readonly matches?: readonly IMatchDescriptor[];
  readonly container?: IApplication;
  readonly state?: TState;
  readonly headers?: Headers | Record<string, string>;
}

/**
 * Create a mock `IGuardContext` for unit tests.
 *
 * @param overrides - Overridable fields.
 * @returns A fully-populated `IGuardContext`.
 */
export function createMockGuardContext<TState extends object = Record<string, unknown>>(
  overrides: IMockGuardContextOverrides<TState> = {},
): IGuardContext<TState> {
  // Accept absolute URLs, relative paths, and pre-built `URL` instances.
  // Relative paths resolve against `http://localhost/` so unit tests
  // can write `url: '/dashboard'` without wrapping every value.
  const urlSource = overrides.url ?? "http://localhost/";
  const url = urlSource instanceof URL ? urlSource : new URL(urlSource, "http://localhost/");

  const headers =
    overrides.headers instanceof Headers ? overrides.headers : new Headers(overrides.headers ?? {});

  const request = new Request(url.toString(), { headers });
  const container = overrides.container ?? createMockContainer();

  return {
    request,
    url,
    params: overrides.params ?? {},
    matches: overrides.matches ?? [],
    container,
    // Guards mutate `state` — we start from a fresh object each call
    // so tests don't accidentally share state across cases.
    state: overrides.state ?? ({} as TState),
  };
}
