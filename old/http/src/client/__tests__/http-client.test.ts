/**
 * @file http-client.test.ts
 * @module @academorix/http/client/http-client.test
 *
 * @description
 * Unit tests for {@link HttpClient}. `fetch` is stubbed globally via
 * `vi.stubGlobal("fetch", vi.fn())` — every case reads the last call
 * to introspect the URL, method, headers, and body. The token store
 * is always constructed with `persist: false` so no Web Storage is
 * touched.
 *
 * The suite covers:
 * - Default and per-request headers (Accept, X-Api-Version, device
 *   headers, Authorization, Content-Type for JSON vs. FormData).
 * - URL + query-string building.
 * - Success body parsing (204, `content-length: 0`, JSON, non-JSON).
 * - Error normalisation (4xx, 5xx, 422 with Laravel errors, transport
 *   failures).
 * - The 401 → refresh → retry loop and its guards
 *   (`allowRefresh: false`, retry-once, missing coordinator, refresh
 *   returns `false`).
 * - AbortSignal forwarding and `getApiUrl` trailing-slash trimming.
 */

import { HttpError } from "@academorix/core/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TokenStore } from "../../tokens/token-store";
import { createHttpClient, HttpClient } from "../http-client";

import type { RefreshCoordinator } from "../../refresh/refresh-coordinator";
import type { RequestOptions } from "../http-client";
import type { Mock } from "vitest";

/** Builds a JSON `Response` with `content-type: application/json`. */
function jsonResponse(status: number, payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
}

/**
 * Extracts the last (url, init) pair passed to the stubbed `fetch`.
 * Casts through `unknown` because `Mock` isn't specialised on the
 * fetch signature.
 */
function lastFetchCall(): { url: string; init: RequestInit } {
  const mock = fetch as unknown as Mock;
  const call = mock.mock.calls.at(-1) as [string | URL | Request, RequestInit | undefined];

  return {
    url: typeof call[0] === "string" ? call[0] : String(call[0]),
    init: call[1] ?? {},
  };
}

/** Builds the standard client + token store used by most cases. */
function makeClient(
  overrides: Partial<{
    apiVersion: string;
    deviceHeaders: () => Record<string, string>;
    onUnauthorized: () => void;
  }> = {},
): { client: HttpClient; tokens: TokenStore } {
  const tokens = new TokenStore({ persist: false });
  const client = createHttpClient({
    baseUrl: "https://api.example.test",
    tokens,
    ...overrides,
  });

  return { client, tokens };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("default headers", () => {
  it("sends Accept, X-Requested-With, and X-Api-Version on GET requests", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await client.get("/v1/ping");

    const { url, init } = lastFetchCall();
    const headers = new Headers(init.headers);

    expect(init.method).toBe("GET");
    expect(url).toBe("https://api.example.test/v1/ping");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("X-Requested-With")).toBe("XMLHttpRequest");
    expect(headers.get("X-Api-Version")).toBe("1.0");
  });

  it("propagates a custom apiVersion into the X-Api-Version header", async () => {
    const { client } = makeClient({ apiVersion: "2.5" });

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    await client.get("/v1/ping");

    const headers = new Headers(lastFetchCall().init.headers);

    expect(headers.get("X-Api-Version")).toBe("2.5");
  });

  it("invokes the deviceHeaders reader and merges its values into the request", async () => {
    const deviceHeaders = vi.fn(() => ({
      "X-Client": "test-client/1.0",
      "X-Device-Id": "test-device-id",
    }));
    const { client } = makeClient({ deviceHeaders });

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    await client.get("/v1/ping");

    const headers = new Headers(lastFetchCall().init.headers);

    expect(deviceHeaders).toHaveBeenCalledTimes(1);
    expect(headers.get("X-Client")).toBe("test-client/1.0");
    expect(headers.get("X-Device-Id")).toBe("test-device-id");
  });

  it("attaches a Bearer Authorization header when the token store has a value", async () => {
    const { client, tokens } = makeClient();

    tokens.setToken("t-abc.def");
    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    await client.get("/v1/me");

    const headers = new Headers(lastFetchCall().init.headers);

    expect(headers.get("Authorization")).toBe("Bearer t-abc.def");
  });

  it("omits the Authorization header when the token store is empty", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    await client.get("/v1/public");

    const headers = new Headers(lastFetchCall().init.headers);

    expect(headers.get("Authorization")).toBeNull();
  });

  it("merges per-request headers over the defaults", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    await client.get("/v1/ping", {
      headers: { "X-Api-Version": "9.9", "X-Custom": "hello" },
    });

    const headers = new Headers(lastFetchCall().init.headers);

    // Per-request override wins.
    expect(headers.get("X-Api-Version")).toBe("9.9");
    expect(headers.get("X-Custom")).toBe("hello");
    // Defaults still present.
    expect(headers.get("Accept")).toBe("application/json");
  });
});

describe("body serialisation", () => {
  it("sends application/json + JSON.stringify(body) for POST with a plain object", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(201, { id: 1 }));

    await client.post("/v1/athletes", { name: "Jane" });

    const { init } = lastFetchCall();
    const headers = new Headers(init.headers);

    expect(init.method).toBe("POST");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ name: "Jane" }));
  });

  it("omits Content-Type and passes FormData through unchanged", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(201, {}));

    const form = new FormData();

    form.append("file", new Blob(["hi"]), "hi.txt");

    await client.post("/v1/uploads", form);

    const { init } = lastFetchCall();
    const headers = new Headers(init.headers);

    // Browser sets the multipart boundary via Content-Type when it serialises
    // the FormData; the client must not set it manually.
    expect(headers.get("Content-Type")).toBeNull();
    expect(init.body).toBe(form);
  });
});

describe("URL building", () => {
  it("appends non-empty searchParams as the query string", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    const searchParams = new URLSearchParams({ per_page: "25", page: "2" });

    await client.get("/v1/athletes", { searchParams });

    const { url } = lastFetchCall();

    expect(url).toContain("/v1/athletes?");
    expect(url).toContain("per_page=25");
    expect(url).toContain("page=2");
  });

  it("omits the '?' when searchParams is empty", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    await client.get("/v1/athletes", { searchParams: new URLSearchParams() });

    const { url } = lastFetchCall();

    expect(url).toBe("https://api.example.test/v1/athletes");
    expect(url).not.toContain("?");
  });
});

describe("response parsing", () => {
  it("returns undefined for a 204 No Content response", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(client.delete("/v1/athletes/1")).resolves.toBeUndefined();
  });

  it("returns undefined when content-length is 0", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(
      new Response("", { status: 200, headers: { "content-length": "0" } }),
    );

    await expect(client.get("/v1/empty")).resolves.toBeUndefined();
  });

  it("returns raw text when the response content-type is not JSON", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(
      new Response("hello world", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );

    await expect(client.get<string>("/v1/hello")).resolves.toBe("hello world");
  });

  it("returns the parsed JSON body on success", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(
      jsonResponse(200, { data: { id: 1, name: "Jane" } }),
    );

    const body = await client.get<{ data: { id: number; name: string } }>("/v1/athletes/1");

    expect(body).toEqual({ data: { id: 1, name: "Jane" } });
  });
});

describe("error normalisation", () => {
  it.each([400, 404, 500])("throws an HttpError with the correct status for %s", async (status) => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(status, { message: "boom" }));

    let caught: unknown;

    try {
      await client.get("/v1/broken");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect((caught as HttpError).statusCode).toBe(status);
    expect((caught as HttpError).message).toBe("boom");
  });

  it("lifts Laravel validation errors onto HttpError.errors for a 422 response", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockResolvedValueOnce(
      jsonResponse(422, {
        message: "Validation failed.",
        errors: {
          email: ["The email is required."],
          password: ["The password is too short."],
        },
      }),
    );

    let caught: unknown;

    try {
      await client.post("/v1/login", { email: "" });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect((caught as HttpError).statusCode).toBe(422);
    expect((caught as HttpError).errors).toEqual({
      email: ["The email is required."],
      password: ["The password is too short."],
    });
  });

  it("wraps a fetch rejection as an HttpError with undefined statusCode", async () => {
    const { client } = makeClient();

    (fetch as unknown as Mock).mockRejectedValueOnce(new Error("network down"));

    let caught: unknown;

    try {
      await client.get("/v1/offline");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect((caught as HttpError).statusCode).toBeUndefined();
    expect((caught as HttpError).message).toBe("network down");
  });
});

describe("401 handling", () => {
  it("clears the token and calls onUnauthorized when no refresh coordinator is attached", async () => {
    const onUnauthorized = vi.fn();
    const { client, tokens } = makeClient({ onUnauthorized });

    tokens.setToken("stale");
    (fetch as unknown as Mock).mockResolvedValueOnce(
      jsonResponse(401, { message: "Unauthenticated." }),
    );

    let caught: unknown;

    try {
      await client.get("/v1/me");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect((caught as HttpError).statusCode).toBe(401);
    expect(tokens.getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("clears the token when the refresh coordinator returns false", async () => {
    const onUnauthorized = vi.fn();
    const { client, tokens } = makeClient({ onUnauthorized });
    const refresh: RefreshCoordinator = { refresh: vi.fn().mockResolvedValue(false) };

    client.attachRefreshCoordinator(refresh);
    tokens.setToken("stale");

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(401, { message: "expired" }));

    let caught: unknown;

    try {
      await client.get("/v1/me");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect(refresh.refresh).toHaveBeenCalledTimes(1);
    expect(tokens.getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("retries the original request once when the refresh coordinator returns true", async () => {
    const { client, tokens } = makeClient();
    const refresh: RefreshCoordinator = {
      refresh: vi.fn().mockImplementation(async () => {
        tokens.setToken("fresh");

        return true;
      }),
    };

    client.attachRefreshCoordinator(refresh);
    tokens.setToken("stale");

    const fetchMock = fetch as unknown as Mock;

    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }));

    const body = await client.get<{ id: number }>("/v1/me");

    expect(body).toEqual({ id: 1 });
    expect(refresh.refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // The retry carried the refreshed bearer.
    const retryCall = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const retryHeaders = new Headers(retryCall[1].headers);

    expect(retryHeaders.get("Authorization")).toBe("Bearer fresh");
  });

  it("does NOT refresh a second time when the retried request also returns 401", async () => {
    const onUnauthorized = vi.fn();
    const { client, tokens } = makeClient({ onUnauthorized });
    const refresh: RefreshCoordinator = {
      refresh: vi.fn().mockImplementation(async () => {
        tokens.setToken("still-bad");

        return true;
      }),
    };

    client.attachRefreshCoordinator(refresh);
    tokens.setToken("stale");

    const fetchMock = fetch as unknown as Mock;

    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: "expired" }))
      .mockResolvedValueOnce(jsonResponse(401, { message: "still expired" }));

    let caught: unknown;

    try {
      await client.get("/v1/me");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect((caught as HttpError).statusCode).toBe(401);
    expect(refresh.refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tokens.getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("skips the refresh flow when allowRefresh is false", async () => {
    const { client, tokens } = makeClient();
    const refresh: RefreshCoordinator = { refresh: vi.fn().mockResolvedValue(true) };

    client.attachRefreshCoordinator(refresh);
    tokens.setToken("stale");

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(401, { message: "expired" }));

    // Cast through unknown so the private request signature is accessible.
    const options: RequestOptions = { method: "POST", allowRefresh: false };

    let caught: unknown;

    try {
      await client.request("/v1/auth/refresh", options);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect(refresh.refresh).not.toHaveBeenCalled();
    expect(tokens.getToken()).toBeNull();
  });
});

describe("AbortSignal", () => {
  it("forwards the caller's AbortSignal to fetch", async () => {
    const { client } = makeClient();
    const controller = new AbortController();

    (fetch as unknown as Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    await client.get("/v1/ping", { signal: controller.signal });

    const { init } = lastFetchCall();

    expect(init.signal).toBe(controller.signal);
  });
});

describe("getApiUrl", () => {
  it("returns the configured baseUrl with trailing slashes trimmed", () => {
    const tokens = new TokenStore({ persist: false });
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api/",
      tokens,
    });

    expect(client.getApiUrl()).toBe("https://api.example.test/api");
  });
});
