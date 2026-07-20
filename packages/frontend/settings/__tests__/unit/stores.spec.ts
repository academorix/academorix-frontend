/**
 * @file stores.spec.ts
 * @description Unit tests for the built-in settings stores.
 *
 *   `MemorySettingsStore` is sync + trivial. `StorageSettingsStore`
 *   is tested against a fake `IStorage`. `ApiSettingsStore` is
 *   tested against a fake HTTP client and verifies the fallback
 *   path fires on network failure.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { IHttpClient, IHttpManager, IStorage } from "@stackra/contracts";

import { ApiSettingsStore, MemorySettingsStore, StorageSettingsStore } from "@/core";

describe("MemorySettingsStore", () => {
  it("round-trips values in memory", async () => {
    const store = new MemorySettingsStore();
    store.save("display", { compact: true });
    expect(store.load("display")).toEqual({ compact: true });
    store.clear("display");
    expect(store.load("display")).toEqual({});
  });
});

describe("StorageSettingsStore", () => {
  function createFakeStorage(): IStorage & { data: Map<string, unknown> } {
    const data = new Map<string, unknown>();
    return {
      data,
      async get<T>(key: string): Promise<T | null> {
        return data.has(key) ? (data.get(key) as T) : null;
      },
      async set<T>(key: string, value: T): Promise<void> {
        data.set(key, value);
      },
      async delete(key: string): Promise<void> {
        data.delete(key);
      },
      async clear(): Promise<void> {
        data.clear();
      },
      async has(key: string): Promise<boolean> {
        return data.has(key);
      },
      async keys(): Promise<string[]> {
        return Array.from(data.keys());
      },
    };
  }

  it("reads and writes through the underlying IStorage", async () => {
    const backing = createFakeStorage();
    const store = new StorageSettingsStore({ storage: backing, prefix: "settings" });
    await store.save("display", { theme: "dark" });
    expect(backing.data.get("settings:display")).toEqual({ theme: "dark" });
    const values = await store.load("display");
    expect(values).toEqual({ theme: "dark" });
    await store.clear("display");
    expect(backing.data.has("settings:display")).toBe(false);
  });

  it("normalises the prefix trailing colon", async () => {
    const backing = createFakeStorage();
    const store = new StorageSettingsStore({ storage: backing, prefix: "settings:" });
    await store.save("a", {});
    expect(Array.from(backing.data.keys())).toEqual(["settings:a"]);
  });
});

describe("ApiSettingsStore", () => {
  function createFakeClient(): IHttpClient & {
    calls: Array<{ method: string; url: string }>;
    shouldFail: boolean;
  } {
    const calls: Array<{ method: string; url: string }> = [];
    const client = {
      calls,
      shouldFail: false,
      async get(url: string) {
        calls.push({ method: "GET", url });
        if (this.shouldFail) throw new Error("network down");
        return { data: { fromApi: true }, status: 200, statusText: "OK", headers: {} };
      },
      async put(url: string) {
        calls.push({ method: "PUT", url });
        if (this.shouldFail) throw new Error("network down");
        return { data: null, status: 204, statusText: "No Content", headers: {} };
      },
      async delete(url: string) {
        calls.push({ method: "DELETE", url });
        if (this.shouldFail) throw new Error("network down");
        return { data: null, status: 204, statusText: "No Content", headers: {} };
      },
      async post() {
        return { data: null, status: 204, statusText: "No Content", headers: {} };
      },
      async patch() {
        return { data: null, status: 204, statusText: "No Content", headers: {} };
      },
      async request() {
        return { data: null, status: 204, statusText: "No Content", headers: {} };
      },
      stream() {
        throw new Error("not implemented");
      },
      sse() {
        throw new Error("not implemented");
      },
    } as unknown as IHttpClient & {
      calls: Array<{ method: string; url: string }>;
      shouldFail: boolean;
    };
    return client;
  }

  function createFakeManager(client: IHttpClient): IHttpManager {
    return {
      async connection() {
        return client;
      },
    } as unknown as IHttpManager;
  }

  let client: ReturnType<typeof createFakeClient>;

  beforeEach(() => {
    client = createFakeClient();
  });

  it("loads via GET", async () => {
    const store = new ApiSettingsStore({
      httpManager: createFakeManager(client),
      retry: { attempts: 1 },
    });
    const values = await store.load("display");
    expect(values).toEqual({ fromApi: true });
    expect(client.calls[0]?.url).toContain("/settings/display");
  });

  it("saves via PUT", async () => {
    const store = new ApiSettingsStore({
      httpManager: createFakeManager(client),
      retry: { attempts: 1 },
    });
    await store.save("display", { theme: "dark" });
    expect(client.calls[0]?.method).toBe("PUT");
  });

  it("falls back to the fallback store on network failure", async () => {
    const fallback = new MemorySettingsStore();
    fallback.save("display", { theme: "cached" });

    client.shouldFail = true;
    const store = new ApiSettingsStore({
      httpManager: createFakeManager(client),
      retry: { attempts: 1 },
      fallback,
    });
    const values = await store.load("display");
    expect(values).toEqual({ theme: "cached" });
  });

  it("returns an empty object when no fallback is available and API fails", async () => {
    client.shouldFail = true;
    const store = new ApiSettingsStore({
      httpManager: createFakeManager(client),
      retry: { attempts: 1 },
    });
    const values = await store.load("display");
    expect(values).toEqual({});
  });

  it("loadAll accepts a flat-map payload and returns one call per group", async () => {
    // Override the fake's response to be a listGroups shape.
    const bulkClient = createFakeClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (bulkClient as any).get = async (url: string) => {
      bulkClient.calls.push({ method: "GET", url });
      return {
        data: {
          display: { compact: true },
          notifications: { emailEnabled: false },
        },
        status: 200,
        statusText: "OK",
        headers: {},
      };
    };

    const store = new ApiSettingsStore({
      httpManager: createFakeManager(bulkClient),
      retry: { attempts: 1 },
    });

    const groups = await store.loadAll();
    expect(bulkClient.calls.length).toBe(1);
    expect(bulkClient.calls[0]?.url).toContain("/settings");
    expect(groups).toEqual({
      display: { compact: true },
      notifications: { emailEnabled: false },
    });
  });

  it("loadAll unwraps the { data: { ... } } Laravel-resource envelope", async () => {
    const wrappedClient = createFakeClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrappedClient as any).get = async () => ({
      data: {
        data: {
          display: { theme: "dark" },
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
    });

    const store = new ApiSettingsStore({
      httpManager: createFakeManager(wrappedClient),
      retry: { attempts: 1 },
    });

    const groups = await store.loadAll();
    expect(groups).toEqual({ display: { theme: "dark" } });
  });

  it("loadAll accepts an array-of-envelopes shape", async () => {
    const arrayClient = createFakeClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (arrayClient as any).get = async () => ({
      data: [
        { group: "display", values: { compact: true } },
        { group: "notifications", values: { emailEnabled: false } },
      ],
      status: 200,
      statusText: "OK",
      headers: {},
    });

    const store = new ApiSettingsStore({
      httpManager: createFakeManager(arrayClient),
      retry: { attempts: 1 },
    });

    const groups = await store.loadAll();
    expect(groups).toEqual({
      display: { compact: true },
      notifications: { emailEnabled: false },
    });
  });

  it("loadAll falls back to the fallback store loadAll on API failure", async () => {
    const fallback = new MemorySettingsStore();
    fallback.save("display", { theme: "cached" });

    client.shouldFail = true;
    const store = new ApiSettingsStore({
      httpManager: createFakeManager(client),
      retry: { attempts: 1 },
      fallback,
    });

    const groups = await store.loadAll();
    expect(groups).toEqual({ display: { theme: "cached" } });
  });
});

describe("MemorySettingsStore.loadAll", () => {
  it("returns every saved group as a flat map", async () => {
    const store = new MemorySettingsStore();
    store.save("display", { compact: true });
    store.save("notifications", { emailEnabled: false });
    const groups = await store.loadAll();
    expect(groups).toEqual({
      display: { compact: true },
      notifications: { emailEnabled: false },
    });
  });
});

describe("StorageSettingsStore.loadAll", () => {
  function createFakeStorage(): IStorage & { data: Map<string, unknown> } {
    const data = new Map<string, unknown>();
    return {
      data,
      async get<T>(key: string): Promise<T | null> {
        return data.has(key) ? (data.get(key) as T) : null;
      },
      async set<T>(key: string, value: T): Promise<void> {
        data.set(key, value);
      },
      async delete(key: string): Promise<void> {
        data.delete(key);
      },
      async clear(): Promise<void> {
        data.clear();
      },
      async has(key: string): Promise<boolean> {
        return data.has(key);
      },
      async keys(): Promise<string[]> {
        return Array.from(data.keys());
      },
    };
  }

  it("walks keys under the configured prefix and returns every group", async () => {
    const backing = createFakeStorage();
    const store = new StorageSettingsStore({ storage: backing, prefix: "settings" });
    await store.save("display", { compact: true });
    await store.save("notifications", { emailEnabled: false });
    // A key under a different prefix — must be ignored.
    backing.data.set("unrelated:foo", { hello: "world" });

    const groups = await store.loadAll();
    expect(groups).toEqual({
      display: { compact: true },
      notifications: { emailEnabled: false },
    });
  });
});
