/**
 * @file index.ts
 * @module @stackra/dashboard/testing
 * @description Public API of the `@stackra/dashboard/testing` subpath.
 *
 *   Only helpers useful in a consumer's tests — no runtime code, no
 *   HeroUI, no design-system primitives.
 */

export {
  createDashboardFixture,
  createWidgetInstanceFixture,
  InMemoryDashboardStorage,
  type IInMemoryDashboardStorageOptions,
} from "./utils";
