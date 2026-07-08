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
 * 2. `<LocaleProvider>` — reactive locale + `i18nProvider` factory. Wraps
 *    every child so a language switch re-translates the tree.
 * 3. `<ToastProvider>` — HeroUI's toast region, required for the notification
 *    provider's `toast()` calls (and the PWA update toast) to render.
 * 4. `<PwaUpdateToast>` — production-only side-effect component that
 *    registers the service worker and surfaces install/update prompts
 *    through the HeroUI toast queue. See {@link "@/lib/pwa"} for details.
 * 5. `<Refine>` — wires every provider (data, auth, live, notification,
 *    access control), the router bindings, the `resources` registry, and
 *    global options. Refine is handed the hoisted QueryClient via
 *    `options.reactQuery.clientConfig` so it shares the same cache. Refine
 *    must live inside the router (mounted in `main.tsx`), which is why this
 *    component is rendered under `<BrowserRouter>`.
 * 6. `<NotificationsRoot>` — composed inside `<RefineRoot>` so its
 *    presence hooks (inbox sync + toast bridge) can read
 *    `useGetIdentity()`. Provides the shared notifications context to
 *    every downstream consumer (bell, drawer, preferences page).
 *
 * `<UnsavedChangesNotifier>` guards navigation away from dirty forms, and
 * `<DocumentTitleHandler>` keeps the tab title in sync with the active
 * resource/action.
 */

import { createQueryClient } from "@academorix/query/client";
import { ToastProvider } from "@academorix/ui/react";
import { Refine } from "@refinedev/core";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import type { ResourceProps } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site.config";
import { DesktopBootstrap } from "@/lib/desktop";
import { LocaleProvider, useI18nProvider } from "@/lib/i18n";
import { appResources } from "@/lib/module";
import { NotificationsRoot } from "@/lib/notifications/provider";
import { PwaUpdateToast } from "@/lib/pwa";
import { accessControlProvider } from "@/providers/access-control";
import { authProvider } from "@/providers/auth";
import { dataProviders } from "@/providers/data";
import { liveProvider } from "@/providers/live";
import { notificationProvider } from "@/providers/notification";

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
  /** The routed application tree (`<App />`). */
  children: ReactNode;
}

/**
 * Props for {@link RefineRoot}.
 *
 * The provider composition owns the QueryClient (see {@link Providers}) and
 * hands it down so Refine and every other consumer share one instance. Refine
 * accepts an already-constructed {@link QueryClient} via
 * `options.reactQuery.clientConfig` and skips its own default construction.
 */
interface RefineRootProps extends ProvidersProps {
  /** Shared TanStack Query client — same instance the outer provider hoists. */
  queryClient: QueryClient;
}

/**
 * Mounts the fully-configured Refine context, reading the locale-bound
 * `i18nProvider` from {@link LocaleProvider} so a language switch re-translates
 * the tree (including Refine's own components).
 */
function RefineRoot({ children, queryClient }: RefineRootProps): ReactNode {
  const i18nProvider = useI18nProvider();

  return (
    <Refine
      accessControlProvider={accessControlProvider}
      authProvider={authProvider}
      dataProvider={dataProviders}
      i18nProvider={i18nProvider}
      liveProvider={liveProvider}
      notificationProvider={notificationProvider}
      options={{
        liveMode: "auto",
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        disableTelemetry: true,
        title: { text: siteConfig.name },
        reactQuery: {
          // Hand Refine the same QueryClient the outer QueryClientProvider
          // already exposes. Refine v5 short-circuits its default
          // `new QueryClient(...)` construction when this option is a
          // QueryClient instance, so every hook — Refine's own auth queries
          // AND anything upstream reading `useQueryClient()` — reads and
          // writes the same cache.
          clientConfig: queryClient,
        },
      }}
      resources={appResources as unknown as ResourceProps[]}
      routerProvider={routerProvider}
    >
      <NotificationsRoot>{children}</NotificationsRoot>
      <UnsavedChangesNotifier />
      <DocumentTitleHandler />
    </Refine>
  );
}

/**
 * Wraps the app in the locale layer, the toast region, the production-only
 * PWA update toast, the desktop-shell bootstrap (no-op on web), and the
 * fully-configured Refine context.
 *
 * ## QueryClient hoist
 *
 * The QueryClient is constructed once at boot and pinned to state via
 * `useState(() => ...)`. Two consumers read it:
 *
 *  1. `<QueryClientProvider>` — hoisted **above** `<Refine>` so any hook that
 *     runs outside Refine's own tree (locale layer, toast region, PWA update
 *     toast, desktop-shell bootstrap) still resolves `useQueryClient()`.
 *  2. `<Refine>` (via `options.reactQuery.clientConfig`) — Refine v5 accepts an
 *     already-built QueryClient here and skips its default construction, so
 *     Refine's own hooks (`useGetIdentity`, `useIsAuthenticated`, …) share
 *     the same cache with everything upstream.
 *
 * Sharing one client keeps `queryClient.invalidateQueries()` calls from
 * `authProvider.logout` effective across every consumer, and it fixes the
 * "No QueryClient set" throw that occurred when a top-level component
 * rendered a Refine hook before Refine's inner provider had mounted.
 */
export function Providers({ children }: ProvidersProps): ReactNode {
  // Lazy initialiser + state pin — the QueryClient survives every re-render
  // (React re-runs the initialiser only on the first mount) and never leaks
  // across StrictMode double-invocations. Do NOT lift this out of the
  // component or the initial render inside jsdom test envs will share state.
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
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
        <DesktopBootstrap>
          <RefineRoot queryClient={queryClient}>{children}</RefineRoot>
        </DesktopBootstrap>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
