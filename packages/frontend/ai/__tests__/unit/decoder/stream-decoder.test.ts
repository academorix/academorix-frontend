/**
 * @file stream-decoder.test.ts
 * @description Unit tests for the pure `StreamDecoder` — covers every
 *   protocol event type, the `[DONE]` sentinel, and the never-throw
 *   contract on invalid JSON (Req 4.6). Property-level assertions
 *   (round-trip, totality) travel in `../../property/`.
 */

import { describe, expect, it } from "vitest";
import { AiStreamEventType } from "@stackra/contracts";

import { StreamDecoder } from "@/core/decoder/stream-decoder";

const decoder = new StreamDecoder();
const decode = (frame: string): unknown => decoder.decode(frame);
const json = (obj: unknown): string => JSON.stringify(obj);

describe("StreamDecoder", () => {
  describe("text events (Req 4.1)", () => {
    it("decodes text-start", () => {
      expect(decode(json({ type: "text-start", id: "msg-1" }))).toEqual({
        type: AiStreamEventType.TextStart,
        id: "msg-1",
      });
    });

    it("decodes text-delta with the streamed delta", () => {
      expect(decode(json({ type: "text-delta", id: "msg-1", delta: "Hello" }))).toEqual({
        type: AiStreamEventType.TextDelta,
        id: "msg-1",
        delta: "Hello",
      });
    });

    it("decodes text-end", () => {
      expect(decode(json({ type: "text-end", id: "msg-1" }))).toEqual({
        type: AiStreamEventType.TextEnd,
        id: "msg-1",
      });
    });
  });

  describe("tool-call events (Req 4.2)", () => {
    it("decodes tool-call-start with toolCallId + toolName", () => {
      expect(
        decode(json({ type: "tool-call-start", toolCallId: "c1", toolName: "navigate" })),
      ).toEqual({
        type: AiStreamEventType.ToolCallStart,
        toolCallId: "c1",
        toolName: "navigate",
      });
    });

    it("decodes tool-call-delta carrying an args-text fragment", () => {
      expect(
        decode(json({ type: "tool-call-delta", toolCallId: "c1", argsTextDelta: '{"url":' })),
      ).toEqual({
        type: AiStreamEventType.ToolCallDelta,
        toolCallId: "c1",
        argsTextDelta: '{"url":',
      });
    });

    it("decodes tool-call-end carrying assembled args", () => {
      expect(
        decode(json({ type: "tool-call-end", toolCallId: "c1", args: { url: "/orders" } })),
      ).toEqual({
        type: AiStreamEventType.ToolCallEnd,
        toolCallId: "c1",
        args: { url: "/orders" },
      });
    });
  });

  describe("tool-result events (Req 4.3)", () => {
    it("decodes a successful tool-result", () => {
      expect(
        decode(
          json({ type: "tool-result", toolCallId: "c1", result: { ok: true }, isError: false }),
        ),
      ).toEqual({
        type: AiStreamEventType.ToolResult,
        toolCallId: "c1",
        result: { ok: true },
        isError: false,
      });
    });

    it("decodes an error tool-result", () => {
      expect(
        decode(json({ type: "tool-result", toolCallId: "c1", result: "boom", isError: true })),
      ).toEqual({
        type: AiStreamEventType.ToolResult,
        toolCallId: "c1",
        result: "boom",
        isError: true,
      });
    });

    it("coerces a missing isError flag to `false`", () => {
      expect(decode(json({ type: "tool-result", toolCallId: "c1", result: null }))).toEqual({
        type: AiStreamEventType.ToolResult,
        toolCallId: "c1",
        result: null,
        isError: false,
      });
    });
  });

  describe("finish event (Req 4.4)", () => {
    it("decodes finish with runId + reason", () => {
      expect(decode(json({ type: "finish", runId: "r1", reason: "stop" }))).toEqual({
        type: AiStreamEventType.Finish,
        runId: "r1",
        reason: "stop",
      });
    });
  });

  describe("[DONE] sentinel (Req 4.5)", () => {
    it("returns null on the bare sentinel", () => {
      expect(decode("[DONE]")).toBeNull();
    });

    it("returns null on the sentinel with surrounding whitespace", () => {
      expect(decode("  [DONE]  ")).toBeNull();
    });
  });

  describe("error events", () => {
    it("decodes a backend-emitted error event", () => {
      expect(
        decode(json({ type: "error", message: "server crashed", recoverable: false })),
      ).toEqual({
        type: AiStreamEventType.Error,
        message: "server crashed",
        recoverable: false,
      });
    });

    it("defaults recoverable to true when the field is absent", () => {
      expect(decode(json({ type: "error", message: "x" }))).toEqual({
        type: AiStreamEventType.Error,
        message: "x",
        recoverable: true,
      });
    });
  });

  describe("malformed frames (Req 4.6 — never throws)", () => {
    it("emits a recoverable Error event on invalid JSON", () => {
      const event = decode("{not json");
      expect(event).toMatchObject({
        type: AiStreamEventType.Error,
        recoverable: true,
      });
      expect((event as { message: string }).message).toContain("Invalid protocol frame");
    });

    it("emits an Error event on a non-object JSON frame", () => {
      const event = decode(json([1, 2, 3]));
      expect(event).toMatchObject({
        type: AiStreamEventType.Error,
        recoverable: true,
      });
    });

    it("emits an Error event on a frame missing the type field", () => {
      const event = decode(json({ id: "x" }));
      expect(event).toMatchObject({
        type: AiStreamEventType.Error,
        recoverable: true,
      });
    });

    it("emits an Error event on an unknown protocol type", () => {
      const event = decode(json({ type: "invented-event" }));
      expect(event).toMatchObject({
        type: AiStreamEventType.Error,
        recoverable: true,
      });
      expect((event as { message: string }).message).toContain("invented-event");
    });
  });

  describe("discriminated union (Req 4.7)", () => {
    it("produces events keyed by AiStreamEventType", () => {
      const event = decode(json({ type: "text-start", id: "msg-1" }));
      // Compile-time discriminator narrows via `type`.
      if (event && event.type === AiStreamEventType.TextStart) {
        expect(event.id).toBe("msg-1");
        return;
      }
      throw new Error("expected TextStart event");
    });
  });
});
