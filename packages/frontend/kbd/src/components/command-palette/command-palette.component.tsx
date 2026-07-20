/**
 * @fileoverview CommandPalette — themed command launcher with multiple visual variants.
 *
 * Built on HeroUI Pro's `Command` compound component for the UI layer,
 * with the {@link CommandPaletteService} managing state, search, and
 * command resolution.
 *
 * Supports five visual variants:
 * - `default` — standard grouped palette with footer hints
 * - `launcher` — Raycast-style flat list with app icons
 * - `split` — split-view with command list + preview panel
 * - `minimal` — Linear-style text-only with accent bars
 * - `clean` — nested page navigation with breadcrumbs
 *
 * @module @stackra/kbd
 * @category Components
 */
import { useMemo, type ReactElement, type ReactNode } from "react";
import { useInject } from "@stackra/container/react";

import { COMMAND_TYPE_REGISTRY } from "../../tokens";
import { useCommandPalette } from "../../hooks/use-command-palette/use-command-palette.hook";
import { useShortcutScope } from "../../hooks/use-shortcut-scope/use-shortcut-scope.hook";
import type { CommandTypeRegistry } from "../../registries/command-type.registry";
import { useI18n } from "@stackra/i18n/react";

import { groupByType } from "./layouts/shared";
import {
  DefaultPaletteLayout,
  LauncherPaletteLayout,
  SplitPaletteLayout,
  MinimalPaletteLayout,
  CleanPaletteLayout,
} from "./layouts";
import type { LayoutProps } from "./layouts";

/* ── Types ─────────────────────────────────────────────────────── */

/** Visual variant for the command palette layout. */
export type CommandPaletteVariant = "default" | "launcher" | "split" | "minimal" | "clean";

/**
 * Props for the {@link CommandPalette} component.
 */
export interface CommandPaletteProps {
  /** Visual layout variant. */
  variant?: CommandPaletteVariant;
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Message shown when no results match. */
  emptyMessage?: string;
  /** Hint shown below the empty message. */
  emptyHint?: string;
  /** Custom footer content (replaces default navigation hints). */
  footerHint?: ReactNode;
  /** Size of the command dialog. */
  size?: "sm" | "md" | "lg";
  /** Backdrop variant. */
  backdrop?: "transparent" | "opaque" | "blur";
}

/**
 * Modal command launcher built on HeroUI Pro's Command component.
 *
 * Mount this once near the top of the tree. It opens via the default
 * `Cmd/Ctrl+K` shortcut (configurable through `KbdConfig.paletteShortcut`)
 * or any imperative `service.open()` call.
 *
 * @example
 * ```tsx
 * <CommandPalette variant="split" size="lg" backdrop="blur" />
 * ```
 */
export function CommandPalette({
  variant = "default",
  placeholder: placeholderOverride,
  emptyMessage: emptyMessageOverride,
  emptyHint: emptyHintOverride,
  footerHint,
  size = "lg",
  backdrop = "opaque",
}: CommandPaletteProps): ReactElement {
  // Locale-aware defaults. Reading `t` here (inside the component body)
  // is the only place the hook is available — parameter defaults are
  // evaluated before any hook runs, so they can't call `t(...)` directly.
  const { t } = useI18n();
  const placeholder =
    placeholderOverride ??
    t("kbd.components.command_palette.search_for_products_customers_or_actions");
  const emptyMessage = emptyMessageOverride ?? t("kbd.components.command_palette.no_results");
  const emptyHint =
    emptyHintOverride ??
    t("kbd.components.command_palette.try_a_different_keyword_or_use_one_of_the_shortcuts_above");

  const { isOpen, query, commands, isLoading, service } = useCommandPalette();
  const types = useInject<CommandTypeRegistry>(COMMAND_TYPE_REGISTRY);

  useShortcutScope("command-palette", isOpen);

  const grouped = useMemo(() => groupByType(commands), [commands]);

  const layoutProps: LayoutProps = {
    isOpen,
    query,
    commands,
    isLoading,
    service,
    placeholder,
    emptyMessage,
    emptyHint,
    footerHint,
    size,
    backdrop,
    types,
    grouped,
  };

  switch (variant) {
    case "launcher":
      return <LauncherPaletteLayout {...layoutProps} />;
    case "split":
      return <SplitPaletteLayout {...layoutProps} />;
    case "minimal":
      return <MinimalPaletteLayout {...layoutProps} />;
    case "clean":
      return <CleanPaletteLayout {...layoutProps} />;
    default:
      return <DefaultPaletteLayout {...layoutProps} />;
  }
}
