/**
 * @file index.ts
 * @module @stackra/devtools/testing
 * @description Public API for `@stackra/devtools/testing` — mocks
 *   + factories for consumer tests.
 *
 *   Follow the workspace's canonical pattern:
 *   - `mock-*.ts` — in-memory implementations of the contract shape.
 *   - `create-mock-*.ts` — factories wrapping mocks in
 *     `createAssertableProxy`.
 *
 * @example
 * ```typescript
 * import {
 *   createMockDevtoolsRegistry,
 *   createMockDevtoolsPanel,
 * } from '@stackra/devtools/testing';
 *
 * const registry = createMockDevtoolsRegistry();
 * registry.register(createMockDevtoolsPanel({ id: 'my-panel' }));
 * expect(registry.list()).toHaveLength(1);
 * ```
 */

export { MockDevtoolsPanelsRegistry } from './mock-devtools-panels-registry';
export { MockDevtoolsInspectorRegistry } from './mock-devtools-inspector-registry';
export { createMockDevtoolsPanel } from './create-mock-devtools-panel.util';
export { createMockDevtoolsRegistry } from './create-mock-devtools-registry.util';
export { createMockInspectorRegistry } from './create-mock-inspector-registry.util';
