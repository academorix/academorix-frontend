/**
 * @file index.ts
 * @module @stackra/pwa/testing
 * @description Public API for `@stackra/pwa/testing`.
 *
 *   In-memory service mocks + event fakes for consumers who want to
 *   exercise the install/update flows without a real browser.
 */

export { MockPwaService } from "./mock-pwa-service";
export { MockBeforeInstallPromptEvent } from "./mock-before-install-prompt-event";
export {
  MockServiceWorkerRegistration,
  type IMockServiceWorker,
} from "./mock-service-worker-registration";
export { MockAnalyticsClient, type IRecordedAnalyticsCall } from "./mock-analytics-client";
export { createMockPwa, type ICreateMockPwaOptions } from "./create-mock-pwa";
