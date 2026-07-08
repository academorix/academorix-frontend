/**
 * @file tenant-context.test.tsx
 * @module lib/tenancy/tenant-context.test
 *
 * @description
 * Integration tests for the tenant-branding side effects of the tenancy
 * provider — that a successful `/current-tenant` fetch paints the accent
 * variables to `<html>` and writes the payload to the localStorage cache
 * under the current hostname.
 *
 * The provider's host detection is stubbed via a module mock so the test
 * runs against a deterministic tenant surface without touching jsdom's
 * read-only `window.location`.
 */

import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HostContext } from "@/lib/http";
import type { TenantBranding } from "@/types";

/** Deterministic tenant host used by every case below. */
const TENANT_HOST: HostContext = {
  kind: "tenant",
  hostname: "riverside.academorix.com",
  tenantSlug: "riverside",
  apiOrigin: "https://riverside.api.academorix.com/api",
  isCentral: false,
  isLocalhost: false,
};

/**
 * Mock `@/lib/http` so `resolveHostContext()` yields the tenant surface
 * every test needs. We also re-export the real `ApiError` + `httpClient`
 * so the provider's error branch works without further stubbing.
 */
vi.mock("@/lib/http", async () => {
  const actual = await vi.importActual<typeof import("@/lib/http")>("@/lib/http");

  return {
    ...actual,
    resolveHostContext: () => TENANT_HOST,
  };
});

import type { ReactElement } from "react";

import { TenancyProvider, useTenancy } from "@/lib/tenancy/tenant-context";

/** Build a full tenant payload matching the backend's TenantData shape. */
function makeTenantPayload(
  overrides: {
    name?: string;
    branding?: TenantBranding | null;
  } = {},
): Record<string, unknown> {
  return {
    id: "t-1",
    name: overrides.name ?? "Riverside Academy",
    slug: "riverside",
    status: "active",
    status_label: "Active",
    business_type: "school",
    business_type_label: "School",
    purge_at: null,
    scheduled_for_deletion: false,
    created_at: null,
    updated_at: null,
    branding:
      overrides.branding === undefined
        ? {
            logo_url: null,
            favicon_url: null,
            primary_color: "#0d9488",
            secondary_color: null,
            accent_color: null,
            email_from_name: null,
            email_from_address: null,
            email_reply_to: null,
            custom_css: null,
          }
        : overrides.branding,
    settings: {
      locale: "en",
      timezone: "UTC",
      week_start: "monday",
      first_day_of_year: 1,
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A leaf component that reveals the resolved context state to the DOM. */
function TenantProbe(): ReactElement {
  const { tenant, isLoading, error, host } = useTenancy();

  return (
    <div>
      <span data-testid="host">{host.hostname}</span>
      <span data-testid="loading">{isLoading ? "yes" : "no"}</span>
      <span data-testid="tenant-name">{tenant?.name ?? ""}</span>
      <span data-testid="error">{error?.message ?? ""}</span>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("style");
  document.title = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute("style");
});

describe("TenancyProvider — branding side-effects", () => {
  it("paints CSS variables on <html> when the fetch resolves with branding", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(makeTenantPayload())),
    );

    const { getByTestId } = render(
      <TenancyProvider>
        <TenantProbe />
      </TenancyProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });

    expect(getByTestId("tenant-name").textContent).toBe("Riverside Academy");

    const root = document.documentElement;

    expect(root.style.getPropertyValue("--accent")).toMatch(/^oklch\(/);
    expect(root.style.getPropertyValue("--accent-foreground")).toMatch(/^oklch\(/);
  });

  it("writes the branding envelope to localStorage under the tenant hostname", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(makeTenantPayload())),
    );

    render(
      <TenancyProvider>
        <TenantProbe />
      </TenancyProvider>,
    );

    await waitFor(() => {
      const raw = window.localStorage.getItem(
        "academorix:tenant-branding:riverside.academorix.com",
      );

      expect(raw).not.toBeNull();

      const envelope = JSON.parse(raw ?? "{}") as {
        tenantName: string;
        branding: TenantBranding | null;
      };

      expect(envelope.tenantName).toBe("Riverside Academy");
      expect(envelope.branding?.primary_color).toBe("#0d9488");
    });
  });

  it("updates document.title to <name> · Academorix on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(makeTenantPayload())),
    );

    render(
      <TenancyProvider>
        <TenantProbe />
      </TenancyProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Riverside Academy · Academorix");
    });
  });

  it("does not paint or cache when the fetch resolves with a 404 (unknown tenant)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "not found" }, 404)),
    );

    render(
      <TenancyProvider>
        <TenantProbe />
      </TenancyProvider>,
    );

    await waitFor(() => {
      // No cache write on a 404.
      expect(
        window.localStorage.getItem("academorix:tenant-branding:riverside.academorix.com"),
      ).toBeNull();
    });

    // And no CSS variables on <html>.
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
  });

  it("caches the null-branding case when the tenant has no branding row", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(makeTenantPayload({ branding: null }))),
    );

    render(
      <TenancyProvider>
        <TenantProbe />
      </TenancyProvider>,
    );

    await waitFor(() => {
      const raw = window.localStorage.getItem(
        "academorix:tenant-branding:riverside.academorix.com",
      );

      expect(raw).not.toBeNull();

      const envelope = JSON.parse(raw ?? "{}") as { branding: TenantBranding | null };

      expect(envelope.branding).toBeNull();
    });
  });
});
