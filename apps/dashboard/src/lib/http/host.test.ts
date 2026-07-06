/**
 * @file host.test.ts
 * @module lib/http/host.test
 *
 * @description
 * Unit tests for the host-context resolver: the SPA boots on one of three
 * host kinds (central / central-admin / tenant), plus a dev-mode localhost
 * fallback, and derives an `apiOrigin` + `tenantSlug` from `window.location`.
 * The resolver caches its answer in module scope, so every case restores the
 * default jsdom `window.location` (`http://localhost:3000/`) in `afterEach`
 * and calls {@link __resetHostContextForTests} before + after each case so
 * one test's cache never leaks into the next.
 *
 * The defaults from `apps/web/environments/.env` used below:
 *   - `VITE_CENTRAL_HOST=academorix.app`
 *   - `VITE_PLATFORM_ADMIN_HOST=admin.academorix.app`
 *   - `VITE_API_URL=http://localhost:8000`
 *   - `VITE_API_PATH=/api`
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  __resetHostContextForTests,
  buildCentralUrl,
  buildTenantUrl,
  resolveHostContext,
} from "@/lib/http/host";

/** Shape used by {@link stubLocation} to swap `window.location` per test. */
interface LocationStub {
  hostname: string;
  protocol?: string;
  port?: string;
  origin?: string;
}

/** The `Location` descriptor captured before the first stub so we can restore it. */
const originalLocation = Object.getOwnPropertyDescriptor(window, "location");

/**
 * Replaces `window.location` with a stub sufficient for {@link resolveHostContext},
 * {@link buildTenantUrl}, and {@link buildCentralUrl}. Called from `beforeEach`
 * or inside a single test; the accompanying `afterEach` reinstates the
 * original descriptor.
 */
function stubLocation({ hostname, protocol = "https:", port = "", origin }: LocationStub): void {
  const resolvedOrigin = origin ?? `${protocol}//${hostname}${port ? `:${port}` : ""}`;

  Object.defineProperty(window, "location", {
    configurable: true,
    value: { hostname, protocol, port, origin: resolvedOrigin },
  });
}

beforeEach(() => {
  __resetHostContextForTests();
});

afterEach(() => {
  __resetHostContextForTests();

  if (originalLocation) {
    Object.defineProperty(window, "location", originalLocation);
  }
});

describe("resolveHostContext", () => {
  it("recognises the bare central host", () => {
    stubLocation({ hostname: "academorix.app" });

    const context = resolveHostContext();

    expect(context.kind).toBe("central");
    expect(context.isCentral).toBe(true);
    expect(context.isLocalhost).toBe(false);
    expect(context.tenantSlug).toBeNull();
  });

  it("recognises the www-prefixed central host as central", () => {
    stubLocation({ hostname: "www.academorix.app" });

    const context = resolveHostContext();

    expect(context.kind).toBe("central");
    expect(context.tenantSlug).toBeNull();
  });

  it("recognises the platform admin host", () => {
    stubLocation({ hostname: "admin.academorix.app" });

    const context = resolveHostContext();

    expect(context.kind).toBe("central-admin");
    expect(context.isCentral).toBe(true);
    expect(context.tenantSlug).toBeNull();
  });

  it("recognises a tenant subdomain and extracts its slug", () => {
    stubLocation({ hostname: "riverside.academorix.app" });

    const context = resolveHostContext();

    expect(context.kind).toBe("tenant");
    expect(context.tenantSlug).toBe("riverside");
    expect(context.isCentral).toBe(false);
    expect(context.isLocalhost).toBe(false);
  });

  it("never resolves the 'www' subdomain to a tenant", () => {
    // `www.academorix.app` is already covered above as central; this asserts
    // that the reserved-slug guard leaves `tenantSlug` null even if a caller
    // classified it as a tenant.
    stubLocation({ hostname: "www.academorix.app" });

    expect(resolveHostContext().tenantSlug).toBeNull();
  });

  it("never resolves the 'api' subdomain to a tenant", () => {
    stubLocation({ hostname: "api.academorix.app" });

    // `api` falls through to the tenant branch but the slug guard rejects it.
    expect(resolveHostContext().tenantSlug).toBeNull();
  });

  it("flags localhost as tenant + isLocalhost:true", () => {
    stubLocation({ hostname: "localhost", protocol: "http:", port: "3000" });

    const context = resolveHostContext();

    expect(context.kind).toBe("tenant");
    expect(context.isLocalhost).toBe(true);
    expect(context.tenantSlug).toBeNull();
  });

  it("flags 127.0.0.1 as tenant + isLocalhost:true", () => {
    stubLocation({ hostname: "127.0.0.1", protocol: "http:", port: "3000" });

    const context = resolveHostContext();

    expect(context.kind).toBe("tenant");
    expect(context.isLocalhost).toBe(true);
  });

  it("treats a custom domain as a tenant host with a null slug", () => {
    stubLocation({ hostname: "academy.example.com" });

    const context = resolveHostContext();

    expect(context.kind).toBe("tenant");
    expect(context.tenantSlug).toBeNull();
  });

  it("uses same-origin + /api for production hosts", () => {
    stubLocation({ hostname: "riverside.academorix.app" });

    expect(resolveHostContext().apiOrigin).toBe("https://riverside.academorix.app/api");
  });

  it("uses VITE_API_URL + /api on localhost (dev fallback)", () => {
    stubLocation({ hostname: "localhost", protocol: "http:", port: "3000" });

    // `VITE_API_URL` defaults to http://localhost:8000 (see environments/.env).
    expect(resolveHostContext().apiOrigin).toBe("http://localhost:8000/api");
  });

  it("caches the resolved context across calls", () => {
    stubLocation({ hostname: "riverside.academorix.app" });

    const first = resolveHostContext();
    const second = resolveHostContext();

    expect(second).toBe(first);
  });
});

describe("buildTenantUrl", () => {
  it("builds an https tenant URL preserving path", () => {
    stubLocation({ hostname: "academorix.app", protocol: "https:", port: "" });

    expect(buildTenantUrl("river", "/dashboard")).toBe("https://river.academorix.app/dashboard");
  });

  it("preserves the current protocol and port for dev", () => {
    stubLocation({ hostname: "academorix.app", protocol: "http:", port: "3000" });

    expect(buildTenantUrl("river", "/dashboard")).toBe(
      "http://river.academorix.app:3000/dashboard",
    );
  });

  it("defaults to '/' when the pathname is omitted", () => {
    stubLocation({ hostname: "academorix.app", protocol: "https:", port: "" });

    expect(buildTenantUrl("river")).toBe("https://river.academorix.app/");
  });
});

describe("buildCentralUrl", () => {
  it("builds an https central URL preserving path", () => {
    stubLocation({ hostname: "riverside.academorix.app", protocol: "https:", port: "" });

    expect(buildCentralUrl("/pick")).toBe("https://academorix.app/pick");
  });

  it("preserves the current protocol and port for dev", () => {
    stubLocation({ hostname: "localhost", protocol: "http:", port: "3000" });

    expect(buildCentralUrl("/pick")).toBe("http://academorix.app:3000/pick");
  });

  it("defaults to '/' when the pathname is omitted", () => {
    stubLocation({ hostname: "riverside.academorix.app", protocol: "https:", port: "" });

    expect(buildCentralUrl()).toBe("https://academorix.app/");
  });
});
