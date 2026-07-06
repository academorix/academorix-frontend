/**
 * @file client.ts
 * @module lib/api/client
 *
 * @description
 * The **typed** API client, built on `openapi-fetch`. Where {@link HttpClient}
 * is a generic, dynamic-path fetch wrapper the data providers use for
 * arbitrary resources, this client is the future home of fully-typed one-off
 * calls (custom endpoints, RPC-style actions) once the OpenAPI spec is
 * generated into {@link paths}.
 *
 * Both clients read from the same {@link tokenStore}, so authentication stays
 * consistent no matter which one issues a request.
 *
 * @example Post-codegen usage (fully type-checked path, params, and response):
 * ```ts
 * const { data, error } = await apiClient.GET("/api/v1/students/{id}", {
 *   params: { path: { id } },
 * });
 * ```
 */

import createClient from "openapi-fetch";

import type { paths } from "@/lib/api/schema";
import type { Middleware } from "openapi-fetch";

import { envConfig } from "@/config/env.config";
import { tokenStore } from "@/lib/http/token-store";

/**
 * Middleware that attaches the bearer token and JSON headers to every request.
 * Mirrors {@link HttpClient}'s header logic so the two clients behave the same.
 */
const authMiddleware: Middleware = {
  onRequest({ request }) {
    request.headers.set("Accept", "application/json");
    request.headers.set("X-Requested-With", "XMLHttpRequest");

    const token = tokenStore.getToken();

    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }

    return request;
  },
};

/**
 * Typed API client for the Academorix REST API.
 *
 * Currently unlocks no typed routes because {@link paths} is an empty stub;
 * after `pnpm codegen` populates the schema, every `GET`/`POST`/… call becomes
 * path- and payload-checked at compile time.
 */
export const apiClient = createClient<paths>({ baseUrl: envConfig.apiUrl });

apiClient.use(authMiddleware);
