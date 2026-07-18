/**
 * @file inject-script.util.ts
 * @module @stackra/analytics/core/utils
 * @description Idempotent, SSR-safe async <script> injection for pixels/SDKs.
 */

/**
 * Append an async `<script>` to `<head>`, once. No-op on the server (no
 * `document`) and when a script with the same `id` already exists.
 *
 * @param src - Script URL.
 * @param id - Stable element id used for the idempotency guard.
 */
export function injectScript(src: string, id: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  script.id = id;
  document.head.appendChild(script);
}
