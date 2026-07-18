/**
 * @file conversation-append.test.ts
 * @description Property 10 (Requirement 17.5) — for every thread and
 *   every append operation (`appendUser`, `startAssistantMessage`), the
 *   message count after the append equals the count before plus one.
 *
 *   Also asserts that `appendTextDelta` never changes the count.
 */

import { describe, it } from 'vitest';

import { ConversationStore } from '@/core/services/conversation-store.service';
import { forAll, type IPrng } from './property-test.helper';

type Op = { kind: 'user'; text: string } | { kind: 'assistant' } | { kind: 'delta'; text: string };

function genOps(r: IPrng): Op[] {
  const n = r.int(1, 30);
  const ops: Op[] = [];
  for (let i = 0; i < n; i++) {
    const k = r.int(0, 3);
    if (k === 0) ops.push({ kind: 'user', text: `m${i}` });
    else if (k === 1) ops.push({ kind: 'assistant' });
    else ops.push({ kind: 'delta', text: `d${i}` });
  }
  return ops;
}

describe('Property 10: conversation append invariant (Req 17.5)', () => {
  it('every append operation grows the thread by exactly one message', () => {
    forAll(
      (r) => genOps(r),
      (ops) => {
        const store = new ConversationStore();
        const t = store.createThread({ personaSlug: 'writer' });
        let lastAssistantId: string | null = null;

        for (const op of ops) {
          const before = store.getThread(t)!.messages.length;
          if (op.kind === 'user') {
            store.appendUser(t, op.text);
            if (store.getThread(t)!.messages.length !== before + 1) return false;
          } else if (op.kind === 'assistant') {
            lastAssistantId = store.startAssistantMessage(t);
            if (store.getThread(t)!.messages.length !== before + 1) return false;
          } else {
            // delta — count must NOT change.
            if (lastAssistantId !== null) {
              store.appendTextDelta(t, lastAssistantId, op.text);
              if (store.getThread(t)!.messages.length !== before) return false;
            }
          }
        }
        return true;
      },
      { runs: 200 }
    );
  });
});
