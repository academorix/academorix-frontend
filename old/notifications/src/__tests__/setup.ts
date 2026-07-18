/**
 * @file setup.ts
 * @module @academorix/notifications/__tests__/setup
 *
 * @description
 * Vitest global setup for `@academorix/notifications`. Wires
 * `@testing-library/jest-dom` matchers into `expect` and installs
 * a per-test `cleanup()` so the React tree from one case never
 * leaks into the next.
 */

import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
