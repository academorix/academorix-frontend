/**
 * @file sse.transport.test.ts
 * @description Unit tests for {@link SseTransport} — verifies credential
 *   attachment (Req 25.1), state-machine transitions (Req 24.1), the
 *   `AiAuthError` mapping on 401/403 (Req 25.3), the `AiTransportError`
 *   fallback, and the SSE-frame-to-string re-serialization contract
 *   consumed by the `StreamDecoder`.
 */

import { describe, expect, it, vi } from "vitest";
import {
  AiConnectionState,
  type IAiChatRequest,
  type IAiCredentials,
  type IHttpClient,
  type IHttpManager,
  type IHttpStream,
  type ISseConfig,
  type ISseEvent,
} from "@stackra/contracts";

import { SseTransport } from "@/core/transport/sse.transport";
import { AiAuthError, AiTransportError } from "@/core/errors";

/** Build a canned `IHttpStream<ISseEvent<unknown>>` from an event array. */
function makeStream(
  events: ISseEvent<unknown>[],
  errorAfter?: number,
): IHttpStream<ISseEvent<unknown>> & { cancelled: boolean } {
  const state = { cancelled: false };
  const iterator: AsyncIterator<ISseEvent<unknown>> = {
    async next() {
      if (state.cancelled)
        return { value: undefined, done: true } as IteratorResult<ISseEvent<unknown>>;
      const value = events.shift();
      if (value === undefined)
        return { value: undefined, done: true } as IteratorResult<ISseEvent<unknown>>;
      if (errorAfter !== undefined && errorAfter-- === 0) throw new Error("transport went boom");
      return { value, done: false };
    },
  };
  return Object.assign(
    {
      [Symbol.asyncIterator]: () => iterator,
      cancel: () => {
        state.cancelled = true;
      },
    },
    state,
  );
}

/**
 * Build a mock http client whose `sse` call captures its config and yields
 * canned events. `error` (if set) causes iteration to throw.
 */
function makeClient(
  events: ISseEvent<unknown>[],
  opts: { error?: unknown } = {},
): { client: IHttpClient; last: { url?: string; config?: ISseConfig } } {
  const last: { url?: string; config?: ISseConfig } = {};
  const client: Partial<IHttpClient> = {
    sse: (url, config) => {
      last.url = url;
      last.config = config;
      if (opts.error) {
        return {
          [Symbol.asyncIterator]: (): AsyncIterator<ISseEvent<unknown>> => ({
            next: async () => {
              throw opts.error;
            },
          }),
          cancel: () => undefined,
        } as IHttpStream<ISseEvent<unknown>>;
      }
      return makeStream(events);
    },
    request: async () => ({
      data: "ok" as unknown,
      status: 200,
      statusText: "OK",
      headers: {},
    }),
  };
  return { client: client as IHttpClient, last };
}

/** Build a mock http manager that always returns the given client. */
function makeManager(client: IHttpClient): IHttpManager {
  return {
    connection: async () => client,
  } as unknown as IHttpManager;
}

/** Build a mock auth provider that returns the given credentials. */
function makeAuthProvider(creds: IAiCredentials): {
  getCredentials: () => Promise<IAiCredentials>;
  refresh: () => Promise<IAiCredentials>;
} {
  return {
    getCredentials: vi.fn(() => Promise.resolve(creds)),
    refresh: vi.fn(() => Promise.resolve(creds)),
  };
}

/** A minimal AI config satisfying the transport's needs. */
const baseConfig = {
  baseUrl: "https://api.example.com",
  authProvider: makeAuthProvider({}),
};

const chatReq = (): IAiChatRequest => ({
  persona: "writer",
  message: "hi",
});

describe("SseTransport", () => {
  it("starts in the Disconnected state", () => {
    const { client } = makeClient([]);
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));
    expect(transport.state).toBe(AiConnectionState.Disconnected);
  });

  it("transitions Disconnected → Connecting → Connected → Disconnected across a stream", async () => {
    const events = [
      { data: JSON.stringify({ type: "text-delta", id: "msg-1", delta: "Hi" }) },
      { data: "[DONE]" },
    ];
    const { client } = makeClient(events);
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    const seen: AiConnectionState[] = [];
    transport.onStateChange((s) => seen.push(s));

    const collected: string[] = [];
    for await (const frame of transport.stream(chatReq(), new AbortController().signal)) {
      collected.push(frame);
    }

    expect(seen).toEqual([
      AiConnectionState.Connecting,
      AiConnectionState.Connected,
      AiConnectionState.Disconnected,
    ]);
    expect(collected).toEqual([
      JSON.stringify({ type: "text-delta", id: "msg-1", delta: "Hi" }),
      "[DONE]",
    ]);
  });

  it("re-serializes object SSE `data` payloads so the decoder gets strings", async () => {
    // Simulate what the http SSE parser produces when parseJsonData is enabled:
    // an event whose `data` is already a JS object.
    const events = [{ data: { type: "finish", runId: "r1", reason: "stop" } }];
    const { client } = makeClient(events);
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    const collected: string[] = [];
    for await (const frame of transport.stream(chatReq(), new AbortController().signal)) {
      collected.push(frame);
    }

    expect(collected).toEqual([JSON.stringify({ type: "finish", runId: "r1", reason: "stop" })]);
  });

  it("attaches Bearer token and custom auth headers to the SSE request (Req 25.1)", async () => {
    const credentials: IAiCredentials = {
      token: "super-secret",
      headers: { "X-Tenant": "acme", "X-Role": "admin" },
    };
    const { client, last } = makeClient([]);
    const auth = makeAuthProvider(credentials);
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    // Iterate to completion — no events, will just open + close.
    for await (const _ of transport.stream(chatReq(), new AbortController().signal)) {
      /* drain */
    }

    expect(last.url).toBe("https://api.example.com/api/ai/chat/writer");
    expect(last.config?.method).toBe("POST");
    expect(last.config?.headers).toEqual({
      Authorization: "Bearer super-secret",
      "X-Tenant": "acme",
      "X-Role": "admin",
    });
    expect(auth.getCredentials).toHaveBeenCalledOnce();
  });

  it("sends the chat request as the POST body", async () => {
    const { client, last } = makeClient([]);
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    const req: IAiChatRequest = {
      persona: "analyst",
      threadId: "t1",
      message: "summarise Q1",
      tools: [],
    };

    for await (const _ of transport.stream(req, new AbortController().signal)) {
      /* drain */
    }

    expect(last.config?.data).toEqual(req);
  });

  it("URL-encodes the persona segment", async () => {
    const { client, last } = makeClient([]);
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    const req: IAiChatRequest = { persona: "weird/name with space", message: "." };
    for await (const _ of transport.stream(req, new AbortController().signal)) {
      /* drain */
    }

    expect(last.url).toBe(
      `https://api.example.com/api/ai/chat/${encodeURIComponent("weird/name with space")}`,
    );
  });

  it("strips a trailing slash from baseUrl", async () => {
    const { client, last } = makeClient([]);
    const auth = makeAuthProvider({});
    const transport = new SseTransport(
      { ...baseConfig, baseUrl: "https://api.example.com/" },
      auth,
      makeManager(client),
    );

    for await (const _ of transport.stream(chatReq(), new AbortController().signal)) {
      /* drain */
    }

    expect(last.url).toBe("https://api.example.com/api/ai/chat/writer");
  });

  it("throws AiAuthError on a 401 stream failure (Req 25.3)", async () => {
    const { client } = makeClient([], { error: { statusCode: 401, message: "nope" } });
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    await expect(async () => {
      for await (const _ of transport.stream(chatReq(), new AbortController().signal)) {
        /* drain */
      }
    }).rejects.toBeInstanceOf(AiAuthError);
    expect(transport.state).toBe(AiConnectionState.Error);
  });

  it("throws AiAuthError on a 403 stream failure", async () => {
    const { client } = makeClient([], { error: { statusCode: 403, message: "forbidden" } });
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    await expect(async () => {
      for await (const _ of transport.stream(chatReq(), new AbortController().signal)) {
        /* drain */
      }
    }).rejects.toBeInstanceOf(AiAuthError);
  });

  it("throws AiTransportError on a non-auth stream failure", async () => {
    const { client } = makeClient([], { error: new Error("connection reset") });
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    await expect(async () => {
      for await (const _ of transport.stream(chatReq(), new AbortController().signal)) {
        /* drain */
      }
    }).rejects.toBeInstanceOf(AiTransportError);
    expect(transport.state).toBe(AiConnectionState.Error);
  });

  it("onStateChange returns an unsubscribe function", async () => {
    const { client } = makeClient([]);
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    const listener = vi.fn();
    const unsubscribe = transport.onStateChange(listener);
    unsubscribe();

    for await (const _ of transport.stream(chatReq(), new AbortController().signal)) {
      /* drain */
    }

    expect(listener).not.toHaveBeenCalled();
  });

  it("performs one-shot request<T> with credentials and returns the response data", async () => {
    const client: IHttpClient = {
      request: vi.fn(async () => ({
        data: { runs: [] } as unknown,
        status: 200,
        statusText: "OK",
        headers: {},
      })),
      sse: vi.fn(),
    } as unknown as IHttpClient;
    const auth = makeAuthProvider({ token: "t", headers: { "X-A": "b" } });
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    const body = await transport.request<{ runs: unknown[] }>({
      method: "GET",
      path: "/api/admin/ai/personas",
    });

    expect(body).toEqual({ runs: [] });
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://api.example.com/api/admin/ai/personas",
        headers: expect.objectContaining({ Authorization: "Bearer t", "X-A": "b" }),
      }),
    );
  });

  it("surfaces AiAuthError on a 401 one-shot response", async () => {
    const client: IHttpClient = {
      request: vi.fn(async () => {
        throw { statusCode: 401, message: "unauth" };
      }),
      sse: vi.fn(),
    } as unknown as IHttpClient;
    const auth = makeAuthProvider({});
    const transport = new SseTransport(baseConfig, auth, makeManager(client));

    await expect(transport.request({ method: "POST", path: "/x" })).rejects.toBeInstanceOf(
      AiAuthError,
    );
  });
});
