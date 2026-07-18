/**
 * @file index.ts
 * @module @stackra/monitoring
 * @description Public API for `@stackra/monitoring`. Exports only
 *   package-owned symbols — contract tokens (`MONITORING_MANAGER`, …) and
 *   interfaces (`IMonitoringManager`, …) are imported from `@stackra/contracts`.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { MonitoringModule } from './monitoring.module';

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { MonitoringManager, MonitoringProviderLoader } from './services';

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { MonitoringProvider, type MonitoringProviderOptions } from './decorators';

// ════════════════════════════════════════════════════════════════════════════════
// Built-in providers
// ════════════════════════════════════════════════════════════════════════════════
export { ConsoleMonitoringProvider, SentryMonitoringProvider } from './providers';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig } from './utils';

// ════════════════════════════════════════════════════════════════════════════════
// Types (package-owned config)
// ════════════════════════════════════════════════════════════════════════════════
export type { IMonitoringModuleOptions, ISentryProviderOptions } from './interfaces';
