/**
 * @file index.ts
 * @module @stackra/dashboard/testing/utils
 * @description Public API barrel for the testing utility subfolder.
 */

export { createDashboardFixture } from "./create-dashboard-fixture.util";
export { createWidgetInstanceFixture } from "./create-widget-instance-fixture.util";
export {
  InMemoryDashboardStorage,
  type IInMemoryDashboardStorageOptions,
} from "./in-memory-storage.util";
