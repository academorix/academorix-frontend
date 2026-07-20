/**
 * @file sdui-theme-scope.tsx
 * @module @stackra/sdui/react/providers
 * @description `<SduiThemeScope>` — applies server-driven CSS custom
 *   properties from an `ISduiThemeDocument`. Restricts emissions to the
 *   allow-listed `SduiThemeTokenName` union so a payload cannot inject
 *   arbitrary custom properties.
 */

import type { CSSProperties, ReactNode } from "react";
import type { ISduiThemeDocument, SduiThemeTokenName } from "@stackra/contracts";

const ALLOWED_TOKENS: ReadonlySet<SduiThemeTokenName> = new Set([
  "accent",
  "accent-foreground",
  "background",
  "foreground",
  "surface",
  "surface-foreground",
  "muted",
  "border",
  "radius",
  "field-radius",
  "font-sans",
  "font-heading",
]);

export interface ISduiThemeScopeProps {
  readonly theme?: ISduiThemeDocument;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * `<SduiThemeScope>` — sets HeroUI semantic CSS custom properties from
 * the theme document, and toggles the `light`/`dark` class based on
 * `colorScheme`.
 */
export function SduiThemeScope({ theme, className, children }: ISduiThemeScopeProps) {
  if (!theme) return <>{children}</>;

  const style: CSSProperties = {};
  for (const [name, value] of Object.entries(theme.tokens ?? {})) {
    if (ALLOWED_TOKENS.has(name as SduiThemeTokenName) && typeof value === "string") {
      (style as Record<string, string>)[`--${name}`] = value;
    }
  }

  const scheme = theme.colorScheme;
  const composed = [scheme === "dark" ? "dark" : "light", className].filter(Boolean).join(" ");

  return (
    <div className={composed} style={style} data-sdui-theme={theme.id}>
      {children}
    </div>
  );
}
