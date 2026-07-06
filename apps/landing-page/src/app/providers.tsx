/**
 * @file providers.tsx
 * @description
 * Client-side provider tree mounted at the root of every route.
 *
 * HeroUI v3 does **not** require a top-level `HeroUIProvider` —
 * components carry their own React Aria bindings — so this file
 * only needs:
 *
 *  1. `<ToastProvider>` from `@academorix/ui/react` — the HeroUI v3
 *     toast region + portal boundary. Required for any `toast()`
 *     calls from our shared UI kit to render.
 *  2. `NextThemesProvider` — applies `class="dark"` / `class="light"`
 *     to `<html>` based on the user's preference, matching the
 *     `dark:` variant we use throughout `@academorix/ui`.
 *  3. `<SerwistProvider>` — registers the Serwist-compiled service
 *     worker (served at `/serwist/sw.js`) as soon as the client
 *     hydrates. Silently disabled in development so HMR isn't
 *     intercepted.
 *
 * Server Components inside `app/` cross this file's boundary once
 * at the root layout, so every downstream Client Component gets
 * all three contexts for free.
 */

"use client";

import { ToastProvider } from "@academorix/ui/react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import type { ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";

/** Props for {@link Providers}. */
export interface ProvidersProps {
  /** The React tree to render inside the provider stack. */
  children: ReactNode;
  /** Passed straight through to `NextThemesProvider`. */
  themeProps?: ThemeProviderProps;
}

/**
 * URL at which the Serwist Route Handler
 * (`src/app/serwist/[path]/route.ts`) serves the compiled service
 * worker. Kept as a module constant so any consumer (dev tools
 * probes, background pings) can import it too.
 */
const SERWIST_SW_URL = "/serwist/sw.js";

/**
 * Mounts the client-side context stack (SW registration + toast
 * region + next-themes) once at the root of the App Router. Every
 * interactive HeroUI component beneath it inherits theme awareness
 * and can raise toasts through the portal; every navigation is
 * transparently precached by the SW for offline use.
 */
export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <ToastProvider />
      <SerwistProvider
        cacheOnNavigation
        register
        reloadOnOnline
        disable={process.env.NODE_ENV === "development"}
        swUrl={SERWIST_SW_URL}
      >
        {children}
      </SerwistProvider>
    </NextThemesProvider>
  );
}
