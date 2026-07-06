/**
 * @file theme-switcher.tsx
 * @module components/theme/theme-switcher
 *
 * @description
 * A light / dark / system theme control built on **HeroUI's native `useTheme`
 * hook** (`@academorix/ui/react`, re-exported from `@heroui/react`).
 *
 * We deliberately use HeroUI's hook rather than `next-themes`: HeroUI v3 ships
 * `useTheme` specifically for plain React (Vite/CRA) apps — it persists the
 * choice in `localStorage`, resolves `"system"` from the OS preference, and
 * applies **both** the `class` and `data-theme` attribute to `<html>` (the two
 * selectors HeroUI's CSS reads). `next-themes` is Next.js-oriented, would be an
 * extra dependency, and running two theme controllers is explicitly discouraged
 * by HeroUI.
 *
 * @see https://heroui.com/docs/react/getting-started/dark-mode
 */

import { ComputerDesktopIcon, MoonIcon, SunIcon } from "@academorix/ui/icons/outline";
import { Button, Dropdown, Label, useTheme } from "@academorix/ui/react";

import type { IconType } from "@academorix/ui/icons";
import type { Key, ReactNode } from "react";

/** The theme identifiers HeroUI's `useTheme` understands. */
type ThemeChoice = "light" | "dark" | "system";

/** A selectable theme option: its key, label, and glyph. */
interface ThemeOption {
  id: ThemeChoice;
  label: string;
  Icon: IconType;
}

/** The three theme options, in display order. */
const THEME_OPTIONS: readonly ThemeOption[] = [
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
  { id: "system", label: "System", Icon: ComputerDesktopIcon },
] as const;

/** Props for {@link ThemeSwitcher}. */
interface ThemeSwitcherProps {
  /** Optional extra classes for the trigger button. */
  className?: string;
}

/**
 * A compact dropdown that switches between light, dark, and system themes.
 *
 * The trigger reflects the **resolved** theme (sun in light, moon in dark), and
 * the menu highlights the **selected** preference (so `system` is shown as the
 * active choice even though it resolves to light or dark).
 *
 * @param props - Optional styling overrides.
 */
export function ThemeSwitcher({ className }: ThemeSwitcherProps): ReactNode {
  // `useTheme` seeds from persisted storage, defaulting to "system".
  const { theme, resolvedTheme, setTheme } = useTheme("system");

  const handleAction = (key: Key): void => {
    setTheme(key as ThemeChoice);
  };

  const TriggerIcon = resolvedTheme === "dark" ? MoonIcon : SunIcon;

  return (
    <Dropdown>
      <Button isIconOnly aria-label="Change theme" className={className} variant="ghost">
        <TriggerIcon aria-hidden="true" className="size-5" />
      </Button>

      <Dropdown.Popover className="min-w-[180px]" placement="bottom end">
        <Dropdown.Menu
          disallowEmptySelection
          selectedKeys={new Set([theme])}
          selectionMode="single"
          onAction={handleAction}
        >
          {THEME_OPTIONS.map((option) => (
            <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
              <option.Icon aria-hidden="true" className="size-4 text-muted" />
              <Label>{option.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
