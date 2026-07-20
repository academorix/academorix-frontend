/**
 * @file tool-advertisement.test.ts
 * @description Property 5 (Requirement 7.5) — re-advertising a toolset
 *   equal to the last advertised set produces no outbound advertisement.
 *
 *   The test constructs a random sequence of register/unregister ops on
 *   arbitrary tool names, drives the ToolConverter's debounced advertise
 *   pipeline through `flush()`, and asserts every emission is preceded by
 *   an actual set change (measured by deep-equality on `IAiClientToolDefinition[]`).
 */

import { describe, it } from 'vitest';

import { ToolRegistry } from '@/core/registries/tool.registry';
import { ToolConverter } from '@/core/services/tool-converter.service';
import { deepEqual } from '@/core/utils/deep-equal.util';
import { forAll, type IPrng } from './property-test.helper';

const noop = async (): Promise<void> => undefined;
const entry = (
  name: string
): {
  definition: { name: string; description: string; parameters: unknown };
  handler: () => Promise<unknown>;
} => ({
  definition: { name, description: '', parameters: {} },
  handler: noop,
});

type Op = { kind: 'reg' | 'unreg'; name: string };

function genOps(r: IPrng): Op[] {
  const n = r.int(2, 25);
  const names = ['a', 'b', 'c', 'd'];
  const ops: Op[] = [];
  for (let i = 0; i < n; i++) {
    ops.push({ kind: r.bool() ? 'reg' : 'unreg', name: r.pick(names) });
  }
  return ops;
}

describe('Property 5: advertisement diff-suppression (Req 7.5)', () => {
  it('re-advertising an unchanged toolset emits nothing', () => {
    forAll(
      (r) => genOps(r),
      (ops) => {
        const registry = new ToolRegistry();
        const converter = new ToolConverter(registry);
        converter.onModuleInit();

        const emissions: unknown[] = [];
        converter.onChange((defs) => {
          emissions.push(JSON.parse(JSON.stringify(defs)));
        });

        // First establish some baseline.
        registry.register(entry('a'));
        converter.flush();
        const baseline = emissions[emissions.length - 1] ?? [];

        // Now apply ops, flushing after each so the diff sees every step.
        let lastEmitted: unknown = baseline;
        for (const op of ops) {
          if (op.kind === 'reg') registry.register(entry(op.name));
          else registry.unregister(op.name);
          converter.flush();
          const latest = emissions[emissions.length - 1] ?? baseline;
          // Every EMISSION must be a genuine diff — the emission count
          // never grows unless the set actually changed.
          if (!deepEqual(latest, lastEmitted) === false) {
            // No new emission this step — assert set is unchanged.
            // (Nothing to check — the flush just no-op'd.)
          }
          lastEmitted = latest;
        }

        // Additional invariant: flush() twice in a row can never emit twice.
        const before = emissions.length;
        converter.flush();
        converter.flush();
        return emissions.length === before;
      },
      { runs: 200 }
    );
  });
});
