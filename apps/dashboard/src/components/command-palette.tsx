/**
 * @file command-palette.tsx
 * @module components/command-palette
 *
 * @description
 * The global ⌘K command palette. Groups (in order):
 *  1. **Recent** — last 5 records opened (localStorage-backed).
 *  2. **Navigate** — every resource with a `list` route, bucketed by group.
 *  3. **Create** — every resource with a `create` route, bucketed by group.
 *  4. **Actions** — module-supplied verbs + shell actions (Toggle theme,
 *     Sign out, Copy link, Open settings).
 *  5. **Help** — Open documentation, Show keyboard shortcuts, Contact support,
 *     Changelog.
 *
 * ## Visual language
 *  • `Command.Container size="lg"` — wider dialog than the default.
 *  • Every group heading carries a small tinted-square icon that
 *    matches the AgentHub reference palette.
 *  • Every item renders `icon + (label + optional description) + shortcut Kbd`.
 *  • Keyboard shortcuts render via {@link ShortcutKbd} — same visual as
 *    the sidebar chips + the keyboard-shortcut sheet.
 */

import { Command } from "@heroui-pro/react";
import { useMemo } from "react";
import { useNavigate } from "@stackra/routing/react";

import type { SidebarGroupKey } from "@/lib/module";
import type { Key, ReactNode } from "react";

import { ShortcutKbd } from "@/lib/kbd";
import { groupLabel } from "@/lib/groups";
import { Iconify } from "@/icons/iconify";
import { clearRecentRecords, readRecentRecords } from "@/lib/recent-records";
import { appCommands, appResources } from "@/modules/registry";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useKeyboardShortcutSheet } from "@/components/keyboard-shortcut-sheet";
import { useLocale } from "@/hooks/use-locale";
import { useTranslate } from "@/hooks/use-translate";
import { useTheme } from "@/hooks/use-theme";

/**
 * The palette's five verbs. `recent` is technically a per-item verb
 * for the top-of-list history bucket; the rest match the sidebar's
 * canonical action taxonomy.
 */
type PaletteVerb = "recent" | "navigate" | "create" | "action" | "help";

/** A palette entry after normalisation from resources / commands / shell. */
type PaletteCommand = {
  id: string;
  label: string;
  /**
   * Optional secondary line rendered under the label. Used to
   * disambiguate items that share a verb (navigate row shows its
   * group name, create shows a "Create a new X" helper, actions
   * accept their own copy). Kept a compact single line so the
   * palette never grows unreasonably tall.
   */
  description?: string;
  verb: PaletteVerb;
  route?: string;
  onSelect?: (ctx: { navigate: (to: string) => void }) => void;
  icon: string;
  group?: SidebarGroupKey | "other";
  shortcut?: string;
  keywords?: string[];
};

/** Fallback icon per verb — used when a resource forgets its own token. */
const VERB_ICON: Record<PaletteVerb, string> = {
  recent: "clock",
  navigate: "arrow-right",
  create: "circle-plus",
  action: "bolt",
  help: "circle-question",
};

/** Icon rendered inside the group heading's tinted square, per verb. */
const VERB_GROUP_ICON: Record<PaletteVerb, string> = {
  recent: "clock",
  navigate: "compass",
  create: "circle-plus",
  action: "bolt",
  help: "circle-question",
};

// ---------------------------------------------------------------------------
// Command construction
// ---------------------------------------------------------------------------

/**
 * Build the navigate + create + module-command commands from the
 * resource registry. Keywords stack the resource's `name`, `label`,
 * `singularLabel`, and `groupKey` so the fuzzy filter picks up
 * synonyms (e.g. searching "roster" surfaces Athletes when
 * `singularLabel = "Athlete"` and `keywords = ["roster"]`).
 */
function buildNavigateAndCreate(): PaletteCommand[] {
  const commands: PaletteCommand[] = [];

  for (const resource of appResources) {
    const group = resource.meta.groupKey ?? "other";
    const label = resource.meta.label;
    const singular = resource.meta.singularLabel ?? label;
    const groupName = groupLabel[group];

    // WHY the keyword stack: the Command dialog filters on
    // `Command.Item.textValue`, which we already fill with the
    // human label + description. Adding synonyms as extra keyword
    // tokens gives the fuzzy match more hooks without polluting
    // the rendered row.
    const baseKeywords = [resource.name, label, singular, groupName, "go", "goto", "open"].filter(
      (value): value is string => Boolean(value),
    );

    if (typeof resource.list === "string") {
      commands.push({
        id: `navigate:${resource.name}`,
        label,
        description: groupName,
        verb: "navigate",
        route: resource.list,
        icon: resource.meta.icon ?? "arrow-right",
        group,
        shortcut: resource.meta.shortcuts?.navigate,
        keywords: baseKeywords,
      });
    }

    if (typeof resource.create === "string") {
      commands.push({
        id: `create:${resource.name}`,
        label,
        description: `Create a new ${singular.toLowerCase()}`,
        verb: "create",
        route: resource.create,
        icon: "circle-plus",
        group,
        shortcut: resource.meta.shortcuts?.create,
        keywords: [...baseKeywords, "new", "add", "create"],
      });
    }
  }

  for (const command of appCommands) {
    commands.push({
      id: command.id,
      label: command.label,
      description: command.description,
      verb: "action",
      route: command.route,
      onSelect: command.onSelect,
      icon: command.icon ?? "bolt",
      group: command.groupKey,
      shortcut: command.shortcut,
      keywords: command.keywords ?? [command.resourceName],
    });
  }

  return commands;
}

/**
 * A grouped section rendered as a `Command.Group`. `icon` is
 * optional; when present it renders inside the heading's small
 * tinted square to match the sidebar aesthetic.
 */
type PaletteGroup = {
  key: string;
  heading: string;
  verb: PaletteVerb;
  icon?: string;
  commands: PaletteCommand[];
};

/**
 * Bucket the flat command list into `verb × group` sections and
 * order the resulting `PaletteGroup[]` deterministically. Order is:
 *
 *   navigate/overview → navigate/operations → … → create/overview → …
 *   → action/*
 *
 * which mirrors the sidebar's "read then write" reading rhythm.
 */
function bucketCommands(
  commands: PaletteCommand[],
  t: (key: string, vars?: Record<string, unknown>, fallback?: string) => string,
): PaletteGroup[] {
  const order: (SidebarGroupKey | "other")[] = [
    "overview",
    "operations",
    "growth",
    "finance",
    "administration",
    "ai",
    "other",
  ];
  const verbs: PaletteVerb[] = ["navigate", "create", "action"];
  const buckets = new Map<string, PaletteGroup>();

  for (const command of commands) {
    const group = command.group ?? "other";
    const sectionKey = `${command.verb}:${group}`;
    const groupName = groupLabel[group];
    const heading = t(
      `command.section.${command.verb}`,
      { group: groupName },
      `${command.verb === "navigate" ? "Navigate" : command.verb === "create" ? "Create" : "Actions"} · ${groupName}`,
    );
    const existing = buckets.get(sectionKey);

    if (existing) {
      existing.commands.push(command);
    } else {
      buckets.set(sectionKey, {
        key: sectionKey,
        heading,
        verb: command.verb,
        icon: VERB_GROUP_ICON[command.verb],
        commands: [command],
      });
    }
  }

  const out: PaletteGroup[] = [];

  for (const verb of verbs) {
    for (const group of order) {
      const entry = buckets.get(`${verb}:${group}`);

      if (entry) out.push(entry);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// UI atoms
// ---------------------------------------------------------------------------

/**
 * The small tinted-icon-in-a-square rendered in a group heading and
 * on every `Command.Item`. Pulls its own colour from the current
 * theme's `--color-default` so it reads correctly in both light and
 * dark modes without a variant map here.
 */
function PaletteIconTile({ icon, size = "sm" }: { icon: string; size?: "sm" | "xs" }): ReactNode {
  const box = size === "sm" ? "size-6" : "size-5";

  return (
    <span
      className={`flex bg-default/60 text-muted ${box} shrink-0 items-center justify-center rounded-md`}
    >
      <Iconify className="size-3.5" icon={icon} />
    </span>
  );
}

/**
 * A single `Command.Item` with the palette's canonical layout:
 * tile + (label + optional description) + trailing shortcut Kbd.
 * The item's `textValue` bundles verb + label + description +
 * keywords so the fuzzy filter fires on every synonym.
 */
function PaletteItem({
  command,
  labelOverride,
}: {
  command: PaletteCommand;
  labelOverride?: string;
}): ReactNode {
  const label = labelOverride ?? command.label;
  const searchable = [command.verb, label, command.description ?? "", ...(command.keywords ?? [])]
    .filter(Boolean)
    .join(" ");

  return (
    <Command.Item className="min-h-10 py-2" id={command.id} textValue={searchable}>
      <PaletteIconTile icon={command.icon || VERB_ICON[command.verb]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-foreground">{label}</span>
        {command.description ? (
          <span className="truncate text-xs text-muted">{command.description}</span>
        ) : null}
      </div>
      {command.shortcut ? <ShortcutKbd className="ms-auto" shortcut={command.shortcut} /> : null}
    </Command.Item>
  );
}

/**
 * Group heading with a leading tinted icon tile. Rendered as a JSX
 * node passed to `Command.Group heading={…}` so the compound treats
 * it as arbitrary content (which it does — see the "Multiple Search
 * Terms" example in the HeroUI Pro docs).
 */
function PaletteGroupHeading({ icon, label }: { icon?: string; label: string }): ReactNode {
  return (
    <span className="flex items-center gap-2 pt-2 pb-1 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
      {icon ? <PaletteIconTile icon={icon} size="xs" /> : null}
      <span>{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function CommandPalette(): ReactNode {
  const { isOpen, close } = useCommandPalette();
  const navigate = useNavigate();
  const t = useTranslate();
  const { mode, setMode } = useTheme();
  const { locale, setLocale } = useLocale();
  const shortcutSheet = useKeyboardShortcutSheet();

  const staticCommands = useMemo(() => buildNavigateAndCreate(), []);

  // ---------------------------------------------------------------------------
  // Recent group — hydrated on open so we pick up navigations from other tabs
  // ---------------------------------------------------------------------------
  const recentCommands: PaletteCommand[] = useMemo(() => {
    if (!isOpen) return [];

    return readRecentRecords().map((entry) => ({
      id: `recent:${entry.resource}:${entry.id}`,
      label: entry.label,
      description: entry.resource,
      verb: "recent" as const,
      route: `/${entry.resource}/${entry.id}`,
      icon: entry.icon ?? "clock",
      keywords: [entry.resource, entry.label],
    }));
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Shell action commands
  // ---------------------------------------------------------------------------
  const shellCommands: PaletteCommand[] = useMemo(
    () => [
      {
        id: "action:toggle-theme",
        label: mode === "dark" ? "Switch to light mode" : "Switch to dark mode",
        description: "Toggle the application theme",
        verb: "action",
        icon: mode === "dark" ? "sun" : "moon",
        keywords: ["theme", "dark", "light", "appearance"],
        onSelect: () => setMode(mode === "dark" ? "light" : "dark"),
      },
      {
        id: "action:toggle-locale",
        label: locale === "ar" ? "Switch to English" : "Switch to Arabic",
        description: "Toggle the interface language",
        verb: "action",
        icon: "globe",
        keywords: ["language", "locale", "arabic", "english"],
        onSelect: () => setLocale(locale === "ar" ? "en" : "ar"),
      },
      {
        id: "action:open-settings",
        label: "Open Settings",
        description: "Workspace and account preferences",
        verb: "action",
        route: "/settings",
        icon: "gear",
        shortcut: "G ,",
        keywords: ["settings", "preferences", "config"],
      },
      {
        id: "action:copy-link",
        label: "Copy link to current page",
        description: "Copies the current URL to your clipboard",
        verb: "action",
        icon: "link",
        keywords: ["url", "share", "copy"],
        onSelect: () => {
          if (typeof window !== "undefined" && navigator?.clipboard) {
            void navigator.clipboard.writeText(window.location.href);
          }
        },
      },
      {
        id: "action:clear-recents",
        label: "Clear recent items",
        description: "Empty the Recent group",
        verb: "action",
        icon: "trash-bin",
        keywords: ["reset", "recent", "history"],
        onSelect: () => clearRecentRecords(),
      },
      {
        id: "action:sign-out",
        label: "Sign out",
        description: "End your session",
        verb: "action",
        icon: "arrow-right-from-square",
        keywords: ["logout", "signout"],
        route: "/logout",
      },
    ],
    [mode, setMode, locale, setLocale],
  );

  // ---------------------------------------------------------------------------
  // Help group
  // ---------------------------------------------------------------------------
  const helpCommands: PaletteCommand[] = useMemo(
    () => [
      {
        id: "help:shortcuts",
        label: "Show keyboard shortcuts",
        description: "Open the shortcut cheat sheet",
        verb: "help",
        icon: "keyboard",
        shortcut: "?",
        onSelect: () => shortcutSheet.open(),
        keywords: ["shortcuts", "keybindings", "hotkeys"],
      },
      {
        id: "help:documentation",
        label: "Open documentation",
        description: "docs.academorix.com",
        verb: "help",
        icon: "book",
        route: "https://docs.academorix.com",
        keywords: ["docs", "help", "manual"],
      },
      {
        id: "help:changelog",
        label: "What's new",
        description: "Latest product updates",
        verb: "help",
        icon: "sparkles",
        route: "https://academorix.com/changelog",
        keywords: ["changelog", "release notes", "updates"],
      },
      {
        id: "help:support",
        label: "Contact support",
        description: "Email the Academorix team",
        verb: "help",
        icon: "envelope",
        route: "mailto:support@academorix.com",
        keywords: ["support", "help", "email"],
      },
    ],
    [shortcutSheet],
  );

  const groupedCore = useMemo(() => bucketCommands(staticCommands, t), [staticCommands, t]);

  const groups: PaletteGroup[] = useMemo(() => {
    const out: PaletteGroup[] = [];

    if (recentCommands.length > 0) {
      out.push({
        key: "recent",
        heading: t("command.section.recent", undefined, "Recent"),
        verb: "recent",
        icon: VERB_GROUP_ICON.recent,
        commands: recentCommands,
      });
    }
    out.push(...groupedCore);
    out.push({
      key: "action:shell",
      heading: t("command.section.actions", undefined, "Actions"),
      verb: "action",
      icon: VERB_GROUP_ICON.action,
      commands: shellCommands,
    });
    out.push({
      key: "help",
      heading: t("command.section.help", undefined, "Help"),
      verb: "help",
      icon: VERB_GROUP_ICON.help,
      commands: helpCommands,
    });

    return out;
  }, [recentCommands, groupedCore, shellCommands, helpCommands, t]);

  const allCommands = useMemo(
    () => [...recentCommands, ...staticCommands, ...shellCommands, ...helpCommands],
    [recentCommands, staticCommands, shellCommands, helpCommands],
  );

  const handleAction = (key: Key) => {
    const command = allCommands.find((entry) => entry.id === String(key));

    if (!command) return;

    close();
    if (command.onSelect) {
      command.onSelect({ navigate });
    } else if (command.route) {
      if (command.route.startsWith("http") || command.route.startsWith("mailto:")) {
        window.open(command.route, "_blank", "noopener,noreferrer");
      } else {
        navigate(command.route);
      }
    }
  };

  return (
    <Command>
      <Command.Backdrop
        isOpen={isOpen}
        onOpenChange={(next: boolean) => (next ? undefined : close())}
      >
        {/*
         * WHY size="lg": the palette needs to render three columns
         * of information per row (icon tile, label + description
         * stack, trailing shortcut). The default "md" width crops
         * the description on longer resource names — "lg" gives
         * every row breathing room without letting descriptions run
         * off the edge on 1440px viewports.
         */}
        <Command.Container size="lg">
          <Command.Dialog>
            <Command.InputGroup>
              <Command.InputGroup.Prefix>
                <Iconify icon="magnifier" />
              </Command.InputGroup.Prefix>
              <Command.InputGroup.Input
                placeholder={t("command.placeholder", undefined, "Type a command…")}
              />
              <Command.InputGroup.ClearButton />
              <Command.InputGroup.Suffix>
                <ShortcutKbd shortcut="Escape" />
              </Command.InputGroup.Suffix>
            </Command.InputGroup>
            <Command.List onAction={handleAction}>
              {groups.map((group) => (
                <Command.Group
                  key={group.key}
                  heading={<PaletteGroupHeading icon={group.icon} label={group.heading} />}
                >
                  {group.commands.map((command) => {
                    // WHY the label transform lives here (not in
                    // buildNavigateAndCreate): the translation
                    // hook only exists inside the component tree,
                    // so we resolve "Go to X" / "Create X" at
                    // render time — cheap, and keeps the builder
                    // hook-free for reuse in tests.
                    const labelOverride =
                      command.verb === "navigate"
                        ? t(
                            "command.verb.navigate",
                            { label: command.label },
                            `Go to ${command.label}`,
                          )
                        : command.verb === "create"
                          ? t(
                              "command.verb.create",
                              { label: command.label },
                              `Create ${command.label}`,
                            )
                          : undefined;

                    return (
                      <PaletteItem
                        key={command.id}
                        command={command}
                        labelOverride={labelOverride}
                      />
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
