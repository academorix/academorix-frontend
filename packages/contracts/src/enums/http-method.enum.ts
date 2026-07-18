/**
 * @file http-method.enum.ts
 * @module @stackra/contracts/enums
 * @description HTTP request verbs.
 *
 *   String-valued so raw literals (`'GET'`, `'POST'`, …) assigned to
 *   `IHttpRequestConfig.method` remain assignable, while comparisons
 *   like `request.method !== HttpMethod.GET` still type-check.
 */

/** HTTP verbs supported by the client. */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}
