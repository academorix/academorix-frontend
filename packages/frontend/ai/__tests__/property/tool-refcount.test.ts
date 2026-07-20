/**
 * @file tool-refcount.test.ts
 * @description Property 3 (Requirement 6.10) — for any interleaving of
 *   register/unregister calls on a single `(name, scope)` key, the tool
 *   is present in the registry iff the number of live registrations
 *   (registers minus unregisters, floored at zero) is strictly greater
 *   than zero.
 *
 *   Also validates that unregister never drives the ref-count negative
 *   (Req 6.10 — spurious unregisters are no-ops).
 */

import { describe, it } from 'vitest';

import { ToolRegistry } from '@/core/registries/tool.registry';
import { forAll, type IPrng } from './property-test.helper';

const NAME = 'nav';
const noop = async (): Promise<void> => undefined;
const asEntry = (): {
  definition: { name: string; description: string; parameters: unknown };
  handler: () => Promise<unknown>;
} => ({
  definition: { name: NAME, description: '', parameters: {} },
  handler: noop,
});

/** Generate an interleaving of N register/unregister operations. */
function genOps(r: IPrng): Array<'reg' | 'unreg'> {
  const n = r.int(1, 50);
  const ops: Array<'reg' | 'unreg'> = [];
  for (let i = 0; i < n; i++) ops.push(r.bool() ? 'reg' : 'unreg');
  return ops;
}

describe('Property 3: tool ref-count invariant (Req 6.10)', () => {
  it('tool is present iff live registrations > 0', () => {
    forAll(
      (r) => genOps(r),
      (ops) => {
        const registry = new ToolRegistry();
        let live = 0;
        for (const op of ops) {
          if (op === 'reg') {
            registry.register(asEntry());
            live++;
          } else {
            registry.unregister(NAME);
            if (live > 0) live--; // spurious unregister floors at zero
          }
          const present = registry.hasName(NAME);
          const shouldBePresent = live > 0;
          if (present !== shouldBePresent) return false;
        }
        return true;
      },
      { runs: 200 }
    );
  });
});
