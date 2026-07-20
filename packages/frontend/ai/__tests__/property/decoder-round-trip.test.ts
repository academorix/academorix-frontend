/**
 * @file decoder-round-trip.test.ts
 * @description Property 1 (Requirement 4.8) — for every supported protocol
 *   event, decoding a JSON-serialized frame and re-serializing the decoded
 *   `IAiStreamEvent` preserves the event type and identifying fields.
 *
 *   Formally:
 *     ∀ event ∈ Supported : preserve(serialize(decode(frame(event))))
 *
 *   where `preserve` means the `type` field is retained and every field
 *   that identifies the event (ids, tool names, run id) round-trips.
 */

import { describe, it } from 'vitest';
import { AiStreamEventType } from '@stackra/contracts';

import { StreamDecoder } from '@/core/decoder/stream-decoder';
import { forAll, type IPrng } from './property-test.helper';

const decoder = new StreamDecoder();
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789-_';

/** Generate a random identifier of length 3..12. */
const genId = (r: IPrng): string => {
  const len = r.int(3, 13);
  let out = '';
  for (let i = 0; i < len; i++) out += CHARS[r.int(0, CHARS.length)];
  return out;
};

/** Generate an arbitrary protocol frame. */
type Frame = { obj: Record<string, unknown>; identifying: Record<string, unknown> };

const frameGenerators: Array<(r: IPrng) => Frame> = [
  (r) => {
    const id = genId(r);
    return { obj: { type: 'text-start', id }, identifying: { type: 'text-start', id } };
  },
  (r) => {
    const id = genId(r);
    const delta = genId(r);
    return {
      obj: { type: 'text-delta', id, delta },
      identifying: { type: 'text-delta', id, delta },
    };
  },
  (r) => {
    const id = genId(r);
    return { obj: { type: 'text-end', id }, identifying: { type: 'text-end', id } };
  },
  (r) => {
    const toolCallId = genId(r);
    const toolName = genId(r);
    return {
      obj: { type: 'tool-call-start', toolCallId, toolName },
      identifying: { type: 'tool-call-start', toolCallId, toolName },
    };
  },
  (r) => {
    const toolCallId = genId(r);
    const argsTextDelta = genId(r);
    return {
      obj: { type: 'tool-call-delta', toolCallId, argsTextDelta },
      identifying: { type: 'tool-call-delta', toolCallId, argsTextDelta },
    };
  },
  (r) => {
    const toolCallId = genId(r);
    const args = { k: genId(r), n: r.int(0, 100) };
    return {
      obj: { type: 'tool-call-end', toolCallId, args },
      identifying: { type: 'tool-call-end', toolCallId, args },
    };
  },
  (r) => {
    const toolCallId = genId(r);
    const isError = r.bool();
    const result = { v: genId(r) };
    return {
      obj: { type: 'tool-result', toolCallId, result, isError },
      identifying: { type: 'tool-result', toolCallId, result, isError },
    };
  },
  (r) => {
    const runId = genId(r);
    const reason = r.pick(['stop', 'length', 'content_filter', 'tool_calls']);
    return {
      obj: { type: 'finish', runId, reason },
      identifying: { type: 'finish', runId, reason },
    };
  },
  (r) => {
    const message = genId(r);
    const recoverable = r.bool();
    return {
      obj: { type: 'error', message, recoverable },
      identifying: { type: 'error', message, recoverable },
    };
  },
];

describe('Property 1: decoder round-trip (Req 4.8)', () => {
  it('preserves type + identifying fields for every supported event', () => {
    forAll(
      (r) => r.pick(frameGenerators)(r),
      ({ obj, identifying }) => {
        const decoded = decoder.decode(JSON.stringify(obj));
        if (decoded === null) return false;
        // The decoded type must match one of the enum values.
        if (!Object.values(AiStreamEventType).includes(decoded.type as AiStreamEventType)) {
          return false;
        }
        // Every identifying field must round-trip byte-for-byte.
        const roundTripped = JSON.parse(JSON.stringify(decoded)) as Record<string, unknown>;
        for (const [key, value] of Object.entries(identifying)) {
          if (JSON.stringify(roundTripped[key]) !== JSON.stringify(value)) return false;
        }
        return true;
      },
      { runs: 300 }
    );
  });
});
