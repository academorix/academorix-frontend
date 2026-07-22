/**
 * @file index.ts
 * @module @stackra/scope
 * @description Public API for the `@stackra/scope` core subpath — the client
 *   scope runtime (DI module + injectable service), pure utils, errors, and
 *   types. React bindings live in `@stackra/scope/react`.
 */

import "reflect-metadata";

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { ScopeModule, type ScopeRootOptions } from "./scope.module";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { ScopeService, type ScopeListener } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Constants / Tokens
// ════════════════════════════════════════════════════════════════════════════════
// `SCOPE_SERVICE` lives in `@stackra/contracts` (per contract-reexports.md);
// import it from there directly. The package-owned tokens stay here.
export { DEFAULT_SCOPE_OPTIONS, SCOPE_CONFIG, SCOPE_DATA_SOURCE } from "./constants";

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export {
  ScopeError,
  ScopeNotFoundError,
  ScopeConflictError,
  ScopeCircularReferenceError,
  ScopeDepthExceededError,
  ScopeDefinitionInUseError,
  ScopeResolutionTimeoutError,
  ScopeOwnerViolationError,
  ScopeValidationError,
  ScopeContextRequiredError,
} from "./errors";

// ════════════════════════════════════════════════════════════════════════════════
// Adapters
// ════════════════════════════════════════════════════════════════════════════════
export { StorageBackedScopePersistAdapter } from "./adapters";

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig, parseMaterializedPath, buildTree, withPersistAdapter } from "./utils";

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type {
  IScopeContext,
  IScopeIdentity,
  IScopeNode,
  IScopeNodeTreeNode,
  IScopeSnapshot,
  IScopeDefinition,
  IScopeDefinitionTreeNode,
  IScopeModuleOptions,
  IScopeDataSource,
  IScopePersistAdapter,
} from "./interfaces";
