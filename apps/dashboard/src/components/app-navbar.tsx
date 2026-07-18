/**
 * @file app-navbar.tsx
 * @module components/app-navbar
 *
 * @description
 * Top navbar: menu toggle, sidebar trigger, active-section title, command
 * palette trigger (⌘K chip), notifications, help menu, theme switcher,
 * language switcher, and the identity-driven user menu.
 *
 * The user menu is fed by `useGetIdentity()` from Refine which resolves
 * through `authProvider.getIdentity()` — the stub in
 * `src/refine/auth-provider.ts` loads the response from
 * `src/refine/data/current-user.json`, so the menu items, branch switcher,
 * and avatar all reflect that fixture. Swap the fixture for a real
 * `GET /api/me` call when the backend lands.
 */

import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  Header,
  Label,
  SearchField,
  Separator,
  Tooltip,
} from "@heroui/react";
import { AppLayout, Navbar, Sidebar } from "@heroui-pro/react";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { useLocation, useNavigate } from "@stackra/routing/react";

import type { KeyboardEvent, ReactNode } from "react";
import type { Key } from "react";

import type { Identity, UserBranchEntry, UserMenuEntry } from "@/refine/auth-provider";

import { useBranchSwitcher } from "@/hooks/use-branch-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { ScopeSwitcher } from "@/components/scope-switcher";
import { ShortcutKbd } from "@/lib/kbd";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Iconify } from "@/icons/iconify";
import { findNavItemByPath } from "@/modules/registry";
import { useAiAssistantOpener } from "@/hooks/use-ai-assistant-opener";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useKeyboardShortcutSheet } from "@/components/keyboard-shortcut-sheet";
import { useTranslate } from "@/hooks/use-translate";

// ---------------------------------------------------------------------------
// ⌘K launcher trigger — rendered as HeroUI's `SearchField` so we get the
// canonical search-bar look (icon, focus ring, ⌘K suffix) and hand off
// to the command palette on focus / click. Real querying happens inside
// the palette dialog; the field itself is a trigger, not an input.
//
// WHY use SearchField.Input (not raw <Input>) inside SearchField.Group:
// SearchField.Input inherits the group's flex-1 wiring, focus-ring
// coordination, and the aria-controls plumbing wired by React Aria.
// A raw <Input> renders visually but loses the flex sizing, which is
// exactly what surfaced the "truncated placeholder" bug in the earlier
// pass. SearchField.Group renders any trailing siblings after the input
// (here, a <Kbd>) as trailing add-ons, matching the OSS compound shape.
// ---------------------------------------------------------------------------

function CommandPaletteTrigger(): ReactNode {
  const { open } = useCommandPalette();
  const t = useTranslate();

  const handleActivate = () => open();
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      open();
    }
  };

  return (
    <SearchField
      aria-label={t("command.title", undefined, "Command palette")}
      className="hidden min-w-[240px] md:inline-flex"
      isReadOnly
      variant="secondary"
    >
      <SearchField.Group
        className="h-8 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-accent/40 hover:bg-default/40"
        onClick={handleActivate}
      >
        <SearchField.SearchIcon />
        <SearchField.Input
          className="cursor-pointer"
          onFocus={handleActivate}
          onKeyDown={handleKeyDown}
          placeholder={t("app.search.placeholder", undefined, "Search or jump to…")}
          readOnly
        />
        {/* WHY ShortcutKbd (not raw Kbd.Abbr): matches the
            keyboard-shortcut chip visual used everywhere else in
            the app — sidebar, palette, dropdown menus, tooltips.
            Same tokenisation logic, same tabular-nums text sizing. */}
        <ShortcutKbd className="me-2" shortcut="Cmd+K" />
      </SearchField.Group>
    </SearchField>
  );
}

// ---------------------------------------------------------------------------
// Help menu (contextual)
// ---------------------------------------------------------------------------

function HelpMenu(): ReactNode {
  const sheet = useKeyboardShortcutSheet();
  const t = useTranslate();

  const handleAction = (key: Key) => {
    const raw = String(key);

    if (raw === "shortcuts") sheet.open();
    if (raw === "docs") window.open("https://docs.academorix.com", "_blank", "noopener,noreferrer");
    if (raw === "support") window.open("mailto:support@academorix.com", "_blank");
  };

  return (
    <Dropdown>
      <Button aria-label={t("app.help", undefined, "Help")} isIconOnly size="sm" variant="ghost">
        <Iconify className="size-5" icon="circle-question" />
      </Button>
      <Dropdown.Popover className="min-w-52" placement="bottom end">
        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Item
            id="shortcuts"
            textValue={t("command.help.shortcuts", undefined, "Keyboard shortcuts")}
          >
            <Iconify className="size-4" icon="keyboard" />
            <Label>{t("command.help.shortcuts", undefined, "Keyboard shortcuts")}</Label>
            {/* WHY ShortcutKbd: even a single-key shortcut like "?"
                should route through the shared renderer so the visual
                weight (text-[10px], tabular-nums) matches every
                other keyboard-shortcut chip across the app. */}
            <ShortcutKbd className="ms-auto" shortcut="?" />
          </Dropdown.Item>
          <Dropdown.Item id="docs" textValue={t("command.help.docs", undefined, "Documentation")}>
            <Iconify className="size-4" icon="book" />
            <Label>{t("command.help.docs", undefined, "Documentation")}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="support" textValue={t("app.support", undefined, "Contact support")}>
            <Iconify className="size-4" icon="envelope" />
            <Label>{t("app.support", undefined, "Contact support")}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// Rich user avatar (used inside the dropdown header)
// ---------------------------------------------------------------------------

function IdentityCard({ identity }: { identity: Identity }): ReactNode {
  const workspace = identity.workspace;
  const branchName = workspace?.activeBranchName;

  return (
    <div className="flex flex-col gap-3 border-b border-border p-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0" color="accent">
          {identity.avatarUrl ? (
            <Avatar.Image alt={identity.name} src={identity.avatarUrl} />
          ) : null}
          <Avatar.Fallback>{identity.initials}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{identity.name}</p>
          <p className="truncate text-xs text-muted">{identity.email}</p>
        </div>
      </div>
      {workspace ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {workspace.plan ? (
            <Chip color="accent" size="sm" variant="soft">
              <Iconify className="size-3" icon="crown" />
              <Chip.Label>{workspace.plan}</Chip.Label>
            </Chip>
          ) : null}
          {branchName ? (
            <Chip size="sm" variant="secondary">
              <Iconify className="size-3" icon="location" />
              <Chip.Label>{branchName}</Chip.Label>
            </Chip>
          ) : null}
          {identity.role ? (
            <Chip size="sm" variant="secondary">
              <Chip.Label>{identity.role}</Chip.Label>
            </Chip>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Branch switcher — rendered inside the user dropdown when the identity has
// more than one branch. Wired to `useGetIdentity` today; in production this
// would `POST /api/me/active-branch` and refetch identity.
// ---------------------------------------------------------------------------

function BranchSwitcherSection({
  branches,
  activeId,
  onSwitch,
}: {
  branches: UserBranchEntry[];
  activeId: string | undefined;
  onSwitch: (id: string) => void;
}): ReactNode {
  if (branches.length <= 1) return null;

  return (
    <>
      <Dropdown.Section>
        <Header>Switch branch</Header>
        {branches.map((branch) => (
          <Dropdown.Item
            key={`branch:${branch.id}`}
            id={`branch:${branch.id}`}
            onAction={() => onSwitch(branch.id)}
            textValue={branch.name}
          >
            <Iconify className="size-4" icon="location" />
            <Label className="flex flex-col items-start gap-0 leading-tight">
              <span>{branch.name}</span>
              {branch.city ? <span className="text-[10px] text-muted">{branch.city}</span> : null}
            </Label>
            {branch.id === activeId ? (
              <Iconify className="ms-auto size-4 text-accent" icon="check" />
            ) : null}
          </Dropdown.Item>
        ))}
      </Dropdown.Section>
      <Separator />
    </>
  );
}

// ---------------------------------------------------------------------------
// User menu — trigger is the enhanced avatar, popover renders identity card
// + menu items pulled from the identity JSON.
// ---------------------------------------------------------------------------

function UserMenu(): ReactNode {
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const switchBranch = useBranchSwitcher();
  const t = useTranslate();

  const menu: UserMenuEntry[] = identity?.menu ?? [];
  const branches: UserBranchEntry[] = identity?.branches ?? [];
  const activeBranchId = identity?.workspace?.activeBranchId;

  const handleAction = (key: Key) => {
    const entry = menu.find((item) => item.id === String(key));

    if (!entry) return;

    if (entry.action === "sign-out") {
      logout();

      return;
    }
    if (entry.href) {
      if (entry.external) {
        window.open(entry.href, "_blank", "noopener,noreferrer");
      } else {
        navigate(entry.href);
      }
    }
  };

  const handleBranchSwitch = (branchId: string) => {
    switchBranch(branchId);
  };

  return (
    <Dropdown>
      <Button
        aria-label={t("app.account", undefined, "Account")}
        className="items-center gap-2 px-1.5"
        variant="ghost"
      >
        <Avatar className="size-8 shrink-0 self-center" color="accent">
          {identity?.avatarUrl ? (
            <Avatar.Image alt={identity.name} src={identity.avatarUrl} />
          ) : null}
          <Avatar.Fallback>{identity?.initials ?? "?"}</Avatar.Fallback>
        </Avatar>
        <div className="hidden min-w-0 flex-col items-start justify-center self-center leading-tight lg:flex">
          <span className="truncate text-sm font-medium text-foreground">
            {identity?.name ?? "…"}
          </span>
          {identity?.workspace?.activeBranchName ? (
            <span className="truncate text-[11px] text-muted">
              {identity.workspace.activeBranchName}
            </span>
          ) : null}
        </div>
        <Iconify className="size-4 shrink-0 self-center text-muted" icon="chevron-down" />
      </Button>
      <Dropdown.Popover className="min-w-72 p-0" placement="bottom end">
        {identity ? <IdentityCard identity={identity} /> : null}
        <div className="p-1">
          <Dropdown.Menu onAction={handleAction}>
            <BranchSwitcherSection
              activeId={activeBranchId}
              branches={branches}
              onSwitch={handleBranchSwitch}
            />
            <Dropdown.Section>
              <Header>Account</Header>
              {menu.map((entry) => (
                <Dropdown.Item
                  key={entry.id}
                  id={entry.id}
                  textValue={entry.label}
                  variant={entry.variant === "danger" ? "danger" : undefined}
                >
                  <Iconify className="size-4" icon={entry.icon} />
                  <Label>{entry.label}</Label>
                  {entry.shortcut ? (
                    // WHY ShortcutKbd: the entry.shortcut string may
                    // include modifiers (e.g. "Cmd+K") — the shared
                    // renderer parses those into Kbd.Abbr so the
                    // ⌘/⌥/⇧ glyphs land correctly per OS without
                    // wiring per-item logic here.
                    <ShortcutKbd className="ms-auto" shortcut={entry.shortcut} />
                  ) : entry.external ? (
                    <Iconify className="ms-auto size-3.5 text-muted" icon="arrow-up-from-square" />
                  ) : null}
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          </Dropdown.Menu>
        </div>
      </Dropdown.Popover>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// Assistant icon — opens the AI Assistant sheet from any route
// ---------------------------------------------------------------------------

/**
 * Icon-only trigger that pops the workspace AI Assistant sheet.
 *
 * The sheet itself is owned by {@link AiAssistantProvider} at
 * the App level. When no dashboard editor is registered (i.e.
 * we're outside `/dashboard`) the provider's `open()` handler
 * emits a toast pointing the operator at the dashboard instead
 * of forcing a route change — the icon still feels responsive
 * without hijacking navigation.
 *
 * `aria-pressed` mirrors the sheet's open state so the button
 * visually depresses while the sheet is up.
 */
function AssistantIconButton(): ReactNode {
  const { open, isOpen } = useAiAssistantOpener();
  const t = useTranslate();
  const label = t("app.assistant", undefined, "Assistant");

  return (
    <Tooltip>
      <Button
        aria-label={t("app.assistant.aria", undefined, "Open workspace assistant")}
        aria-pressed={isOpen}
        className="hidden md:inline-flex"
        isIconOnly
        onPress={open}
        size="sm"
        variant="ghost"
      >
        <Iconify className="size-5 text-accent" icon="sparkles" />
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Navbar composition
// ---------------------------------------------------------------------------

export function AppNavbar(): ReactNode {
  const { pathname } = useLocation();
  const active = findNavItemByPath(pathname);
  const t = useTranslate();
  const title = active?.label ?? t("app.brand.name", undefined, "Academorix");
  const { open: openPalette } = useCommandPalette();

  return (
    <Navbar maxWidth="full">
      <Navbar.Header className="gap-2">
        <AppLayout.MenuToggle />
        <Sidebar.Trigger />
        <div className="ml-1 flex min-w-0 flex-col">
          <span className="truncate text-sm leading-tight font-semibold text-foreground">
            {title}
          </span>
          <span className="hidden truncate text-xs leading-tight text-muted sm:block">
            {t("app.brand.subtitle", undefined, "Academorix control center")}
          </span>
        </div>

        <Navbar.Spacer />

        <ScopeSwitcher />

        <CommandPaletteTrigger />

        <Button
          aria-label={t("command.title", undefined, "Command palette")}
          className="md:hidden"
          isIconOnly
          onPress={openPalette}
          size="sm"
          variant="ghost"
        >
          <Iconify className="size-5" icon="magnifier" />
        </Button>

        <NotificationBell />

        {/*
         * WHY the Assistant icon lives between the bell and the
         * help menu: it groups with the other "workspace tools"
         * (notifications / help / theme / language) rather than
         * competing with the identity pill on the right. The
         * icon is hidden on mobile widths — the sheet's overlay
         * doesn't do well on narrow viewports and the palette
         * (⌘K) covers the same intent.
         */}
        <AssistantIconButton />

        <HelpMenu />
        <LanguageSwitcher />
        <ThemeSwitcher />

        <Navbar.Separator />

        <UserMenu />
      </Navbar.Header>
    </Navbar>
  );
}
