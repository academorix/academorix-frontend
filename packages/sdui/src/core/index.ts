/**
 * @file index.ts
 * @module @stackra/sdui
 * @description Public API for `@stackra/sdui`.
 *
 *   Wire-contract types / tokens / enums / events live in
 *   `@stackra/contracts` — consumers import them from there directly.
 *   This barrel exports package-owned symbols.
 */

import 'reflect-metadata';

// Module
export { SduiModule, type ISduiForRootOptions } from './sdui.module';

// Services
export { NullSduiClient, SchemaCache, SduiService } from './services';

// Registries
export { ComponentRegistry, LayoutRegistry, SduiPageRegistry } from './registries';

// Expression evaluator
export {
  isExpression,
  evaluateExpression,
  resolveBindable,
  evaluateBoolean,
  OPERATORS,
} from './expression';

// Validator
export {
  validateScreen,
  assertValidScreen,
  type ISduiValidationIssue,
  type ISduiValidationResult,
  type IComponentRegistryLike,
} from './validator';

// Version constants (package-owned)
export { SDUI_SCHEMA_VERSION, SDUI_MIN_SUPPORTED_VERSION } from './constants';

// Errors
export { SduiError, SduiSchemaVersionError, SduiValidationError } from './errors';

// Utilities
export { getAtPath, setAtPath } from './utils';
