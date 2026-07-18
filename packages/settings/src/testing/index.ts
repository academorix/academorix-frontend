/**
 * @file index.ts
 * @module @stackra/settings/testing
 * @description Public API for the settings testing utilities.
 *
 *   Provides in-memory mocks that mirror the contracts (registry,
 *   service, manager, store) without needing the full DI graph.
 *   Ideal for RTL-style tests that render a component and want to
 *   drive it via imperative setters.
 */

export {
  MockSettingsRegistry,
  MockSettingsService,
  MockSettingsManager,
  MockSettingsStore,
  type IMockSettingsManagerOptions,
} from './mocks';
