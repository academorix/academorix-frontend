/**
 * @file decoder-totality.test.ts
 * @description Property 2 (Requirements 4.6 + 4.7) — for every string
 *   input, `decode()` returns either an `IAiStreamEvent` or `null`, and
 *   never throws.
 *
 *   The generator produces valid protocol frames, malformed JSON, empty
 *   strings, random garbage, and `[DONE]` sentinel variants — all must
 *   yield a value in the totality domain.
 */

import { describe, it, expect } from "vitest";
import { AiStreamEventType } from "@stackra/contracts";

import { StreamDecoder } from "@/core/decoder/stream-decoder";
import { forAll, type IPrng } from "./property-test.helper";

const decoder = new StreamDecoder();

const validTypes = [
  "text-start",
  "text-delta",
  "text-end",
  "tool-call-start",
  "tool-call-delta",
  "tool-call-end",
  "tool-result",
  "finish",
  "error",
];

const validEventTypes = new Set(Object.values(AiStreamEventType));

/** Generate arbitrary garbage strings the decoder must survive. */
function garbage(r: IPrng): string {
  const len = r.int(0, 64);
  let out = "";
  for (let i = 0; i < len; i++) {
    // Include control chars, quotes, braces — anything that trips JSON.
    out += String.fromCharCode(r.int(1, 128));
  }
  return out;
}

/** Generate a well-formed protocol frame. */
function validFrame(r: IPrng): string {
  const type = r.pick(validTypes);
  const obj: Record<string, unknown> = { type };
  if (type.startsWith("text-")) obj.id = "x";
  if (type.startsWith("tool-call")) obj.toolCallId = "c";
  if (type === "tool-call-start") obj.toolName = "t";
  if (type === "tool-call-delta") obj.argsTextDelta = "a";
  if (type === "tool-call-end") obj.args = {};
  if (type === "text-delta") obj.delta = "d";
  if (type === "tool-result") {
    obj.toolCallId = "c";
    obj.result = null;
    obj.isError = r.bool();
  }
  if (type === "finish") {
    obj.runId = "r";
    obj.reason = "stop";
  }
  if (type === "error") {
    obj.message = "m";
    obj.recoverable = r.bool();
  }
  return JSON.stringify(obj);
}

/** Generate arbitrary inputs — mix of valid, malformed, sentinel, garbage. */
function anyFrame(r: IPrng): string {
  const kind = r.int(0, 6);
  switch (kind) {
    case 0:
      return validFrame(r);
    case 1:
      return "[DONE]";
    case 2:
      return "";
    case 3:
      return garbage(r);
    case 4:
      // JSON that is not an object — arrays, primitives.
      return JSON.stringify(r.pick([[1, 2], 42, "string", null, true]));
    default:
      // Object without a valid `type`.
      return JSON.stringify({ id: "x", something: r.int(0, 100) });
  }
}

describe("Property 2: decoder totality (Req 4.6 + 4.7)", () => {
  it("returns an IAiStreamEvent or null for any input, never throws", () => {
    forAll(
      (r) => anyFrame(r),
      (input) => {
        // The decoder MUST NOT throw. Wrapping in try/catch guarantees a
        // failure would surface as a returned `false`, not an unhandled throw.
        let result: unknown;
        try {
          result = decoder.decode(input);
        } catch {
          return false;
        }
        if (result === null) return true;
        // Otherwise the result must be an object with a valid AiStreamEventType.
        if (!result || typeof result !== "object") return false;
        const record = result as { type: unknown };
        return validEventTypes.has(record.type as AiStreamEventType);
      },
      { runs: 500 },
    );
  });

  it("never throws on the empty string (regression case)", () => {
    expect(() => decoder.decode("")).not.toThrow();
  });
});
