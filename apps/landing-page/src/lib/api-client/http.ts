/**
 * @file http.ts
 * @module lib/api-client/http
 *
 * @description
 * Tiny fetch wrapper for the two public POST endpoints the marketing surface
 * calls from Client Components: `create-workspace` and `find-workspaces`.
 * Everything read-only lives in the Server-Component `lib/api/*` layer
 * (which reads from `public/data/*.json`); this file is exclusively for
 * browser-side writes.
 */

import { envConfig } from "@/config/env.config";

/** Foundation-style JSON envelope used by every Academorix API response. */
export interface FoundationEnvelope<T> {
  message?: string;
  status?: number;
  data: T;
}

/** A minimal typed API error. */
export class MarketingApiError extends Error {
  /** HTTP status code returned by the server (0 for transport failures). */
  readonly status: number;
  /** Optional field-level validation errors from Laravel. */
  readonly errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "MarketingApiError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * POSTs a JSON payload to the public backend under `/api`. Throws
 * {@link MarketingApiError} on non-2xx responses. Callers narrow on
 * `caught instanceof MarketingApiError` to surface field errors + message.
 *
 * @typeParam T - Expected `data` payload shape on success.
 * @param path - API path (relative to `/api`, e.g. `"/v1/auth/find-workspaces"`).
 * @param body - JSON body to send.
 */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${envConfig.backendUrl}/api${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(body),
  });

  const isJson = (response.headers.get("content-type") ?? "").includes("application/json");
  const raw: unknown = isJson ? await response.json() : null;

  if (!response.ok) {
    const envelope = raw as {
      message?: string;
      errors?: Record<string, string[]>;
    } | null;
    const message = envelope?.message ?? `Request failed with status ${response.status}.`;

    throw new MarketingApiError(message, response.status, envelope?.errors);
  }

  if (raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)) {
    return (raw as FoundationEnvelope<T>).data;
  }

  return raw as T;
}
