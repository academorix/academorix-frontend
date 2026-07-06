/**
 * @file integration-form.test.ts
 * @module modules/integrations/components/integration-form.test
 *
 * @description
 * Unit tests for the pure {@link toIntegrationPayload} builder: trimming of
 * `name`/`provider`/`category`, pass-through of `status` and the `is_enabled`
 * boolean, the empty `last_synced_at` -> `null` mapping, and the empty `note`
 * -> `null` coercion.
 */

import { describe, expect, it } from "vitest";

import type { IntegrationFormValues } from "@/modules/integrations/components/integration-form";

import { toIntegrationPayload } from "@/modules/integrations/components/integration-form";

const baseValues: IntegrationFormValues = {
  name: "  Stripe  ",
  provider: "  stripe  ",
  category: "  payments  ",
  status: "disconnected",
  is_enabled: false,
  last_synced_at: "",
  note: "",
};

describe("toIntegrationPayload", () => {
  it("trims the name, provider, and category", () => {
    const payload = toIntegrationPayload(baseValues);

    expect(payload.name).toBe("Stripe");
    expect(payload.provider).toBe("stripe");
    expect(payload.category).toBe("payments");
  });

  it("passes status and is_enabled through unchanged", () => {
    const payload = toIntegrationPayload({ ...baseValues, status: "connected", is_enabled: true });

    expect(payload.status).toBe("connected");
    expect(payload.is_enabled).toBe(true);
  });

  it("maps an empty last_synced_at to null and keeps a set one", () => {
    expect(toIntegrationPayload(baseValues).last_synced_at).toBeNull();
    expect(
      toIntegrationPayload({ ...baseValues, last_synced_at: "2025-01-02T03:04" }).last_synced_at,
    ).toBe("2025-01-02T03:04");
  });

  it("maps an empty note to null and trims a present one", () => {
    expect(toIntegrationPayload(baseValues).note).toBeNull();
    expect(toIntegrationPayload({ ...baseValues, note: "  synced  " }).note).toBe("synced");
  });
});
