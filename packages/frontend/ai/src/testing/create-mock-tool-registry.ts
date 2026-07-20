/**
 * @file create-mock-tool-registry.ts
 * @module @stackra/ai/testing
 * @description A `ToolRegistry` test double with an assertion helper —
 *   convenience over the real registry for tests that want to observe
 *   registration events without wiring the full container.
 */

import { ToolRegistry, type IToolRegistration } from "../core/registries/tool.registry";

/** The tool-registry double + observation helpers. */
export interface IMockToolRegistry extends ToolRegistry {
  /** Every `register` payload, in order. */
  readonly registerCalls: ReadonlyArray<IToolRegistration>;
  /** Every `(name, scope?)` tuple passed to `unregister`. */
  readonly unregisterCalls: ReadonlyArray<{ name: string; scope?: string }>;
  /** Reset the call log without dropping registrations. */
  resetCalls(): void;
}

/**
 * Build a mock tool registry that records every `register`/`unregister`
 * call while otherwise behaving exactly like the real one.
 *
 * @example
 * ```ts
 * const registry = createMockToolRegistry();
 * registry.register({ definition: { name: 'nav', description: '', parameters: {} }, handler: fn });
 * expect(registry.registerCalls[0]!.definition.name).toBe('nav');
 * ```
 */
export function createMockToolRegistry(): IMockToolRegistry {
  const registerCalls: IToolRegistration[] = [];
  const unregisterCalls: Array<{ name: string; scope?: string }> = [];

  class RecordingToolRegistry extends ToolRegistry {
    public override register(registration: IToolRegistration): void {
      registerCalls.push(registration);
      super.register(registration);
    }
    public override unregister(name: string, scope?: string): void {
      unregisterCalls.push(scope !== undefined ? { name, scope } : { name });
      super.unregister(name, scope);
    }
  }

  const registry = new RecordingToolRegistry() as IMockToolRegistry;
  Object.defineProperties(registry, {
    registerCalls: { value: registerCalls, writable: false, enumerable: false },
    unregisterCalls: { value: unregisterCalls, writable: false, enumerable: false },
    resetCalls: {
      value: () => {
        registerCalls.length = 0;
        unregisterCalls.length = 0;
      },
      writable: false,
      enumerable: false,
    },
  });
  return registry;
}
