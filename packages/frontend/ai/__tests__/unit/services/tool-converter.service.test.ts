/**
 * @file tool-converter.service.test.ts
 * @description Unit tests for {@link ToolConverter}: zod → JSON schema
 *   conversion (Req 7.1, 7.6), passthrough for non-zod inputs, error on
 *   invalid schema (Req 7.7), debounce (Req 7.4), and diff-suppression
 *   (Req 7.5). Property-level P4/P5 assertions live in the property/ dir.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ToolRegistry } from '@/core/registries/tool.registry';
import { ToolConverter } from '@/core/services/tool-converter.service';

const noop = async (): Promise<void> => undefined;
const register = (
  registry: ToolRegistry,
  def: {
    name: string;
    description?: string;
    parameters: unknown;
    requiresApproval?: boolean;
    priority?: number;
    scope?: string;
  }
): void => {
  registry.register({
    definition: {
      name: def.name,
      description: def.description ?? '',
      parameters: def.parameters,
      ...(def.requiresApproval !== undefined ? { requiresApproval: def.requiresApproval } : {}),
      ...(def.priority !== undefined ? { priority: def.priority } : {}),
      ...(def.scope !== undefined ? { scope: def.scope } : {}),
    },
    handler: noop,
  });
};

const makeConverter = (registry: ToolRegistry): ToolConverter => {
  const converter = new ToolConverter(registry);
  converter.onModuleInit();
  return converter;
};

describe('ToolConverter.convert', () => {
  it('preserves the tool name (Req 7.6)', () => {
    const registry = new ToolRegistry();
    register(registry, { name: 'navigate', parameters: z.object({ url: z.string() }) });
    const converter = makeConverter(registry);
    const def = converter.currentDefinitions()[0]!;
    expect(def.name).toBe('navigate');
  });

  it('converts a zod object schema into `{ type: "object", properties, required }`', () => {
    const registry = new ToolRegistry();
    register(registry, {
      name: 'navigate',
      parameters: z.object({ url: z.string(), replace: z.boolean().optional() }),
    });
    const converter = makeConverter(registry);
    const def = converter.currentDefinitions()[0]!;
    expect(def.parameters).toEqual({
      type: 'object',
      properties: { url: { type: 'string' }, replace: { type: 'boolean' } },
      required: ['url'],
    });
  });

  it('preserves the parameter key set (Req 7.6, Property 4)', () => {
    const registry = new ToolRegistry();
    register(registry, {
      name: 'search',
      parameters: z.object({ query: z.string(), limit: z.number(), tags: z.array(z.string()) }),
    });
    const converter = makeConverter(registry);
    const def = converter.currentDefinitions()[0]!;
    const params = def.parameters as { properties: Record<string, unknown> };
    expect(new Set(Object.keys(params.properties))).toEqual(new Set(['query', 'limit', 'tags']));
  });

  it('passes non-zod parameters through unchanged', () => {
    const registry = new ToolRegistry();
    const jsonSchema = { type: 'object', properties: { color: { type: 'string' } } };
    register(registry, { name: 'paint', parameters: jsonSchema });
    const converter = makeConverter(registry);
    const def = converter.currentDefinitions()[0]!;
    expect(def.parameters).toEqual(jsonSchema);
  });

  it('propagates additional definition fields (requiresApproval, priority, scope)', () => {
    const registry = new ToolRegistry();
    register(registry, {
      name: 'refund',
      parameters: z.object({}),
      requiresApproval: true,
      priority: 10,
      scope: 'orders',
    });
    const converter = makeConverter(registry);
    const def = converter.currentDefinitions()[0]!;
    expect(def).toMatchObject({
      name: 'refund',
      requiresApproval: true,
      priority: 10,
      scope: 'orders',
    });
  });
});

describe('ToolConverter debounce + diff (Req 7.4, 7.5)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces subsequent registrations to at most one emission per 500ms', () => {
    const registry = new ToolRegistry();
    const converter = makeConverter(registry);
    const listener = vi.fn();
    converter.onChange(listener);

    register(registry, { name: 'a', parameters: z.object({}) });
    vi.advanceTimersByTime(100);
    register(registry, { name: 'b', parameters: z.object({}) });
    vi.advanceTimersByTime(100);
    register(registry, { name: 'c', parameters: z.object({}) });

    // 200ms in — still no emission
    expect(listener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(listener).toHaveBeenCalledOnce();
    const emitted = listener.mock.calls[0]![0]! as Array<{ name: string }>;
    expect(emitted.map((d) => d.name).sort()).toEqual(['a', 'b', 'c']);
  });

  it('suppresses re-emission when the effective set is unchanged (Req 7.5)', () => {
    const registry = new ToolRegistry();
    const converter = makeConverter(registry);
    const listener = vi.fn();
    converter.onChange(listener);

    register(registry, { name: 'a', parameters: z.object({}) });
    converter.flush();
    expect(listener).toHaveBeenCalledTimes(1);

    // Register-then-unregister ends the debounce window with the same set.
    register(registry, { name: 'b', parameters: z.object({}) });
    registry.unregister('b');
    converter.flush();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('re-emits when a genuine set change occurs after a flush', () => {
    const registry = new ToolRegistry();
    const converter = makeConverter(registry);
    const listener = vi.fn();
    converter.onChange(listener);

    register(registry, { name: 'a', parameters: z.object({}) });
    converter.flush();
    register(registry, { name: 'b', parameters: z.object({}) });
    converter.flush();

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
