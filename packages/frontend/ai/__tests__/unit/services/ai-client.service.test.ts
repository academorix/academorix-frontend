/**
 * @file ai-client.service.test.ts
 * @description Unit tests for {@link AiClientService}: endpoint shape,
 *   auth attach + refresh-once behavior (Req 25.1, 25.3, 25.5), decoded
 *   stream events, and speech helpers (Req 18).
 */

import { describe, expect, it, vi } from "vitest";
import {
  AiStreamEventType,
  type IAiChatRequest,
  type IAiCredentials,
  type IAiStreamDecoder,
  type IAiStreamEvent,
  type IAiTransport,
  type IAiRequestSpec,
} from "@stackra/contracts";

import { AiClientService } from "@/core/services/ai-client.service";
import { StreamDecoder } from "@/core/decoder/stream-decoder";
import { AiAuthError, AiTransportError } from "@/core/errors";
import { base64Decode, base64Encode } from "@/core/utils/base64.util";

// ── Test doubles ─────────────────────────────────────────────────────────

interface IStreamPlan {
  /** Frames to yield in sequence. Use `AUTH` / `ERR` / string for control. */
  frames: Array<string | "AUTH" | "ERR">;
}

class ScriptedTransport implements IAiTransport {
  public state = "disconnected" as never;
  public onStateChange(): () => void {
    return () => undefined;
  }
  public streamCalls: IAiChatRequest[] = [];
  public requestCalls: IAiRequestSpec[] = [];
  public streamPlans: IStreamPlan[] = [];
  public requestPlans: Array<() => Promise<unknown>> = [];

  public queueStream(plan: IStreamPlan): void {
    this.streamPlans.push(plan);
  }
  public queueRequest(fn: () => Promise<unknown>): void {
    this.requestPlans.push(fn);
  }

  public stream(req: IAiChatRequest & { persona: string }): AsyncIterable<string> {
    this.streamCalls.push(req);
    const plan = this.streamPlans.shift();
    if (!plan) throw new Error("ScriptedTransport: no stream plan queued");
    async function* iterate(): AsyncIterable<string> {
      for (const frame of plan.frames) {
        if (frame === "AUTH") throw new AiAuthError("unauth", 401);
        if (frame === "ERR") throw new AiTransportError("boom");
        yield frame;
      }
    }
    return iterate();
  }

  public async request<T>(spec: IAiRequestSpec): Promise<T> {
    this.requestCalls.push(spec);
    const plan = this.requestPlans.shift();
    if (!plan) throw new Error("ScriptedTransport: no request plan queued");
    return (await plan()) as T;
  }
}

function makeAuthProvider(creds: IAiCredentials = {}): {
  getCredentials: () => Promise<IAiCredentials>;
  refresh: () => Promise<IAiCredentials>;
} {
  return {
    getCredentials: vi.fn(() => Promise.resolve(creds)),
    refresh: vi.fn(() => Promise.resolve(creds)),
  };
}

function makeClient(): {
  client: AiClientService;
  transport: ScriptedTransport;
  auth: ReturnType<typeof makeAuthProvider>;
  decoder: IAiStreamDecoder;
} {
  const transport = new ScriptedTransport();
  const decoder = new StreamDecoder();
  const auth = makeAuthProvider();
  const client = new AiClientService(transport, decoder, auth);
  return { client, transport, auth, decoder };
}

const req: IAiChatRequest = { persona: "writer", message: "hi" };

// ── Tests ────────────────────────────────────────────────────────────────

describe("AiClientService.chat", () => {
  it("yields decoded events for every protocol frame", async () => {
    const { client, transport } = makeClient();
    transport.queueStream({
      frames: [
        JSON.stringify({ type: "text-start", id: "m1" }),
        JSON.stringify({ type: "text-delta", id: "m1", delta: "Hello" }),
        JSON.stringify({ type: "text-end", id: "m1" }),
        JSON.stringify({ type: "finish", runId: "r1", reason: "stop" }),
      ],
    });

    const events: IAiStreamEvent[] = [];
    for await (const event of client.chat("writer", req, new AbortController().signal)) {
      events.push(event);
    }

    expect(events.map((e) => e.type)).toEqual([
      AiStreamEventType.TextStart,
      AiStreamEventType.TextDelta,
      AiStreamEventType.TextEnd,
      AiStreamEventType.Finish,
    ]);
  });

  it("terminates on the [DONE] sentinel without yielding", async () => {
    const { client, transport } = makeClient();
    transport.queueStream({
      frames: [
        JSON.stringify({ type: "text-delta", id: "m1", delta: "a" }),
        "[DONE]",
        // Anything after [DONE] should not surface.
        JSON.stringify({ type: "text-delta", id: "m1", delta: "b" }),
      ],
    });

    const events: IAiStreamEvent[] = [];
    for await (const event of client.chat("writer", req, new AbortController().signal)) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe(AiStreamEventType.TextDelta);
  });

  it("refreshes credentials once and retries on initial 401 (Req 25.3, 25.5)", async () => {
    const { client, transport, auth } = makeClient();
    transport.queueStream({ frames: ["AUTH"] });
    transport.queueStream({
      frames: [JSON.stringify({ type: "text-delta", id: "m1", delta: "ok" })],
    });

    const events: IAiStreamEvent[] = [];
    for await (const event of client.chat("writer", req, new AbortController().signal)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(auth.refresh).toHaveBeenCalledOnce();
    expect(transport.streamCalls).toHaveLength(2);
  });

  it("does NOT retry when an auth error surfaces after events have yielded", async () => {
    const { client, transport, auth } = makeClient();
    transport.queueStream({
      frames: [JSON.stringify({ type: "text-delta", id: "m1", delta: "a" }), "AUTH"],
    });

    await expect(async () => {
      for await (const _ of client.chat("writer", req, new AbortController().signal)) {
        /* consume */
      }
    }).rejects.toBeInstanceOf(AiAuthError);
    expect(auth.refresh).not.toHaveBeenCalled();
  });

  it("does NOT retry on a second consecutive auth failure", async () => {
    const { client, transport, auth } = makeClient();
    transport.queueStream({ frames: ["AUTH"] });
    transport.queueStream({ frames: ["AUTH"] });

    await expect(async () => {
      for await (const _ of client.chat("writer", req, new AbortController().signal)) {
        /* consume */
      }
    }).rejects.toBeInstanceOf(AiAuthError);
    expect(auth.refresh).toHaveBeenCalledOnce();
  });

  it("propagates transport errors without retry", async () => {
    const { client, transport, auth } = makeClient();
    transport.queueStream({ frames: ["ERR"] });

    await expect(async () => {
      for await (const _ of client.chat("writer", req, new AbortController().signal)) {
        /* consume */
      }
    }).rejects.toBeInstanceOf(AiTransportError);
    expect(auth.refresh).not.toHaveBeenCalled();
  });
});

describe("AiClientService one-shot endpoints", () => {
  it("DELETEs /api/ai/runs/{run}", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve(undefined));

    await client.cancelRun("run-1");

    expect(transport.requestCalls[0]).toMatchObject({
      method: "DELETE",
      path: "/api/ai/runs/run-1",
    });
  });

  it("URL-encodes the run id", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve(undefined));
    await client.cancelRun("run/1 abc");
    expect(transport.requestCalls[0]?.path).toBe(`/api/ai/runs/${encodeURIComponent("run/1 abc")}`);
  });

  it("POSTs the tool result", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve(undefined));
    await client.postToolResult({ toolCallId: "c1", result: { ok: true } });
    expect(transport.requestCalls[0]).toEqual({
      method: "POST",
      path: "/api/ai/tool-results",
      body: { toolCallId: "c1", result: { ok: true } },
    });
  });

  it("POSTs draft confirms", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve(undefined));
    await client.confirmDraft("draft-42");
    expect(transport.requestCalls[0]).toMatchObject({
      method: "POST",
      path: "/api/ai/drafts/draft-42/confirm",
    });
  });

  it("GETs the persona catalog", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve([{ slug: "w", title: "Writer" }]));
    const personas = await client.listPersonas();
    expect(personas).toEqual([{ slug: "w", title: "Writer" }]);
    expect(transport.requestCalls[0]).toMatchObject({
      method: "GET",
      path: "/api/admin/ai/personas",
    });
  });

  it("GETs the tool catalog", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve([]));
    await client.listTools();
    expect(transport.requestCalls[0]).toMatchObject({
      method: "GET",
      path: "/api/admin/ai/tools",
    });
  });

  it("POSTs proactive tool advertisement", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve(undefined));
    await client.advertiseTools([{ name: "nav", description: "", parameters: {} }]);
    expect(transport.requestCalls[0]).toEqual({
      method: "POST",
      path: "/api/ai/tools/advertise",
      body: { tools: [{ name: "nav", description: "", parameters: {} }] },
    });
  });

  it("POSTs UI context snapshots on the context channel", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve(undefined));
    const snapshot = { focusStack: [], capturedAt: 0 };
    await client.syncContext(snapshot);
    expect(transport.requestCalls[0]).toEqual({
      method: "POST",
      path: "/api/ai/context",
      body: snapshot,
    });
  });
});

describe("AiClientService.withAuthRetry (one-shot)", () => {
  it("refreshes once and retries on 401", async () => {
    const { client, transport, auth } = makeClient();
    transport.queueRequest(() => Promise.reject(new AiAuthError("nope", 401)));
    transport.queueRequest(() => Promise.resolve([]));

    await client.listPersonas();

    expect(auth.refresh).toHaveBeenCalledOnce();
    expect(transport.requestCalls).toHaveLength(2);
  });

  it("surfaces a second consecutive 401 as AiAuthError", async () => {
    const { client, transport, auth } = makeClient();
    transport.queueRequest(() => Promise.reject(new AiAuthError("nope", 401)));
    transport.queueRequest(() => Promise.reject(new AiAuthError("still-nope", 401)));

    await expect(client.listPersonas()).rejects.toBeInstanceOf(AiAuthError);
    expect(auth.refresh).toHaveBeenCalledOnce();
  });

  it("does not touch refresh on a non-auth transport error", async () => {
    const { client, transport, auth } = makeClient();
    transport.queueRequest(() => Promise.reject(new AiTransportError("boom")));

    await expect(client.listPersonas()).rejects.toBeInstanceOf(AiTransportError);
    expect(auth.refresh).not.toHaveBeenCalled();
  });
});

describe("AiClientService speech helpers (Req 18)", () => {
  it("POSTs base64-encoded audio to /api/ai/transcribe", async () => {
    const { client, transport } = makeClient();
    transport.queueRequest(() => Promise.resolve({ text: "hello" }));
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const result = await client.transcribe(bytes);

    expect(result).toEqual({ text: "hello" });
    const call = transport.requestCalls[0]!;
    expect(call.method).toBe("POST");
    expect(call.path).toBe("/api/ai/transcribe");
    const body = call.body as { audio: string };
    expect(body.audio).toBe(base64Encode(bytes));
  });

  it("POSTs text to /api/ai/tts and returns decoded ArrayBuffer", async () => {
    const { client, transport } = makeClient();
    const original = new Uint8Array([9, 8, 7, 6, 5]);
    transport.queueRequest(() => Promise.resolve({ audio: base64Encode(original) }));

    const buffer = await client.synthesize("hello");
    const decoded = new Uint8Array(base64Decode(base64Encode(original)));
    expect(Array.from(new Uint8Array(buffer))).toEqual(Array.from(decoded));

    expect(transport.requestCalls[0]).toMatchObject({
      method: "POST",
      path: "/api/ai/tts",
      body: { text: "hello" },
    });
  });
});
