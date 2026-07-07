/**
 * @file create-refine-rest-data-provider.test.ts
 * @module @academorix/query/refine/__tests__/create-refine-rest-data-provider.test
 *
 * @description
 * Unit tests for {@link createRefineRestDataProvider}. The
 * {@link HttpClientLike} transport is stubbed with `vi.fn()`s so the
 * tests can:
 *
 *  1. Assert the exact path + query params + headers each Refine
 *     method emits.
 *  2. Return canned bodies (bare arrays, `{ data }` envelopes,
 *     `{ data, meta }` envelopes, `undefined` for 204) to exercise
 *     every unwrap branch.
 *
 * Every method reads two optional `meta` fields:
 *
 *  - `meta.headers` — forwarded on the outgoing request.
 *  - `meta.include` — appended to the query string via the Laravel
 *    query-builder serialiser.
 *
 * The tests cover both.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { serializeLaravelQuery } from "../../laravel/serialize-laravel-query.util";
import { createRefineRestDataProvider } from "../create-refine-rest-data-provider";

import type { HttpClientLike, HttpClientRequestOptions } from "../http-client.type";
import type { Mock } from "vitest";

/**
 * Structural stand-in for `HttpClient` — we only need the methods
 * `createRefineRestDataProvider` actually calls, all typed as
 * `Mock`s so the test suite can inspect their call histories.
 */
interface StubHttpClient {
  get: Mock;
  post: Mock;
  put: Mock;
  patch: Mock;
  delete: Mock;
  request: Mock;
  getApiUrl: Mock;
}

/**
 * Builds a fresh stub client with all methods returning `undefined`
 * by default. Individual tests override the specific method they
 * care about.
 */
function makeStubClient(baseUrl = "https://api.example.test"): StubHttpClient {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    patch: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    request: vi.fn().mockResolvedValue(undefined),
    getApiUrl: vi.fn().mockReturnValue(baseUrl),
  };
}

/**
 * Casts the stub into the shape `createRefineRestDataProvider`
 * expects. The cast is safe because the provider only calls the
 * subset of `HttpClient` mirrored in {@link StubHttpClient}.
 */
function asClient(stub: StubHttpClient): HttpClientLike {
  return stub as unknown as HttpClientLike;
}

describe("createRefineRestDataProvider", () => {
  let stub: StubHttpClient;

  beforeEach(() => {
    stub = makeStubClient();
  });

  describe("getApiUrl", () => {
    it("returns the versioned URL (baseUrl + apiPrefix)", () => {
      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });

      expect(provider.getApiUrl()).toBe("https://api.example.test/v1");
    });

    it("falls back to the default `/api/v1` prefix", () => {
      const provider = createRefineRestDataProvider(asClient(stub));

      expect(provider.getApiUrl()).toBe("https://api.example.test/api/v1");
    });
  });

  describe("getList", () => {
    it("unwraps a full { data, meta: { total } } envelope", async () => {
      stub.get.mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }],
        meta: { total: 42 },
      });

      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });
      const result = await provider.getList({ resource: "students" });

      expect(result).toEqual({
        data: [{ id: 1 }, { id: 2 }],
        total: 42,
      });
    });

    it("falls back to `data.length` when the envelope has no meta.total", async () => {
      stub.get.mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] });

      const provider = createRefineRestDataProvider(asClient(stub));
      const result = await provider.getList({ resource: "students" });

      expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }, { id: 3 }], total: 3 });
    });

    it("accepts a bare array (non-paginated endpoint) and reports total = array length", async () => {
      stub.get.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);

      const provider = createRefineRestDataProvider(asClient(stub));
      const result = await provider.getList({ resource: "regions" });

      expect(result).toEqual({ data: [{ id: "a" }, { id: "b" }], total: 2 });
    });

    it("emits the exact search params the Laravel serialiser produces", async () => {
      stub.get.mockResolvedValueOnce({ data: [], meta: { total: 0 } });

      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });

      await provider.getList({
        resource: "students",
        pagination: { currentPage: 2, pageSize: 25 },
        sorters: [{ field: "created_at", order: "desc" }],
        filters: [{ field: "status", operator: "eq", value: "active" }],
        meta: { include: ["branch"] },
      });

      const expectedParams = serializeLaravelQuery({
        pagination: { currentPage: 2, pageSize: 25 },
        sorters: [{ field: "created_at", order: "desc" }],
        filters: [{ field: "status", operator: "eq", value: "active" }],
        include: ["branch"],
      });

      expect(stub.get).toHaveBeenCalledTimes(1);

      const [path, requestOptions] = stub.get.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(path).toBe("/v1/students");
      expect(requestOptions.searchParams?.toString()).toBe(expectedParams.toString());
    });

    it("forwards meta.headers", async () => {
      stub.get.mockResolvedValueOnce({ data: [], meta: { total: 0 } });

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.getList({
        resource: "students",
        meta: { headers: { "X-Trace": "abc-123" } },
      });

      const [, requestOptions] = stub.get.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(requestOptions.headers).toEqual({ "X-Trace": "abc-123" });
    });

    it("skips meta.include when it isn't an array", async () => {
      stub.get.mockResolvedValueOnce({ data: [], meta: { total: 0 } });

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.getList({
        resource: "students",
        // Deliberately violate the type — the provider must fall back
        // to `undefined` rather than crash on a bad meta.
        meta: { include: "branch" as unknown as readonly string[] },
      });

      const [, requestOptions] = stub.get.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(requestOptions.searchParams?.toString()).toBe("");
    });
  });

  describe("getOne", () => {
    it("unwraps a { data } envelope", async () => {
      stub.get.mockResolvedValueOnce({ data: { id: 42, name: "Ada" } });

      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });
      const result = await provider.getOne({ resource: "students", id: 42 });

      expect(result).toEqual({ data: { id: 42, name: "Ada" } });
      expect(stub.get).toHaveBeenCalledWith(
        "/v1/students/42",
        expect.objectContaining({ headers: undefined }),
      );
    });

    it("accepts a bare object (no envelope)", async () => {
      stub.get.mockResolvedValueOnce({ id: 42, name: "Ada" });

      const provider = createRefineRestDataProvider(asClient(stub));
      const result = await provider.getOne({ resource: "students", id: 42 });

      expect(result).toEqual({ data: { id: 42, name: "Ada" } });
    });

    it("encodes the id so slashes / special characters don't corrupt the path", async () => {
      stub.get.mockResolvedValueOnce({ data: { id: "org/1" } });

      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });

      await provider.getOne({ resource: "students", id: "org/1" });

      const [path] = stub.get.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(path).toBe("/v1/students/org%2F1");
    });

    it("forwards meta.headers", async () => {
      stub.get.mockResolvedValueOnce({ data: { id: 1 } });

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.getOne({
        resource: "students",
        id: 1,
        meta: { headers: { Authorization: "Bearer abc" } },
      });

      const [, requestOptions] = stub.get.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(requestOptions.headers).toEqual({ Authorization: "Bearer abc" });
    });
  });

  describe("getMany", () => {
    it("builds filter[id][in]=… and per_page = ids.length", async () => {
      stub.get.mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] });

      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });
      const result = await provider.getMany?.({ resource: "students", ids: [1, 2, 3] });

      expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] });

      const [path, requestOptions] = stub.get.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(path).toBe("/v1/students");
      expect(requestOptions.searchParams?.get("filter[id][in]")).toBe("1,2,3");
      expect(requestOptions.searchParams?.get("per_page")).toBe("3");
    });

    it("passes per_page=1 rather than 0 when ids is empty (avoids Laravel div-by-zero on the paginator)", async () => {
      stub.get.mockResolvedValueOnce({ data: [] });

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.getMany?.({ resource: "students", ids: [] });

      const [, requestOptions] = stub.get.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(requestOptions.searchParams?.get("per_page")).toBe("1");
    });

    it("accepts a bare array response", async () => {
      stub.get.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

      const provider = createRefineRestDataProvider(asClient(stub));
      const result = await provider.getMany?.({ resource: "students", ids: [1, 2] });

      expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }] });
    });

    it("forwards meta.headers", async () => {
      stub.get.mockResolvedValueOnce({ data: [] });

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.getMany?.({
        resource: "students",
        ids: [1],
        meta: { headers: { "X-Tenant": "riverside" } },
      });

      const [, requestOptions] = stub.get.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(requestOptions.headers).toEqual({ "X-Tenant": "riverside" });
    });
  });

  describe("create", () => {
    it("POSTs the variables and unwraps a { data } envelope", async () => {
      stub.post.mockResolvedValueOnce({ data: { id: 1, name: "Ada" } });

      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });
      const result = await provider.create({
        resource: "students",
        variables: { name: "Ada" },
      });

      expect(result).toEqual({ data: { id: 1, name: "Ada" } });
      expect(stub.post).toHaveBeenCalledWith(
        "/v1/students",
        { name: "Ada" },
        expect.objectContaining({ headers: undefined }),
      );
    });

    it("accepts a bare object response", async () => {
      stub.post.mockResolvedValueOnce({ id: 1, name: "Ada" });

      const provider = createRefineRestDataProvider(asClient(stub));
      const result = await provider.create({ resource: "students", variables: { name: "Ada" } });

      expect(result).toEqual({ data: { id: 1, name: "Ada" } });
    });

    it("forwards meta.headers", async () => {
      stub.post.mockResolvedValueOnce({ data: { id: 1 } });

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.create({
        resource: "students",
        variables: { name: "Ada" },
        meta: { headers: { "Idempotency-Key": "k-1" } },
      });

      const [, , requestOptions] = stub.post.mock.calls[0] as [
        string,
        unknown,
        HttpClientRequestOptions,
      ];

      expect(requestOptions.headers).toEqual({ "Idempotency-Key": "k-1" });
    });
  });

  describe("update", () => {
    it("PUTs the variables and unwraps a { data } envelope", async () => {
      stub.put.mockResolvedValueOnce({ data: { id: 1, name: "Ada Lovelace" } });

      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });
      const result = await provider.update({
        resource: "students",
        id: 1,
        variables: { name: "Ada Lovelace" },
      });

      expect(result).toEqual({ data: { id: 1, name: "Ada Lovelace" } });
      expect(stub.put).toHaveBeenCalledWith(
        "/v1/students/1",
        { name: "Ada Lovelace" },
        expect.objectContaining({ headers: undefined }),
      );
    });

    it("accepts a bare object response", async () => {
      stub.put.mockResolvedValueOnce({ id: 1, name: "Ada" });

      const provider = createRefineRestDataProvider(asClient(stub));
      const result = await provider.update({
        resource: "students",
        id: 1,
        variables: { name: "Ada" },
      });

      expect(result).toEqual({ data: { id: 1, name: "Ada" } });
    });

    it("forwards meta.headers", async () => {
      stub.put.mockResolvedValueOnce({ data: { id: 1 } });

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.update({
        resource: "students",
        id: 1,
        variables: { name: "Ada" },
        meta: { headers: { "If-Match": "abc" } },
      });

      const [, , requestOptions] = stub.put.mock.calls[0] as [
        string,
        unknown,
        HttpClientRequestOptions,
      ];

      expect(requestOptions.headers).toEqual({ "If-Match": "abc" });
    });
  });

  describe("deleteOne", () => {
    it("DELETEs by id and tolerates a 204 (undefined) body", async () => {
      stub.delete.mockResolvedValueOnce(undefined);

      const provider = createRefineRestDataProvider(asClient(stub), { apiPrefix: "/v1" });
      const result = await provider.deleteOne({ resource: "students", id: 1 });

      expect(result).toEqual({ data: undefined });
      expect(stub.delete).toHaveBeenCalledWith(
        "/v1/students/1",
        expect.objectContaining({ headers: undefined }),
      );
    });

    it("unwraps a { data } envelope when the backend returns the deleted record", async () => {
      stub.delete.mockResolvedValueOnce({ data: { id: 1, name: "Ada" } });

      const provider = createRefineRestDataProvider(asClient(stub));
      const result = await provider.deleteOne({ resource: "students", id: 1 });

      expect(result).toEqual({ data: { id: 1, name: "Ada" } });
    });

    it("forwards meta.headers", async () => {
      stub.delete.mockResolvedValueOnce(undefined);

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.deleteOne({
        resource: "students",
        id: 1,
        meta: { headers: { "X-Confirm": "yes" } },
      });

      const [, requestOptions] = stub.delete.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(requestOptions.headers).toEqual({ "X-Confirm": "yes" });
    });
  });

  describe("custom", () => {
    it("forwards method, url, body, headers and merges query over filter/sorter params", async () => {
      stub.request.mockResolvedValueOnce({ ok: true });

      const provider = createRefineRestDataProvider(asClient(stub));
      const result = await provider.custom?.({
        url: "/rpc/aggregate",
        method: "post",
        payload: { window: "7d" },
        query: { format: "json", per_page: "999" },
        filters: [{ field: "status", operator: "eq", value: "active" }],
        sorters: [{ field: "created_at", order: "desc" }],
        headers: { "X-Trace": "abc" },
      });

      expect(result).toEqual({ data: { ok: true } });
      expect(stub.request).toHaveBeenCalledTimes(1);

      const [url, requestOptions] = stub.request.mock.calls[0] as [
        string,
        HttpClientRequestOptions,
      ];

      expect(url).toBe("/rpc/aggregate");
      expect(requestOptions.method).toBe("POST");
      expect(requestOptions.body).toEqual({ window: "7d" });
      expect(requestOptions.headers).toEqual({ "X-Trace": "abc" });

      // Filter + sort came from the filters/sorters clauses…
      expect(requestOptions.searchParams?.get("filter[status]")).toBe("active");
      expect(requestOptions.searchParams?.get("sort")).toBe("-created_at");

      // …and the explicit `query` record layers on top.
      expect(requestOptions.searchParams?.get("format")).toBe("json");
      expect(requestOptions.searchParams?.get("per_page")).toBe("999");
    });

    it("lets query override filter-derived params (query wins)", async () => {
      stub.request.mockResolvedValueOnce({});

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.custom?.({
        url: "/rpc/aggregate",
        method: "get",
        filters: [{ field: "status", operator: "eq", value: "active" }],
        query: { "filter[status]": "archived" },
      });

      const [, requestOptions] = stub.request.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(requestOptions.searchParams?.get("filter[status]")).toBe("archived");
    });

    it("uppercases HTTP methods (Refine emits lowercase, HttpClient expects uppercase)", async () => {
      stub.request.mockResolvedValueOnce({});

      const provider = createRefineRestDataProvider(asClient(stub));

      await provider.custom?.({ url: "/rpc/foo", method: "put" });

      const [, requestOptions] = stub.request.mock.calls[0] as [string, HttpClientRequestOptions];

      expect(requestOptions.method).toBe("PUT");
    });
  });
});
