/**
 * @file app-root.tsx
 * @module components/app-root
 *
 * @description
 * Top-level route component — mounted by `router.tsx` as the `Component`
 * of the `/` route. Every child route renders inside this wrapper.
 *
 * ## Why this exists
 *
 * Before Phase H, `<App>` was the top of both the provider stack AND
 * the routed shell. That merged two concerns: cross-cutting providers
 * (theme, locale, realtime, ...) and route-tree-dependent wrappers
 * (Refine's `<Refine>`, `react-aria-components`'s `<RouterProvider>`
 * with `useNavigate` from RRv7, the SEO renderer, and every provider
 * that consumes Refine's auth/data context).
 *
 * The provider stack now lives in `@/providers` and wraps
 * `<StackraRoutingProvider />` in `main.tsx`. The routing-dependent
 * wrappers live here so they mount INSIDE the RRv7 router tree — that
 * is the only place `useNavigate()` / `useMatches()` / `useHref()`
 * work.
 *
 * ## Ordering rationale (top-down)
 *
 *   1. `<RouterProvider>` (react-aria-components) — needs `useNavigate`
 *      + `useHref` from RRv7 to plumb aria's routing intents through.
 *   2. `<SeoHead />` — walks `useMatches()` and merges each route's
 *      `seo` descriptor. Renders the document head via React's built-
 *      in head hoisting.
 *   3. `<Refine>` — the Refine root. It reads the RRv7 context via
 *      `routerProvider={routerProvider}` (from `@refinedev/react-router`)
 *      and provides auth / data / i18n contexts. Every downstream
 *      hook (auth check, resource query, notification) depends on
 *      this.
 *   4. `<SettingsProvider>` — reads app settings via Refine's data
 *      provider.
 *   5. `<FcmProvider>` — Firebase Cloud Messaging. Depends on Refine's
 *      auth context to gate the token registration. `RealtimeProvider`
 *      and `NotificationTransportProvider` (which used to sit
 *      between Refine and FCM in the old `App.tsx`) moved to
 *      `<Providers>` in Phase H — they configure module-scope
 *      singletons that don't need to walk the React tree.
 *   6. `<KeyboardShortcutSheetProvider>` — global "?" cheat sheet.
 *   7. `<AsideSlotProvider>` — the right-hand panel slot store.
 *   8. `<AppFrame />` — decides public vs protected. Public paths
 *      (sign-in, sign-up, ...) render bare; everything else renders
 *      inside `<AppShell>` behind an `<Authenticated>` gate.
 *   9. Bare mount siblings — each backs onto a container-owned
 *      service or a shared registry, so no wrapping provider is
 *      needed:
 *
 *      - `<AiAssistantSheetMount />` — AI Assistant sheet + toast
 *        fallback, subscribed to `AiAssistantService`.
 *      - `<PasswordConfirmDialog />` — step-up password gate,
 *        subscribed to `PasswordConfirmService`.
 *      - `<CommandPalette />` — ⌘K UI, subscribed to
 *        `CommandPaletteService`.
 *      - `<Toast.Provider>` — HeroUI's Sonner-style toast queue.
 */

import { Toast } from "@heroui/react";
import { Authenticated, Refine } from "@refinedev/core";
import type { ResourceProps } from "@refinedev/core";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { RouterProvider } from "react-aria-components";
import { Navigate, Outlet, useHref, useLocation, useNavigate } from "@stackra/routing/react";

import { SeoHead } from "@stackra/routing/react";

import { AppShell } from "@/components/app-shell";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcutSheetProvider } from "@/components/keyboard-shortcut-sheet";
import { LeaderKeyBridge } from "@/components/leader-key-bridge";
import { renderSonnerToast } from "@/components/app-toast";
import { siteConfig } from "@/config/site.config";
import { AsideSlotProvider } from "@/lib/aside-slot";
import { NotificationsRoot } from "@/lib/notifications/provider";
import { appResources } from "@/modules/registry";
import { SettingsProvider } from "@/modules/settings/scope/settings-provider";
import { AiAssistantSheetMount } from "@/components/ai-assistant-sheet-mount";
import { FcmProvider } from "@/providers/fcm-provider";
import { useI18nProvider } from "@/hooks/use-i18n-provider";
import { PasswordConfirmDialog } from "@/components/password-confirm-dialog";
import { accessControlProvider } from "@/providers/access-control";
import { authProvider } from "@/providers/auth";
import { dataProviders } from "@/providers/data";
import { liveProvider } from "@/providers/live";
import { notificationProvider } from "@/providers/notification";

// ────────────────────────────────────────────────────────────────────
// Public route detection
// ────────────────────────────────────────────────────────────────────

/**
 * Route paths that render OUTSIDE the app shell (no sidebar, no
 * navbar, no aside). Every auth surface lives here. Kept as a prefix
 * list so route params (`/reset-password?token=…`) still match.
 */
const PUBLIC_ROUTE_PREFIXES: readonly string[] = [
  "/sign-in",
  "/sign-up",
  "/find-workspaces",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/join",
];

/**
 * Predicate — is the current pathname a public auth surface? Used by
 * {@link AppFrame} to decide whether to wrap the outlet in the shell +
 * auth guard or render it bare.
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// ────────────────────────────────────────────────────────────────────
// Refine wrapper — reads the current i18n provider from context
// ────────────────────────────────────────────────────────────────────

/**
 * Refine root — the fully-configured Refine context.
 *
 * ## Why this lives INSIDE `AppRoot` (not in `<Providers>`)
 *
 * Refine's `@refinedev/react-router` binding uses raw react-router hooks
 * (`useLocation`, `useNavigate`, `useMatches`) inside
 * `<UnsavedChangesNotifier />` + `<DocumentTitleHandler />` + its own
 * routerProvider adapters. Those hooks throw when called outside a
 * `<RouterProvider>` context — so Refine's mount point MUST be inside the
 * RRv7 tree (i.e. inside `<StackraRoutingProvider>`). `AppRoot` is that
 * tree's top-level route component, which makes it the natural home.
 *
 * ## Providers wired here
 *
 *   - `authProvider` — tenant/platform-aware auth (from `@/providers/auth`).
 *     The host resolver in `main.tsx` decides which one is active.
 *   - `dataProviders` — multiplexed REST providers (default + platform).
 *   - `accessControlProvider` — RBAC gate based on the cached identity.
 *   - `liveProvider` — WebSocket-backed live query updates via
 *     `@stackra/realtime`.
 *   - `notificationProvider` — HeroUI-backed toast bridge.
 *   - `i18nProvider` — from `LocaleService` via `useI18nProvider()` so a
 *     language switch retranslates every Refine caption.
 *
 * ## Shared QueryClient
 *
 * `Providers` (mounted above the router) hoists a single `QueryClient` via
 * `<QueryClientProvider>`. This component reads it via `useQueryClient()`
 * and hands it back to Refine through `options.reactQuery.clientConfig`,
 * guaranteeing every Refine hook AND every upstream `useQueryClient()`
 * consumer share the same cache — critical for `invalidateQueries()` on
 * logout and cross-cutting cache reads.
 *
 * ## Children mounted alongside `{children}`
 *
 *   - `<NotificationsRoot>` — inbox sync + toast bridge. Reads
 *     `useGetIdentity()` (a Refine hook) so it MUST be inside `<Refine>`.
 *   - `<UnsavedChangesNotifier />` — blocks navigation away from dirty
 *     forms.
 *   - `<DocumentTitleHandler />` — keeps `document.title` in sync with the
 *     active resource/action.
 */
function RefineRoot({ children }: { children: ReactElement }) {
  const i18nProvider = useI18nProvider();
  const queryClient = useQueryClient();

  return (
    <Refine
      accessControlProvider={accessControlProvider}
      authProvider={authProvider}
      dataProvider={dataProviders}
      i18nProvider={i18nProvider}
      liveProvider={liveProvider}
      notificationProvider={notificationProvider}
      options={{
        disableTelemetry: true,
        liveMode: "auto",
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        title: { text: siteConfig.name },
        reactQuery: {
          // Hand Refine the same QueryClient the outer `<Providers>` mounted.
          // Refine v5 skips its default construction when this option is a
          // real QueryClient instance, so every hook — Refine's own auth
          // queries AND anything upstream reading `useQueryClient()` —
          // reads and writes the same cache.
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

// ────────────────────────────────────────────────────────────────────
// AppFrame — public vs protected switch
// ────────────────────────────────────────────────────────────────────

/**
 * Renders the outlet inside `<AppShell>` for protected routes, or bare
 * (no shell chrome) for auth pages. The `<Authenticated>` guard around
 * the shell branch invokes `authProvider.check()` on every navigation
 * — when the check returns unauthenticated we render `<Navigate
 * to="/sign-in">` and never mount the shell.
 *
 * ## Why the `key` prop on `<Authenticated>`
 *
 * Refine caches the check result behind a React Query key that only
 * changes when the `key` prop does. Keying on the pathname forces a
 * re-check after every navigation — critical for the `logout()` →
 * `/sign-in` bounce, and for a token expiry that lands mid-session.
 */
function AppFrame(): ReactElement {
  const location = useLocation();
  const isPublic = isPublicPath(location.pathname);

  if (isPublic) {
    // Public routes render bare — no shell, no auth check. The outlet
    // drops us into whichever auth page matched.
    return (
      <div className="min-h-dvh text-foreground">
        <Outlet />
      </div>
    );
  }

  return (
    <Authenticated
      fallback={
        <Navigate
          replace
          to={`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`}
        />
      }
      key={`protected-${location.pathname}`}
    >
      <div className="min-h-dvh text-foreground">
        <AppShell>
          <LeaderKeyBridge />
          <Outlet />
        </AppShell>
      </div>
    </Authenticated>
  );
}

// ────────────────────────────────────────────────────────────────────
// AppRoot — the top-level route Component
// ────────────────────────────────────────────────────────────────────

/**
 * Top-level route Component. Mounted at path `/` by `router.tsx` so
 * every routed surface is wrapped in this stack.
 */
export function AppRoot(): ReactElement {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      {/*
        `<SeoHead />` from `@stackra/routing/react` is the SEO/AEO
        head renderer. It walks every matched route's `seo` field,
        merges it
        on top of the site defaults declared in `RoutingModule.forRoot({
        seo: {...} })`, and renders the resulting `<title>` / `<meta>` /
        `<link>` / `<script type="application/ld+json">` tags into the
        document head via React's built-in head hoisting.

        Placement: outermost child of the aria `<RouterProvider>` so
        `useMatches()` sees every match, and inside the RRv7 router
        (via `<StackraRoutingProvider>`) so `SEO_SERVICE` from the
        container resolves.

        Per-route SEO opts in by adding `seo: { title, description,
        openGraph, jsonLd, ... }` (or `handle: { seo: {...} }` for
        RRv7 interop) to a route entry. Routes without an `seo`
        descriptor fall back to the module defaults.
      */}
      <SeoHead />
      <RefineRoot>
        <SettingsProvider>
          {/*
            WHY: FcmProvider sits between Refine (auth context) and
            the command-palette tree. Realtime + notification
            transport providers were hoisted to `<Providers>` in
            Phase H, so they live above the RRv7 tree now — that's
            fine because they configure module-scope singletons
            (`@laravel/echo-react`, notification transport) that any
            hook can reach without walking the React tree.
          */}
          <FcmProvider>
            {/*
              WHY there's no `<CommandPaletteProvider>` here anymore:
              the palette's open/close state lives on
              `CommandPaletteService` in the DI container. The `⌘K`
              global listener is installed by the service's
              `onModuleInit` hook, and every consumer reads via
              `useCommandPalette()`. Rendering the palette UI itself
              is still done below (`<CommandPalette />`) — it just
              no longer requires a wrapping context provider.
            */}
            <KeyboardShortcutSheetProvider>
              <AsideSlotProvider>
                  <AppFrame />
                  {/*
                    WHY these three are bare mounts (not wrapping
                    providers): each backs onto a container-owned
                    service (`AiAssistantService`, `PasswordConfirm-
                    Service`) or a shared registry (command palette,
                    toast queue). The DI container is the single
                    source of state — every subtree reaches the
                    service via a typed hook, so no context wrap is
                    needed. The mount order below mirrors the legacy
                    stack so overlay z-ordering stays identical.
                  */}
                  <AiAssistantSheetMount />
                  <PasswordConfirmDialog />
                  <CommandPalette />
                  {/*
                    WHY the custom render slot: swaps the default pill
                    visual for a Sonner-style stacked card (indicator
                    ← copy → close). The singleton `toast()` API in
                    `@heroui/react` still writes to the default queue,
                    so every existing call site (`toast.success`,
                    `toast.promise`, …) keeps working without a code
                    change.
                  */}
                  <Toast.Provider placement="bottom end" width={380}>
                    {({ toast: toastItem }) => renderSonnerToast(toastItem)}
                  </Toast.Provider>
                </AsideSlotProvider>
              </KeyboardShortcutSheetProvider>
          </FcmProvider>
        </SettingsProvider>
      </RefineRoot>
    </RouterProvider>
  );
}
