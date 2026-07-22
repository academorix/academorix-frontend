/**
 * @fileoverview KeyboardCatalog — modal listing every registered shortcut.
 *
 * Browse-only view: each row shows the description and combo. Top-bar
 * search and HeroUI `Tabs` for filtering by type. Uses the
 * {@link CommandTypeRegistry} and {@link ShortcutRegistry} to render
 * its content.
 *
 * Visual hierarchy mirrors the redesigned {@link CommandPalette}: tall
 * borderless search, sectioned list with uppercase micro-headers and
 * count chips, refined empty state, and a footer hint bar.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { useInject } from "@stackra/container/react";
import { useI18n } from "@stackra/i18n/react";
import { Str } from "@stackra/support";
import { Kbd, Modal, ScrollShadow, SearchField } from "@stackra/ui/react";
import { Segment } from "@stackra/ui/react";
import { Fragment, useMemo, type ReactElement, type ReactNode } from "react";

import { useKeyboardCatalog } from "../../hooks/use-keyboard-catalog/use-keyboard-catalog.hook";
import { useShortcutScope } from "../../hooks/use-shortcut-scope/use-shortcut-scope.hook";
import { COMMAND_TYPE_REGISTRY, SHORTCUT_REGISTRY } from "../../tokens";

import { KeyboardShortcut } from "./../keyboard-shortcut/keyboard-shortcut.component";

import type { CommandType } from "../../interfaces/command-type.interface";
import type { KeyboardCatalogProps } from "../../interfaces/keyboard-catalog-props.interface";
import type { Shortcut } from "../../interfaces/shortcut.interface";
import type { CommandTypeRegistry } from "../../registries/command-type.registry";
import type { ShortcutRegistry } from "../../registries/shortcut.registry";

/**
 * Modal browser for every registered keyboard shortcut.
 *
 * @example
 * ```tsx
 * <KeyboardCatalog
 *   title={t("kbd.components.keyboard_catalog.keyboard_shortcuts")}
 *   subtitle="Move faster with the keyboard."
 *   searchPlaceholder="Search shortcuts…"
 * />
 * ```
 */
export function KeyboardCatalog({
  title,
  subtitle,
  searchPlaceholder,
  emptyMessage,
  emptyHint,
}: KeyboardCatalogProps): ReactElement {
  const { t } = useI18n();
  const shortcuts = useInject<ShortcutRegistry>(SHORTCUT_REGISTRY);
  const types = useInject<CommandTypeRegistry>(COMMAND_TYPE_REGISTRY);
  const { isOpen, activeTab, query, service } = useKeyboardCatalog();

  // Resolve defaults using t() inside the component
  const resolvedTitle = title ?? t("kbd.components.keyboard_catalog.keyboard_shortcuts");
  const resolvedSubtitle = subtitle ?? t("kbd.components.keyboard_catalog.subtitle");
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t("kbd.components.keyboard_catalog.search_placeholder");
  const resolvedEmptyMessage =
    emptyMessage ?? t("kbd.components.keyboard_catalog.no_shortcuts_match");
  const resolvedEmptyHint =
    emptyHint ??
    t(
      "kbd.components.keyboard_catalog.try_a_different_keyword_or_clear_the_search_to_see_everythin",
    );

  useShortcutScope("keyboard-catalog", isOpen);

  const allShortcuts = shortcuts.getAll();

  const grouped = useMemo(() => {
    const groups = new Map<string, Shortcut[]>();
    const lower = Str.lower(Str.trim(query));

    for (const s of allShortcuts) {
      if (s.hidden) continue;
      if (lower) {
        const haystack = Str.lower(`${s.description} ${s.id}`);
        if (!Str.contains(haystack, lower)) continue;
      }
      const key = s.type ?? s.category ?? "general";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }
    return groups;
  }, [allShortcuts, query]);

  const tabs = useMemo<CommandType[]>(
    () => types.getOrdered().filter((t) => grouped.has(t.id)),
    [types, grouped],
  );

  const tabIds = useMemo(() => ["all", ...tabs.map((t) => t.id)], [tabs]);
  const visibleTab = tabIds.includes(activeTab) ? activeTab : "all";

  const visibleEntries = useMemo<[string, Shortcut[]][]>(() => {
    if (visibleTab === "all") return Array.from(grouped.entries());
    const items = grouped.get(visibleTab);
    return items ? [[visibleTab, items]] : [];
  }, [grouped, visibleTab]);

  const totalVisible = visibleEntries.reduce((sum, [, list]) => sum + list.length, 0);

  return (
    <Modal.Backdrop
      isDismissable
      className="bg-background/60 backdrop-blur-sm"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) service.close();
      }}
    >
      <Modal.Container placement="center" size="lg">
        <Modal.Dialog className="bg-content1 text-foreground rounded-large border-default-100 shadow-default-900/10 dark:shadow-default-50/5 overflow-hidden border p-0 shadow-2xl">
          {/* ── Header ──────────────────────────────────────────── */}
          <Modal.Header className="border-default-100 flex flex-col items-start gap-1 border-b px-6 py-4">
            <Modal.Heading className="text-base leading-none font-semibold">
              {resolvedTitle}
            </Modal.Heading>
            <p className="text-default-500 text-xs">{resolvedSubtitle}</p>
          </Modal.Header>

          {/* ── Search ──────────────────────────────────────────── */}
          <div className="border-default-100 border-b px-4 py-3">
            <SearchField
              // Legitimate autofocus — the KeyboardCatalog is a modal
              // dialog opened by an explicit user gesture (keyboard
              // shortcut or menu click), and the search field is the
              // primary interactive control. Landing focus in it on
              // open matches WAI-ARIA modal dialog authoring practice
              // + every command-palette / spotlight-search convention.
              // eslint-disable-next-line jsx-a11y/no-autofocus -- see comment above
              autoFocus
              fullWidth
              aria-label={t("kbd.components.keyboard_catalog.search_shortcuts")}
              value={query}
              variant="secondary"
              onChange={(v) => service.setQuery(v)}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={resolvedSearchPlaceholder} />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>

          {/* ── Filter Segment ───────────────────────────────────── */}
          <div className="border-default-100 border-b px-4 py-3">
            <Segment
              selectedKey={visibleTab}
              size="sm"
              onSelectionChange={(key) => service.setTab(String(key))}
            >
              <Segment.Item id="all">
                <Segment.Separator />
                {t("kbd.components.keyboard_catalog.all")}{" "}
                {Array.from(grouped.values()).reduce((s, l) => s + l.length, 0)}
              </Segment.Item>
              {tabs.map((tab) => (
                <Segment.Item key={tab.id} id={tab.id}>
                  <Segment.Separator />
                  {t(tab.label)} {grouped.get(tab.id)?.length ?? 0}
                </Segment.Item>
              ))}
            </Segment>
          </div>

          {/* ── Body ────────────────────────────────────────────── */}
          <ScrollShadow hideScrollBar className="max-h-[60vh] overflow-y-auto p-4">
            {visibleEntries.length === 0 ? (
              <CatalogEmpty hint={resolvedEmptyHint} message={resolvedEmptyMessage} />
            ) : (
              <div className="flex flex-col gap-6">
                {visibleEntries.map(([typeId, list]) => {
                  // Rename to `commandType` — the outer `t` (from useI18n)
                  // was previously shadowed here, causing `t(t.label)` to
                  // call the CommandType object as a function.
                  const commandType = types.resolve(typeId);
                  return (
                    <section key={typeId} className="flex flex-col gap-2">
                      <header className="flex items-center gap-2 px-1">
                        {/* `uppercase` + `text-[11px]` + `tracking-[0.08em]` are
                            intentional here — the kbd command-palette aesthetic
                            (Raycast/Linear/Shopify) uses ALL-CAPS + sub-`text-xs`
                            section micro-headers as a genre convention. Exemption
                            is codified in `.kiro/steering/ui-components.md`. */}
                        <h3 className="text-default-500 text-[11px] font-semibold tracking-[0.08em] uppercase">
                          {t(commandType.label)}
                        </h3>
                        {/* text-[11px] — kbd command-palette aesthetic (count chip). */}
                        <span className="text-default-400 text-[11px] font-medium">
                          {list.length}
                        </span>
                      </header>
                      <ul className="divide-default-100 rounded-medium border-default-100 bg-content2/30 flex flex-col divide-y border">
                        {list.map((s) => (
                          <ShortcutRow key={s.id} shortcut={s} />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </ScrollShadow>

          {/* ── Footer ──────────────────────────────────────────── */}
          {/* text-[11px] on the footer — kbd command-palette aesthetic (compact hint bar). */}
          <footer className="border-default-100 bg-content2/40 text-default-500 flex items-center justify-between gap-3 border-t px-4 py-2 text-[11px]">
            <div className="flex items-center gap-3">
              <CatalogFooterHint keys={["↑", "↓"]}>
                {t("kbd.components.keyboard_catalog.navigate")}
              </CatalogFooterHint>
              <CatalogFooterHint keys={["esc"]}>
                {t("kbd.components.keyboard_catalog.close")}
              </CatalogFooterHint>
            </div>
            <span className="tabular-nums">
              {t("kbd.components.keyboard_catalog.shortcut_count", { count: totalVisible })}
            </span>
          </footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/* ── Row ────────────────────────────────────────────────────────── */

interface ShortcutRowProps {
  shortcut: Shortcut;
}

/**
 * Single shortcut row — description + scope on the left, combo(s) on
 * the right. Multiple combos are separated with a faint `or`.
 */
function ShortcutRow({ shortcut }: ShortcutRowProps): ReactElement {
  const { t } = useI18n();
  const combos = Array.isArray(shortcut.combo) ? shortcut.combo : [shortcut.combo];

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-foreground truncate text-sm">{shortcut.description}</span>
        {shortcut.scope && shortcut.scope !== "global" && (
          // `uppercase` — kbd command-palette aesthetic (see the section
          // header above for the full rationale + steering reference).
          <span className="text-default-400 text-[11px] tracking-wide uppercase">
            {t("kbd.catalog.scope_label", { args: { scope: shortcut.scope } })}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {combos.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && (
              // text-[11px] — kbd command-palette aesthetic (inline separator).
              <span className="text-default-400 text-[11px]">{t("kbd.catalog.or_separator")}</span>
            )}
            <KeyboardShortcut combo={c} />
          </Fragment>
        ))}
      </div>
    </li>
  );
}

/* ── Empty ─────────────────────────────────────────────────────── */

interface CatalogEmptyProps {
  message: string;
  hint: string;
}

/**
 * Empty state shown when no shortcuts match the current search.
 */
function CatalogEmpty({ message, hint }: CatalogEmptyProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="bg-default-100 text-default-500 grid size-10 place-items-center rounded-full"
      >
        <svg
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="text-foreground text-sm font-medium">{message}</p>
      <p className="text-default-500 text-xs">{hint}</p>
    </div>
  );
}

/* ── Footer hint ───────────────────────────────────────────────── */

interface CatalogFooterHintProps {
  keys: string[];
  children: ReactNode;
}

/**
 * Small footer shortcut hint — kbd chip(s) followed by a label.
 */
function CatalogFooterHint({ keys, children }: CatalogFooterHintProps): ReactElement {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-center gap-1">
        {keys.map((k) => (
          // text-[10px] — kbd command-palette aesthetic (footer chips).
          <Kbd key={k} className="text-[10px]">
            <Kbd.Content>{k}</Kbd.Content>
          </Kbd>
        ))}
      </span>
      <span>{children}</span>
    </span>
  );
}
