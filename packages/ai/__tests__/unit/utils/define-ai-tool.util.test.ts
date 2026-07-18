/**
 * @file define-ai-tool.util.test.ts
 * @description Unit tests for `defineAiTool()` — confirms it is a
 *   typed identity that preserves the exact input object (no mutation,
 *   no cloning) and works with both zod schemas and JSON schemas.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineAiTool } from '@/core/utils/define-ai-tool.util';

describe('defineAiTool', () => {
  it('returns the exact input object (typed identity)', () => {
    const input = {
      name: 'navigate',
      description: 'Navigate the UI',
      parameters: z.object({ url: z.string() }),
    };
    const output = defineAiTool(input);
    expect(output).toBe(input);
  });

  it('preserves every field including optional ones', () => {
    const handler = async (): Promise<void> => undefined;
    const def = defineAiTool({
      name: 'refund',
      description: 'Refund an order',
      parameters: { type: 'object', properties: { orderId: { type: 'string' } } },
      requiresApproval: true,
      priority: 10,
      scope: 'orders',
      handler,
    });
    expect(def).toEqual({
      name: 'refund',
      description: 'Refund an order',
      parameters: { type: 'object', properties: { orderId: { type: 'string' } } },
      requiresApproval: true,
      priority: 10,
      scope: 'orders',
      handler,
    });
    expect(def.handler).toBe(handler);
  });

  it('accepts definitions without a handler (handler bound at call site)', () => {
    const def = defineAiTool({
      name: 'search',
      description: 'Search',
      parameters: z.object({ query: z.string() }),
    });
    expect(def.handler).toBeUndefined();
    expect(def.name).toBe('search');
  });
});
