/**
 * @file create-mock-pwa.ts
 * @module @stackra/pwa/testing
 * @description Factory returning an assertable {@link MockPwaService}.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";

import { MockPwaService } from "./mock-pwa-service";
import type {
  IPwaAttribution,
  IPwaInstallState,
  IPwaUpdateState,
  PwaDisplayMode,
} from "@/core/interfaces";

/** Options accepted by {@link createMockPwa}. */
export interface ICreateMockPwaOptions {
  /** Seed the install substate. */
  readonly install?: Partial<IPwaInstallState>;
  /** Seed the update substate. */
  readonly update?: Partial<IPwaUpdateState>;
  /** Seed the standalone flag. */
  readonly standalone?: boolean;
  /** Seed the display mode. */
  readonly displayMode?: PwaDisplayMode;
  /** Seed the attribution snapshot. */
  readonly attribution?: Partial<IPwaAttribution>;
}

/**
 * Create an assertable mock PWA service.
 *
 * @example
 * ```ts
 * const pwa = createMockPwa({ install: { isSupported: true, isVisible: true } });
 * await pwa.promptInstall();
 * expect(pwa.$.wasCalled('promptInstall')).toBe(true);
 * ```
 */
export function createMockPwa(
  options: ICreateMockPwaOptions = {},
): AssertableProxy<MockPwaService> {
  return createAssertableProxy(new MockPwaService(options));
}
