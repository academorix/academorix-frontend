/**
 * @file theme-boot.ts
 * @module lib/theme-boot
 *
 * @description
 * Synchronously applies the persisted theme to `<html>` before React mounts
 * so returning visitors never see a flash of the default theme. Called once
 * from `main.tsx` prior to `createRoot(...).render(...)`.
 */

import { applyTheme, readStoredMode, toThemeToken } from "@/lib/theme-utils";

/** Paint the persisted theme (or the default) on `<html>` at boot. */
export function bootstrapThemeFromCache(): void {
  if (typeof document === "undefined") return;

  applyTheme(toThemeToken(readStoredMode()));
}
