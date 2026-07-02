/**
 * @file providers.tsx
 * @module providers
 *
 * @description
 * Application-wide provider composition. Mounts, in order:
 *
 * 1. `<ToastProvider>` — HeroUI's toast region, required for the notification
 *    provider's `toast()` calls to render.
 * 2. `<Refine>` — wires every provider (data, auth, live, notification, access
 *    control), the router bindings, the `resources` registry, and global
 *    options. Refine must live inside the router (mounted in `main.tsx`), which
 *    is why this component is rendered under `<BrowserRouter>`.
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
import { appResources } from "@/lib/module";
import { accessControlProvider } from "@/providers/access-control";
import { authProvider } from "@/providers/auth";
import { dataProvider } from "@/providers/data";
import { liveProvider } from "@/providers/live";
import { notificationProvider } from "@/providers/notification";

/** Props for {@link Providers}. */
interface ProvidersProps {
  /** The routed application tree (`<App />`). */
  children: ReactNode;
}

/**
 * Wraps the app in the toast region and the fully-configured Refine context.
 */
export function Providers({ children }: ProvidersProps): ReactNode {
  return (
    <>
      <ToastProvider />
      <Refine
        accessControlProvider={accessControlProvider}
        authProvider={authProvider}
        dataProvider={dataProvider}
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
    </>
  );
}
