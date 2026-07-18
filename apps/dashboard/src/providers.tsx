/**
 * @file providers.tsx
 * @module providers
 *
 * @description
 * Application-wide provider composition. Mounts, in order:
 *
 * 1. `<QueryClientProvider>` — a single {@link QueryClient} hoisted above
 *    every other provider so `useQueryClient()` resolves the same instance
 *    from anywhere in the tree (Refine's own hooks AND anything outside).
 *    See the {@link Providers} docblock for the rationale.
 * 2. `<ToastProvider>` — HeroUI's toast region, required for the notification
 *    provider's `toast()` calls (and the PWA update toast) to render.
 * 3. `<PwaUpdateToast>` — production-only side-effect component that
 *    registers the service worker and surfaces install/update prompts
 *    through the HeroUI toast queue. See {@link "@/lib/pwa"} for details.
 * 4. `<Refine>` — wires every provider (data, auth, live, notification,
 *    access control), the router bindings, the `resources` registry, and
 *    global options. Refine is handed the hoisted QueryClient via
 *    `options.reactQuery.clientConfig` so it shares the same cache. Refine
 *    must live inside the router (mounted in `main.tsx`), which is why this
 *    component is rendered under `<BrowserRouter>`.
 * 5. `<NotificationsRoot>` — composed inside `<RefineRoot>` so its
 *    presence hooks (inbox sync + toast bridge) can read
 *    `useGetIdentity()`. Provides the shared notifications context to
 *    every downstream consumer (bell, drawer, preferences page).
 *
 * `<UnsavedChangesNotifier>` guards navigation away from dirty forms, and
 * `<DocumentTitleHandler>` keeps the tab title in sync with the active
 * resource/action.
 */

import { createQueryClient } from "@academorix/query/client";
import { ToastProvider } from "@stackra/ui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import type { ReactNode } from "react";

import { DesktopBootstrap } from "@/lib/desktop";
import { PwaUpdateToast } from "@/lib/pwa";

/**
 * Compile-time flag — `true` for `vite build` output, `false` for `vite dev`.
 * Vite substitutes this at bundle time so the branch below tree-shakes away
 * in dev builds.
 *
 * We gate {@link PwaUpdateToast} on this because the underlying service
 * worker is only registered in production builds
 * (`vite.config.ts` → `VitePWA.devOptions.enabled = false`). Mounting the
 * hook in dev would still work (`useRegisterSW` no-ops when the plugin's
 * virtual module is inactive), but it would emit console-info noise and
 * spin up a useless effect on every dev reload.
 */
const IS_PRODUCTION = import.meta.env.PROD;

/** Props for {@link Providers}. */
interface ProvidersProps {
  /** The routed application tree (`<StackraRoutingProvider />`). */
  children: ReactNode;
}

/**
 * Wraps the app in the QueryClient, the toast region, the production-only
 * PWA update toast, and the desktop-shell bootstrap (no-op on web).
 *
 * ## Refine mounts INSIDE the router — not here
 *
 * Refine consumes RRv7 router hooks (`useLocation`, `useHref`, `useNavigate`)
 * via its `@refinedev/react-router` binding, plus it renders
 * `<UnsavedChangesNotifier />` + `<DocumentTitleHandler />` which call
 * `useLocation()` at render time. Those hooks throw when called outside a
 * `<RouterProvider>` context — so Refine's mount point is `AppRoot` (the
 * top-level route component in `router.tsx`), NOT this provider stack.
 *
 * ## QueryClient hoist
 *
 * The QueryClient is constructed once at boot and pinned to state via
 * `useState(() => ...)` so every re-render sees the same instance. Refine
 * (mounted inside `AppRoot`) reads this same client via `useQueryClient()`
 * and hands it back through `options.reactQuery.clientConfig`, guaranteeing
 * every hook — Refine's own AND anything upstream — reads and writes the
 * same cache.
 */
export function Providers({ children }: ProvidersProps): ReactNode {
  // Lazy initialiser + state pin — the QueryClient survives every re-render
  // (React re-runs the initialiser only on the first mount) and never leaks
  // across StrictMode double-invocations. Do NOT lift this out of the
  // component or the initial render inside jsdom test envs will share state.
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/*
        WHY there's no `<LocaleProvider>` here anymore: the active
        locale lives on `LocaleService` in the DI container. Every
        subtree reaches it via `useLocale()` / `useTranslate()` /
        `useI18nProvider()` — the tree doesn't need a wrapping
        provider component. The service's `onModuleInit` syncs
        `<html lang dir>` at boot; every `setLocale()` re-paints.
      */}
      <ToastProvider />
      {/*
       * PWA update prompt — production-only, side-effect component that
       * registers the service worker and pushes toast notifications into
       * the queue mounted just above. Renders no visible DOM.
       */}
      {IS_PRODUCTION ? <PwaUpdateToast /> : null}
      {/*
       * Desktop shell bootstrap — sets the OS window title, mirrors the
       * OS theme, and attaches the tray-command IPC listeners. Renders
       * children unchanged; no-ops entirely when `window.__TAURI__` is
       * absent (i.e. on every web build).
       */}
      <DesktopBootstrap>{children}</DesktopBootstrap>
    </QueryClientProvider>
  );
}
