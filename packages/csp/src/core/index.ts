/**
 * @file index.ts
 * @module @stackra/csp
 * @description Public API for the `@stackra/csp` core subpath — the CSP DI
 *   module, services (nonce generator, policy builder, discovery loader),
 *   the feature-policy registry, the `@CspPolicy()` decorator, and local
 *   types/interfaces. React bindings live in `@stackra/csp/react`.
 */

import 'reflect-metadata';

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { CspModule } from './csp.module';

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { CspService, NonceGenerator, CspPolicyLoader } from './services';

// ════════════════════════════════════════════════════════════════════════════════
// Registries
// ════════════════════════════════════════════════════════════════════════════════
export { CspRegistry } from './registries';

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { CspPolicy } from './decorators';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { CSP_POLICY_METADATA } from './constants';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { createSeedLoader, seedLoaderToken, type SeedLoader } from './utils';

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces / Types (package-local)
// ════════════════════════════════════════════════════════════════════════════════
export type { CspModuleOptions, CspFeaturePolicy } from './interfaces';
export type { CspSource, MergedCspSources } from './types';

// NOTE: CSP tokens (CSP_SERVICE / CSP_CONFIG / CSP_REGISTRY) and the
// ICspService / ICspPolicyResult contracts live in `@stackra/contracts`.
// Per the contract-reexports steering rule, consumers import them directly
// from `@stackra/contracts` — this package does not re-export them.
