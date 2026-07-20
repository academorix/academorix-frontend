/**
 * @file mock-settings-store.ts
 * @module @stackra/settings/testing/mocks
 * @description In-memory `ISettingsStore` implementation for tests.
 *
 *   Alias for `MemorySettingsStore` — the real memory store is
 *   already trivially testable, but we re-export it under the
 *   `./testing` subpath so consumers don't have to reach into the
 *   core barrel for a test-only concern.
 */

export { MemorySettingsStore as MockSettingsStore } from '@/core/stores/memory-settings.store';
