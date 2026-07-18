/**
 * @file sdui-theme.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Server-driven theme document. Restricted to a fixed set
 *   of HeroUI semantic tokens so a payload cannot inject arbitrary CSS
 *   custom properties.
 */

/** Allow-listed theme token names. */
export type SduiThemeTokenName =
  | "accent"
  | "accent-foreground"
  | "background"
  | "foreground"
  | "surface"
  | "surface-foreground"
  | "muted"
  | "border"
  | "radius"
  | "field-radius"
  | "font-sans"
  | "font-heading";

/**
 * A server-driven theme scope. Applied via `<SduiThemeScope>` at the
 * top of the screen; sets HeroUI semantic CSS custom properties on a
 * wrapper element.
 */
export interface ISduiThemeDocument {
  readonly id: string;
  readonly name: string;
  readonly colorScheme?: "light" | "dark";
  readonly tokens?: Readonly<Partial<Record<SduiThemeTokenName, string>>>;
}
