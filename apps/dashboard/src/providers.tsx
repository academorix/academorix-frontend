/**
 * @file providers.tsx
 * @module providers
 *
 * @description
 * Application-wide provider composition. Mounts, in order:
 *
 * 1. `<LocaleProvider>` — reactive locale + `i18nProvider` factory. Wraps
 *    every child so a language switch re-translates the tree.
 * 2. `<ToastProvider>` — HeroUI's toast region, required for the notification
 *    provider's `toast()` calls (and the PWA update toast) to render.
 * 3. `<PwaUpdateToast>` — production-only side-effect component that
 *    registers the service worker and surfaces install/update prompts
 *    through the HeroUI toast queue. See {@link "@/pwa"} for details.
 * 4. `<Refine>` — wires every provider (data, auth, live, notification,
 *    access control), the router bindings, the `resources` registry, and
 *    global options. Refine must live inside the router (mounted in
 *    `main.tsx`), which is why this component is rendered under
 *    `<BrowserRouter>`.
 *
 * `<UnsavedChangesNotifier>` guards navigation away from dirty forms, and
 * `<DocumentTitleHandler>` keeps the tab title in sync with the active
 * resource/action.
 */

import { ToastProvider } from "@academorix/ui/react";
import { Refine } from "@refinedev/core";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import type { ResourceProps } from "@refinedev/core";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { LocaleProvider, useI18nProvider } from "@/lib/i18n";
import { appResources } from "@/lib/module";
import { accessControlProvider } from "@/providers/access-control";
import { authProvider } from "@/providers/auth";
import { dataProviders } from "@/providers/data";
import { liveProvider } from "@/providers/live";
import { notificationProvider } from "@/providers/notification";
import { PwaUpdateToast } from "@/pwa";

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
 * Mounts the fully-configured Refine context, reading the locale-bound
 * `i18nProvider` from {@link LocaleProvider} so a language switch re-translates
 * the tree (including Refine's own components).
 */
function RefineRoot({ children }: ProvidersProps): ReactNode {
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
      }}
      resources={appResources as unknown as ResourceProps[]}
      routerProvider={routerProvider}
    >
      {children}
      <UnsavedChangesNotifier />
      <DocumentTitleHandler />
    </Refine>
  );
}

/**
 * Wraps the app in the locale layer, the toast region, the production-only
 * PWA update toast, and the fully-configured Refine context.
 */
export function Providers({ children }: ProvidersProps): ReactNode {
  return (
    <LocaleProvider>
      <ToastProvider />
      {/*
       * PWA update prompt — production-only, side-effect component that
       * registers the service worker and pushes toast notifications into
       * the queue mounted just above. Renders no visible DOM.
       */}
      {IS_PRODUCTION ? <PwaUpdateToast /> : null}
      <RefineRoot>{children}</RefineRoot>
    </LocaleProvider>
  );
}
