/**
 * @file theme-switch.tsx
 * @module components/theme-switch
 *
 * @description
 * Lightweight dark/light toggle for the marketing surface. Reads/writes the
 * theme through `next-themes`, and shows a placeholder box until the client
 * has hydrated to avoid a "wrong icon" flash between SSR and CSR.
 *
 * Uses the shared `@academorix/ui/icons/solid` set so the mark matches every
 * other Academorix icon on the marketing site.
 */

"use client";

import { MoonIcon, SunIcon } from "@academorix/ui/icons/solid";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import type { FC } from "react";

/** Props for {@link ThemeSwitch}. */
export interface ThemeSwitchProps {
  /** Extra classes appended to the toggle. */
  className?: string;
}

/** Renders a sun (light) / moon (dark) icon button that flips the theme. */
export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // SSR + hydration guard — return a same-sized placeholder so layout doesn't shift.
  if (!isMounted) {
    return <span aria-hidden="true" className="inline-block size-9" />;
  }

  const isLight = resolvedTheme === "light";

  return (
    <button
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      className={[
        "inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors",
        "hover:bg-default/40 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
    >
      {isLight ? (
        <MoonIcon aria-hidden="true" className="size-5" />
      ) : (
        <SunIcon aria-hidden="true" className="size-5" />
      )}
    </button>
  );
};
