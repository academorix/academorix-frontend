/**
 * @file tool-executor.service.test.ts
 * @description Unit tests for {@link ToolExecutor}: server-tool classify
 *   (Req 5.1, 8.4), schema validation (Req 6.13), approval gate (Req 9),
 *   handler abort signal (Req 8.6, 8.7), and result/error/rejection
 *   posting (Req 8.2, 8.3).
 */

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { IAiClient, IAiToolResult } from '@stackra/contracts';

import { ToolRegistry } from '@/core/registries/tool.registry';
import { ToolExecutor } from '@/core/services/tool-executor.service';

// ── Test doubles ─────────────────────────────────────────────────────────

function makeClient(): { client: IAiClient; posted: IAiToolResult[] } {
  const posted: IAiToolResult[] = [];
  const client = {
    postToolResult: vi.fn((r: IAiToolResult) => {
      posted.push(r);
      return Promise.resolve();
    }),
  } as unknown as IAiClient;
  return { client, posted };
}

/** Minimal in-memory dispatcher that records calls for assertion. */
function makeDispatcher(handlerImpl: (d: any, c: any) => Promise<any> | any) {
  const calls: Array<{ descriptor: any; context: any }> = [];
  const dispatch = vi.fn(async (descriptor: any, context: any = {}) => {
    calls.push({ descriptor, context });
    return handlerImpl(descriptor, context);
  });
  return {
    calls,
    dispatcher: {
      dispatch,
      register: vi.fn(() => () => undefined),
    } as any,
  };
}

function register(
  registry: ToolRegistry,
  def: {
    name: string;
    parameters?: unknown;
    requiresApproval?: boolean;
    handler?: (args: unknown, ctx: { signal: AbortSignal }) => Promise<unknown>;
  }
): void {
  registry.register({
    definition: {
      name: def.name,
      description: '',
      parameters: def.parameters ?? {},
      ...(def.requiresApproval !== undefined ? { requiresApproval: def.requiresApproval } : {}),
    },
    handler: def.handler ?? (async () => 'ok'),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('ToolExecutor.classify (Req 5.1)', () => {
  it('isClientTool returns true for a registered tool and false otherwise', () => {
    const registry = new ToolRegistry();
    const { client } = makeClient();
    register(registry, { name: 'nav' });
    const executor = new ToolExecutor(registry, client);
    expect(executor.isClientTool('nav')).toBe(true);
    expect(executor.isClientTool('server-tool')).toBe(false);
  });
});

describe('ToolExecutor.execute — server tool branch (Req 8.4, 5.2)', () => {
  it('returns { serverTool: true } and posts nothing for an unregistered tool', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    const executor = new ToolExecutor(registry, client);
    const outcome = await executor.execute('c1', 'unknown', { a: 1 });
    expect(outcome).toEqual({ serverTool: true });
    expect(posted).toHaveLength(0);
  });
});

describe('ToolExecutor.execute — validation (Req 6.13)', () => {
  it('posts an error when zod validation fails and does NOT invoke the handler', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    const handler = vi.fn();
    register(registry, {
      name: 'search',
      parameters: z.object({ query: z.string() }),
      handler,
    });
    const executor = new ToolExecutor(registry, client);

    const outcome = await executor.execute('c1', 'search', { query: 42 });
    expect(outcome.error).toContain('Invalid arguments for "search"');
    expect(handler).not.toHaveBeenCalled();
    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ toolCallId: 'c1', error: expect.any(String) });
  });

  it('invokes handler with the parsed args when zod validation succeeds', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    const handler = vi.fn().mockResolvedValue('done');
    register(registry, {
      name: 'search',
      parameters: z.object({ query: z.string() }),
      handler,
    });
    const executor = new ToolExecutor(registry, client);

    await executor.execute('c1', 'search', { query: 'ai' });

    expect(handler).toHaveBeenCalledWith(
      { query: 'ai' },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(posted[0]).toMatchObject({ toolCallId: 'c1', result: 'done' });
  });

  it('passes args unchanged when the parameters is not a zod schema', async () => {
    const registry = new ToolRegistry();
    const { client } = makeClient();
    const handler = vi.fn().mockResolvedValue('ok');
    register(registry, { name: 'raw', parameters: { type: 'object' }, handler });
    const executor = new ToolExecutor(registry, client);

    const args = { anything: 'goes' };
    await executor.execute('c1', 'raw', args);

    expect(handler).toHaveBeenCalledWith(args, expect.anything());
  });
});

describe('ToolExecutor.execute — approval gate (Req 9)', () => {
  it('waits for approval and rejects when the user declines (Req 9.3)', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    const handler = vi.fn();
    register(registry, { name: 'refund', requiresApproval: true, handler });
    const executor = new ToolExecutor(registry, client);

    const outcome = await executor.execute(
      'c1',
      'refund',
      {},
      {
        waitForApproval: async () => false,
      }
    );

    expect(outcome).toEqual({ rejected: true });
    expect(handler).not.toHaveBeenCalled();
    expect(posted[0]).toEqual({ toolCallId: 'c1', rejected: true });
  });

  it('proceeds after approval', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    const handler = vi.fn().mockResolvedValue('refunded');
    register(registry, { name: 'refund', requiresApproval: true, handler });
    const executor = new ToolExecutor(registry, client);

    await executor.execute('c1', 'refund', {}, { waitForApproval: async () => true });

    expect(handler).toHaveBeenCalledOnce();
    expect(posted[0]).toMatchObject({ toolCallId: 'c1', result: 'refunded' });
  });

  it('gates on the backend-supplied requiresApproval flag as well (Req 9.4)', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    const handler = vi.fn().mockResolvedValue('ok');
    register(registry, { name: 'ok', handler });
    const executor = new ToolExecutor(registry, client);

    await executor.execute(
      'c1',
      'ok',
      {},
      {
        backendRequiresApproval: true,
        waitForApproval: async () => false,
      }
    );

    expect(handler).not.toHaveBeenCalled();
    expect(posted[0]).toEqual({ toolCallId: 'c1', rejected: true });
  });
});

describe('ToolExecutor.execute — handler failures (Req 8.3)', () => {
  it('posts an error result when the handler throws', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    register(registry, {
      name: 'boom',
      handler: async () => {
        throw new Error('exploded');
      },
    });
    const executor = new ToolExecutor(registry, client);

    const outcome = await executor.execute('c1', 'boom', {});
    expect(outcome.error).toBe('exploded');
    expect(posted[0]).toEqual({ toolCallId: 'c1', error: 'exploded' });
  });
});

describe('ToolExecutor.execute — bridge into @stackra/actions', () => {
  it('dispatches an ai.tool descriptor when ACTION_DISPATCHER is wired', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    const handler = vi.fn().mockResolvedValue('never-invoked-directly');
    register(registry, {
      name: 'orders.approve',
      parameters: z.object({ id: z.string() }),
      handler,
    });
    const { calls, dispatcher } = makeDispatcher(async () => ({
      success: true,
      data: 'approved',
    }));
    const executor = new ToolExecutor(registry, client, dispatcher);

    const outcome = await executor.execute('c1', 'orders.approve', { id: 'ord-1' });

    // Handler is invoked by the AiToolActionHandler through the dispatcher,
    // NOT by the executor directly.
    expect(handler).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.descriptor).toMatchObject({
      kind: 'ai.tool',
      toolName: 'orders.approve',
      toolCallId: 'c1',
      args: { id: 'ord-1' },
    });
    expect(calls[0]?.context).toMatchObject({ signal: expect.any(AbortSignal) });
    expect(outcome).toEqual({ result: 'approved' });
    expect(posted[0]).toMatchObject({ toolCallId: 'c1', result: 'approved' });
  });

  it('forwards a registered scope into the descriptor', async () => {
    const registry = new ToolRegistry();
    const { client } = makeClient();
    registry.register({
      definition: {
        name: 'navigate',
        description: '',
        parameters: {},
        scope: 'orders',
      },
      handler: async () => 'ok',
    });
    const { calls, dispatcher } = makeDispatcher(async () => ({ success: true, data: 'ok' }));
    const executor = new ToolExecutor(registry, client, dispatcher);

    await executor.execute('c1', 'navigate', { to: '/orders' });

    expect(calls[0]?.descriptor).toMatchObject({ scope: 'orders' });
  });

  it('converts a failure response into an error outcome and posts it', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    register(registry, { name: 'boom' });
    const { dispatcher } = makeDispatcher(async () => ({
      success: false,
      message: 'Permission denied',
    }));
    const executor = new ToolExecutor(registry, client, dispatcher);

    const outcome = await executor.execute('c1', 'boom', {});

    expect(outcome).toEqual({ error: 'Permission denied' });
    expect(posted[0]).toEqual({ toolCallId: 'c1', error: 'Permission denied' });
  });

  it('cascades external cancellation and posts nothing when aborted', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    register(registry, { name: 'slow' });
    const { dispatcher } = makeDispatcher(
      (_d, ctx) =>
        new Promise((resolve) => {
          const signal: AbortSignal | undefined = ctx?.signal;
          signal?.addEventListener('abort', () => resolve({ success: false, message: 'Aborted' }), {
            once: true,
          });
          // Never resolves without an abort; the executor treats
          // `signal.aborted` after the dispatch as the cancellation cue.
        })
    );
    const executor = new ToolExecutor(registry, client, dispatcher);
    const external = new AbortController();

    const promise = executor.execute('c1', 'slow', {}, { signal: external.signal });
    external.abort();
    const outcome = await promise;

    expect(outcome).toEqual({ aborted: true });
    expect(posted).toHaveLength(0);
  });
});

describe('ToolExecutor.execute — abort signal (Req 8.6, 8.7)', () => {
  it('passes an AbortSignal into the handler that reflects external cancellation', async () => {
    const registry = new ToolRegistry();
    const { client } = makeClient();
    let observedSignal: AbortSignal | undefined;
    register(registry, {
      name: 'watch',
      handler: async (_args, ctx) => {
        observedSignal = ctx.signal;
        return 'ran';
      },
    });
    const executor = new ToolExecutor(registry, client);
    const external = new AbortController();

    await executor.execute('c1', 'watch', {}, { signal: external.signal });
    external.abort();

    // The observed signal is derived from the external one — abort cascades.
    expect(observedSignal?.aborted).toBe(true);
  });

  it('does NOT post a completed result when the run is cancelled mid-execution', async () => {
    const registry = new ToolRegistry();
    const { client, posted } = makeClient();
    register(registry, {
      name: 'slow',
      handler: (_args, ctx) =>
        new Promise((resolve) => {
          ctx.signal.addEventListener('abort', () => resolve('done-anyway'), { once: true });
        }),
    });
    const executor = new ToolExecutor(registry, client);
    const external = new AbortController();

    const promise = executor.execute('c1', 'slow', {}, { signal: external.signal });
    external.abort();
    const outcome = await promise;

    expect(outcome.aborted).toBe(true);
    expect(posted).toHaveLength(0);
  });
});
