/**
 * @file tool-conversion.test.ts
 * @description Property 4 (Requirement 7.6) — for every random zod-object
 *   schema, converting the tool preserves:
 *
 *   1. `name` — round-trips byte-for-byte.
 *   2. The set of parameter names — the converted `properties` map's keys
 *      equal the input `.shape` keys.
 */

import { describe, it } from 'vitest';
import { z, type ZodTypeAny } from 'zod';

import { ToolRegistry } from '@/core/registries/tool.registry';
import { ToolConverter } from '@/core/services/tool-converter.service';
import { forAll, type IPrng } from './property-test.helper';

const CHARS = 'abcdefghijklmnopqrstuvwxyz';

const genName = (r: IPrng): string => {
  const len = r.int(3, 10);
  let out = '';
  for (let i = 0; i < len; i++) out += CHARS[r.int(0, CHARS.length)];
  return out;
};

/** Generate a random zod object schema with a random parameter set. */
function genShape(r: IPrng): { name: string; keys: string[]; schema: ZodTypeAny } {
  const name = genName(r);
  const numKeys = r.int(1, 6);
  const seenKeys = new Set<string>();
  while (seenKeys.size < numKeys) seenKeys.add(genName(r));
  const keys = [...seenKeys];
  const shape: Record<string, ZodTypeAny> = {};
  for (const key of keys) {
    const kind = r.int(0, 5);
    switch (kind) {
      case 0:
        shape[key] = z.string();
        break;
      case 1:
        shape[key] = z.number();
        break;
      case 2:
        shape[key] = z.boolean();
        break;
      case 3:
        shape[key] = z.array(z.string());
        break;
      default:
        shape[key] = z.string().optional();
        break;
    }
  }
  return { name, keys, schema: z.object(shape) };
}

describe('Property 4: tool-conversion invariant (Req 7.6)', () => {
  it('convert(def) preserves name and the parameter key set', () => {
    forAll(
      (r) => genShape(r),
      ({ name, keys, schema }) => {
        const registry = new ToolRegistry();
        registry.register({
          definition: { name, description: '', parameters: schema },
          handler: async () => undefined,
        });
        const converter = new ToolConverter(registry);
        // Not calling onModuleInit — we exercise convert() directly.
        const [def] = converter.currentDefinitions();
        if (!def) return false;
        if (def.name !== name) return false;
        const params = def.parameters as { properties?: Record<string, unknown> };
        if (!params || !params.properties) return false;
        const outKeys = new Set(Object.keys(params.properties));
        if (outKeys.size !== keys.length) return false;
        for (const k of keys) if (!outKeys.has(k)) return false;
        return true;
      },
      { runs: 200 }
    );
  });
});
