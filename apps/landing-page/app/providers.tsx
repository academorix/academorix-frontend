/**
 * @file providers.tsx
 * @description
 * Client-side provider tree mounted at the root of every route.
 *
 * HeroUI v3 does **not** require a top-level `HeroUIProvider` — components
 * carry their own React Aria bindings — so this file only needs:
 *
 *  1. `<ToastProvider>` from `@academorix/ui/react` — the HeroUI v3 toast
 *     region + portal boundary. Required for any `toast()` calls
 *     from our shared UI kit to render.
 *  2. `NextThemesProvider` — applies `class="dark"` / `class="light"` to
 *     `<html>` based on the user's preference, matching the `dark:` variant
 *     we use throughout `@academorix/ui`.
 *
 * Server Components inside `app/` cross this file's boundary once at the root
 * layout, so every downstream Client Component gets both contexts for free.
 */

"use client";

import { ToastProvider } from "@academorix/ui/react";
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
 * Mounts the client-side context stack (toast region + next-themes) once at
 * the root of the App Router. Every interactive HeroUI component beneath it
 * inherits theme awareness and can raise toasts through the portal.
 */
export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <ToastProvider />
      {children}
    </NextThemesProvider>
  );
}
