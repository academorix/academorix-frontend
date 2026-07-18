/**
 * @file providers.tsx
 * @description
 * Client-side provider tree mounted at the root of every route.
 *
 * HeroUI v3 does **not** require a top-level `HeroUIProvider` —
 * components carry their own React Aria bindings — so this file
 * only needs:
 *
 *  1. `<NextThemesProvider>` — applies `class="dark"` / `class="light"`
 *     to `<html>` based on the user's preference, matching the
 *     `dark:` variant we use throughout `@stackra/ui`.
 *  2. `<GlassThemeSync>` — client-side companion that mirrors
 *     `resolvedTheme` from next-themes into `html[data-theme=
 *     "glass-{light|dark}"]`, activating the HeroUI Pro Glass
 *     theme variant. Renders nothing.
 *  3. `<ToastProvider>` from `@stackra/ui/react` — the HeroUI v3
 *     toast region + portal boundary. Required for any `toast()`
 *     calls from our shared UI kit to render.
 *  4. `<SerwistProvider>` — registers the Serwist-compiled service
 *     worker (served at `/serwist/sw.js`) as soon as the client
 *     hydrates. Silently disabled in development so HMR isn't
 *     intercepted.
 *
 * Server Components inside `app/` cross this file's boundary once
 * at the root layout, so every downstream Client Component gets
 * all four contexts for free.
 */

"use client";

import { ToastProvider } from "@stackra/ui/react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import type { ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";

import { GlassThemeSync } from "@/components/theme/glass-theme-sync";

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
 * Mounts the client-side context stack once at the root of the
 * App Router. Every interactive HeroUI component beneath it
 * inherits theme awareness (both next-themes' class-based
 * variant AND the HeroUI Pro Glass data-attribute variant) and
 * can raise toasts through the portal; every navigation is
 * transparently precached by the SW for offline use.
 */
export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <GlassThemeSync />
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
