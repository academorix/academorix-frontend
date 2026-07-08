/**
 * @file index.ts
 * @module pwa
 *
 * @description
 * Public entry point for the PWA layer. Consumers should import from
 * `@/pwa` and never reach into the individual files.
 *
 * Re-exports:
 *   - {@link PwaUpdateToast} — mount once inside `<Providers>` to surface the
 *     service-worker update prompt and the offline-ready confirmation.
 *   - {@link usePwaRegistration} — the underlying React hook, exported for
 *     tests + advanced consumers that need to inspect the SW state directly.
 *   - {@link UsePwaRegistrationResult} — return type of the hook, useful for
 *     component props typing.
 */

export { PwaUpdateToast } from "@/pwa/pwa-update-toast";
export { usePwaRegistration } from "@/pwa/register-sw";
export type { UsePwaRegistrationResult } from "@/pwa/register-sw";
