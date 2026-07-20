/**
 * @file build-endpoint-uri.util.ts
 * @module @stackra/settings/core/utils
 * @description Small helper that substitutes `{group}` (and any
 *   additional bracketed placeholders) into an endpoint path
 *   template. URL-encodes each substitution.
 */

/**
 * Replace every `{name}` placeholder in `template` with the
 * URI-encoded value from `params[name]`. Unknown placeholders are
 * left as-is (rare — typically indicates a bug in the template).
 *
 * @param template - Endpoint path template (`/api/v1/settings/{group}`).
 * @param params - Values to substitute.
 * @returns The rendered path.
 */
export function buildEndpointUri(
  template: string,
  params: Readonly<Record<string, string>>
): string {
  return template.replace(/\{([^}]+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : encodeURIComponent(value);
  });
}
