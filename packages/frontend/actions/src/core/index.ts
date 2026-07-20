/**
 * @file index.ts
 * @module @stackra/actions
 * @description Public API for `@stackra/actions`.
 *
 *   Exports only symbols owned by this package. Tokens, interfaces,
 *   enums, and events live in `@stackra/contracts` — imported directly by
 *   consumers, never re-exported here.
 */

import 'reflect-metadata';

// Module
export { ActionsModule } from './actions.module';

// Services
export { ActionDispatcherService, HandlerLoader } from './services';

// Registry
export { ActionRegistry } from './registries';

// Middleware
export { AuthorizeMiddleware, LogMiddleware, TraceMiddleware } from './pipeline';
export type { IMiddlewarePassable } from './pipeline';

// Built-in handlers
export { CompositeHandler, DispatchHandler } from './handlers';

// Decorator
export { ActionHandler } from './decorators';

// Errors
export { ActionError, ActionAuthorizationError, ActionAssertionError } from './errors';

// Config utilities + defaults
export { defineConfig, mergeConfig } from './utils';
export { DEFAULT_ACTIONS_CONFIG } from './constants/default-actions-config.constant';
