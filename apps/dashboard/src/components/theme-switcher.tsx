/**
 * @file theme-switcher.tsx
 * @module components/theme-switcher
 *
 * @description
 * A single dropdown that cycles through Light / Dark / System. The trigger
 * renders the effective appearance icon so users can read the current state
 * at a glance.
 */

import { Button, Dropdown, Header, Label } from "@heroui/react";

import type { ThemeMode } from "@/lib/theme";
import type { Key, ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { THEME_MODES, THEME_MODE_LABELS } from "@/lib/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslate } from "@/hooks/use-translate";

const MODE_ICON: Record<ThemeMode, string> = {
  light: "sun",
  dark: "moon",
  system: "display",
};

export type ThemeSwitcherProps = {
  className?: string;
  /** Icon-only trigger. Defaults to `false` — icon + label. */
  compact?: boolean;
};

export function ThemeSwitcher({ className, compact = false }: ThemeSwitcherProps): ReactNode {
  const { mode, resolvedMode, setMode } = useTheme();
  const t = useTranslate();

  const handleAction = (key: Key) => {
    setMode(String(key) as ThemeMode);
  };

  // Trigger reflects the effective appearance (light / dark) but the label
  // tracks the user-selected mode so `system` renders as "System" not "Dark".
  const activeIcon = MODE_ICON[mode === "system" ? "system" : resolvedMode];

  return (
    <Dropdown>
      <Button
        aria-label={t("app.theme", undefined, "Theme")}
        className={className}
        size="sm"
        variant="ghost"
      >
        <Iconify className="size-4 shrink-0 self-center" icon={activeIcon} />
        {!compact ? (
          <span className="self-center truncate text-sm">{THEME_MODE_LABELS[mode]}</span>
        ) : null}
        <Iconify className="size-3.5 shrink-0 self-center text-muted" icon="chevron-down" />
      </Button>
      <Dropdown.Popover className="min-w-56" placement="bottom end">
        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Section>
            <Header>{t("app.appearance", undefined, "Appearance")}</Header>
            {THEME_MODES.map((entry) => (
              <Dropdown.Item key={entry} id={entry} textValue={THEME_MODE_LABELS[entry]}>
                <Iconify className="size-4" icon={MODE_ICON[entry]} />
                <Label>{THEME_MODE_LABELS[entry]}</Label>
                {entry === mode ? (
                  <Iconify className="ms-auto size-4 text-accent" icon="check" />
                ) : null}
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
