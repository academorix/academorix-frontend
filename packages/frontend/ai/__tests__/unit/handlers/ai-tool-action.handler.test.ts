/**
 * @file ai-tool-action.handler.test.ts
 * @description Unit tests for {@link AiToolActionHandler} — the bridge
 *   from framework `ActionKind.AiTool` descriptors into the registered
 *   client-tool handlers. Verifies unknown-tool handling, signal
 *   propagation, result wrapping, and never-throws semantics.
 */

import { describe, expect, it, vi } from 'vitest';
import { ActionKind, type IAiToolAction } from '@stackra/contracts';

import { AiToolActionHandler } from '@/core/handlers/ai-tool-action.handler';
import { ToolRegistry } from '@/core/registries/tool.registry';

/**
 * Register a single tool in a fresh `ToolRegistry` for one test. Keeps
 * every test hermetic — no shared mutable state between cases.
 */
function makeRegistry(def: {
  name: string;
  handler?: (args: unknown, ctx: { signal: AbortSignal }) => Promise<unknown> | unknown;
  scope?: string;
}): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register({
    definition: {
      name: def.name,
      description: '',
      parameters: {},
      ...(def.scope !== undefined ? { scope: def.scope } : {}),
    },
    handler: def.handler ?? (async () => 'ok'),
  });
  return registry;
}

/** Minimal `IAiToolAction` builder used across every case. */
function makeDescriptor(overrides: Partial<IAiToolAction> = {}): IAiToolAction {
  return {
    kind: ActionKind.AiTool,
    toolName: 'my.tool',
    toolCallId: 'call-1',
    args: {},
    ...overrides,
  };
}

describe('AiToolActionHandler', () => {
  it('is bound to ActionKind.AiTool', () => {
    const registry = new ToolRegistry();
    const handler = new AiToolActionHandler(registry);
    expect(handler.kind).toBe(ActionKind.AiTool);
  });

  it('returns success with the handler result when the tool exists', async () => {
    const toolHandler = vi.fn(async () => ({ ok: true, id: 42 }));
    const registry = makeRegistry({ name: 'orders.approve', handler: toolHandler });
    const handler = new AiToolActionHandler(registry);

    const response = await handler.execute(
      makeDescriptor({ toolName: 'orders.approve', args: { id: 42 } }),
      {}
    );

    expect(response).toEqual({ success: true, data: { ok: true, id: 42 } });
    expect(toolHandler).toHaveBeenCalledOnce();
    // Args must reach the tool handler unmodified — the executor already
    // did the schema validation upstream.
    expect(toolHandler.mock.calls[0]?.[0]).toEqual({ id: 42 });
  });

  it('returns success:false when no tool is registered under the name', async () => {
    const registry = new ToolRegistry();
    const handler = new AiToolActionHandler(registry);

    const response = await handler.execute(makeDescriptor({ toolName: 'ghost' }), {});

    expect(response.success).toBe(false);
    expect(response.message).toMatch(/No AI tool registered.*ghost/);
  });

  it('forwards the caller signal to the tool handler', async () => {
    let receivedSignal: AbortSignal | undefined;
    const toolHandler = vi.fn(async (_args: unknown, ctx: { signal: AbortSignal }) => {
      receivedSignal = ctx.signal;
      return 'ok';
    });
    const registry = makeRegistry({ name: 't', handler: toolHandler });
    const handler = new AiToolActionHandler(registry);
    const controller = new AbortController();

    await handler.execute(makeDescriptor({ toolName: 't' }), { signal: controller.signal });

    // The exact signal the caller passed must reach the tool handler —
    // otherwise `cancelRun()` upstream cannot cascade to the tool.
    expect(receivedSignal).toBe(controller.signal);
  });

  it('short-circuits when the caller signal is already aborted', async () => {
    const toolHandler = vi.fn();
    const registry = makeRegistry({ name: 't', handler: toolHandler });
    const handler = new AiToolActionHandler(registry);
    const controller = new AbortController();
    controller.abort();

    const response = await handler.execute(makeDescriptor({ toolName: 't' }), {
      signal: controller.signal,
    });

    expect(response).toEqual({ success: false, message: 'Aborted' });
    expect(toolHandler).not.toHaveBeenCalled();
  });

  it('returns aborted when the signal aborts during handler execution', async () => {
    const controller = new AbortController();
    const toolHandler = vi.fn(async () => {
      // Simulate the handler racing an external abort. The tool's own
      // signal-check would normally bail — this test asserts our post-
      // await guard also handles it correctly.
      controller.abort();
      return 'late';
    });
    const registry = makeRegistry({ name: 't', handler: toolHandler });
    const handler = new AiToolActionHandler(registry);

    const response = await handler.execute(makeDescriptor({ toolName: 't' }), {
      signal: controller.signal,
    });

    expect(response).toEqual({ success: false, message: 'Aborted' });
  });

  it('converts a thrown error into a success:false response', async () => {
    const toolHandler = vi.fn(async () => {
      throw new Error('exploded');
    });
    const registry = makeRegistry({ name: 't', handler: toolHandler });
    const handler = new AiToolActionHandler(registry);

    const response = await handler.execute(makeDescriptor({ toolName: 't' }), {});

    expect(response.success).toBe(false);
    expect(response.message).toBe('exploded');
  });

  it('never throws even for non-Error rejections', async () => {
    // Weird throw shapes (strings, objects) come up in third-party
    // libraries. The handler must translate them without throwing.
    const toolHandler = vi.fn(async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'string-rejection';
    });
    const registry = makeRegistry({ name: 't', handler: toolHandler });
    const handler = new AiToolActionHandler(registry);

    const response = await handler.execute(makeDescriptor({ toolName: 't' }), {});

    expect(response.success).toBe(false);
    expect(response.message).toBe('string-rejection');
  });
});
