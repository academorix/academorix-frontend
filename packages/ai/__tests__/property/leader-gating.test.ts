/**
 * @file leader-gating.test.ts
 * @description Property 9 (Requirements 13.2, 13.3) — while `isLeader`
 *   is false, zero syncs occur for any frame sequence; flipping to
 *   leader resumes syncing.
 */

import { describe, it } from 'vitest';
import type { IAiClient, IAiConfig, IUiContextSnapshot } from '@stackra/contracts';

import { ContextRegistry } from '@/core/registries/context.registry';
import { PiiRedactor } from '@/core/services/pii-redactor.service';
import { ContextCollector } from '@/core/services/context-collector.service';
import { forAll, type IPrng } from './property-test.helper';

const NAMES = ['x', 'y', 'z'];

function genOps(
  r: IPrng
): Array<{ op: 'reg' | 'unreg' | 'update'; key: string; snapshot?: number }> {
  const n = r.int(1, 15);
  const ops: Array<{ op: 'reg' | 'unreg' | 'update'; key: string; snapshot?: number }> = [];
  for (let i = 0; i < n; i++) {
    const op = (['reg', 'reg', 'update', 'unreg'] as const)[r.int(0, 4)]!;
    ops.push({ op, key: r.pick(NAMES), snapshot: r.int(0, 100) });
  }
  return ops;
}

async function apply(ops: ReturnType<typeof genOps>, leader: boolean): Promise<number> {
  const registry = new ContextRegistry();
  const synced: IUiContextSnapshot[] = [];
  const client = {
    syncContext: (s: IUiContextSnapshot) => {
      synced.push(s);
      return Promise.resolve();
    },
  } as unknown as IAiClient;
  const config: IAiConfig = {
    baseUrl: 'https://x',
    authProvider: { getCredentials: () => Promise.resolve({}), refresh: () => Promise.resolve({}) },
    context: { debounceMs: 500, leaderGated: true },
  };
  const redactor = new PiiRedactor(config);
  const collector = new ContextCollector(registry, redactor, client, config);
  collector.onModuleInit();
  collector.setLeader(leader);

  for (const { op, key, snapshot } of ops) {
    if (op === 'reg') registry.register({ key, snapshot: snapshot ?? 0 });
    else if (op === 'update') registry.update(key, snapshot ?? 0);
    else registry.unregister(key);
    await collector.flush();
  }
  return synced.length;
}

describe('Property 9: leader gating (Req 13.2, 13.3)', () => {
  it('when isLeader=false, zero syncs occur for any frame sequence', () => {
    forAll(
      (r) => genOps(r),
      async (ops) => {
        const count = await apply(ops, false);
        return count === 0;
      },
      { runs: 100 }
    );
  });

  it('flipping to leader after a non-empty ops run resumes syncing', () => {
    forAll(
      (r) => genOps(r),
      async (ops) => {
        const registry = new ContextRegistry();
        const synced: IUiContextSnapshot[] = [];
        const client = {
          syncContext: (s: IUiContextSnapshot) => {
            synced.push(s);
            return Promise.resolve();
          },
        } as unknown as IAiClient;
        const config: IAiConfig = {
          baseUrl: 'https://x',
          authProvider: {
            getCredentials: () => Promise.resolve({}),
            refresh: () => Promise.resolve({}),
          },
          context: { debounceMs: 500, leaderGated: true },
        };
        const redactor = new PiiRedactor(config);
        const collector = new ContextCollector(registry, redactor, client, config);
        collector.onModuleInit();
        collector.setLeader(false);

        for (const { op, key, snapshot } of ops) {
          if (op === 'reg') registry.register({ key, snapshot: snapshot ?? 0 });
          else if (op === 'update') registry.update(key, snapshot ?? 0);
          else registry.unregister(key);
          await collector.flush();
        }

        // Never synced while non-leader.
        if (synced.length !== 0) return false;

        // Promote to leader; force flush; expect one sync IFF the
        // registry currently has frames.
        collector.setLeader(true);
        await collector.flush();

        const hasFrames = registry.count() > 0;
        return hasFrames ? synced.length === 1 : synced.length === 0;
      },
      { runs: 100 }
    );
  });
});
