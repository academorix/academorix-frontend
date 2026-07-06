/**
 * @file authenticated-layout.tsx
 * @module components/layout/authenticated-layout
 *
 * @description
 * The **app-level** shell for every authenticated route, built with HeroUI
 * Pro's `AppLayout` + `Sidebar` + `Navbar`. It is app infrastructure, not a
 * feature — it wraps all authenticated modules — so it lives in
 * `components/layout/`, not in any single module. Module-specific sub-layouts
 * belong inside their module.
 *
 * - The **sidebar** is generated from the module {@link "@/lib/module" registry}'s
 *   resources, then **filtered by the current identity**: a resource is shown
 *   only if its `featureKey` is enabled for the tenant and its
 *   `requiredPermission` is granted. Labels use tenant **terminology** (an
 *   academy shows "Students" for the `athletes` resource). Nothing is hardcoded.
 * - `AppLayout` sets up `Sidebar.Provider` internally; we must **not** wrap it.
 *   We forward React Router's `navigate` so `href` menu items route client-side.
 * - The **navbar** carries the mobile menu toggle, the collapse trigger, the
 *   active section title, and a user dropdown wired to `useGetIdentity` /
 *   `useLogout`.
 *
 * @see https://docs.heroui.pro/react/components/app-layout
 */

import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import {
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
} from "@academorix/ui/icons/outline";
import {
  AppLayout,
  Avatar,
  Badge,
  Button,
  Dropdown,
  Kbd,
  Label,
  Navbar,
  Separator,
  Sidebar,
} from "@academorix/ui/react";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { useLocation, useNavigate } from "react-router";

import type { AppResource } from "@/lib/module";
import type { SidebarGroupKey } from "@/lib/module";
import type { Identity } from "@/types";
import type { IconType } from "@academorix/ui/icons";
import type { Key, ReactNode } from "react";

import { SubscriptionBanner } from "@/components/billing";
import { CommandPalette, CommandPaletteProvider, useCommandPalette } from "@/components/command";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BranchSwitcher, OrganizationSwitcher, SeasonSwitcher } from "@/components/scope";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { siteConfig } from "@/config/site.config";
import { appResources } from "@/lib/module";
import { WorkspaceSwitcher } from "@/lib/tenancy";
import { ImpersonationBanner } from "@/modules/auth/components/impersonation-banner";

/** Props for {@link AuthenticatedLayout}. */
interface AuthenticatedLayoutProps {
  /** The routed page content rendered in the main region. */
  children: ReactNode;
}

/** A nav entry derived from a registered resource + the current identity. */
interface NavEntry {
  name: string;
  href: string;
  label: string;
  Icon?: IconType;
  isCurrent: boolean;
  groupKey: SidebarGroupKey | "other";
}

/**
 * Canonical primary-sidebar group order. Matches `DASHBOARD_UX_PLAN.md` §3.1.
 * The trailing `"other"` bucket catches resources whose manifest forgot to
 * declare a `groupKey`; the shell logs a dev warning in that case.
 */
const SIDEBAR_GROUP_ORDER: (SidebarGroupKey | "other")[] = [
  "overview",
  "operations",
  "growth",
  "finance",
  "administration",
  "ai",
  "other",
];

/** Human-readable label for each sidebar group (English default). */
const SIDEBAR_GROUP_LABEL: Record<SidebarGroupKey | "other", string> = {
  overview: "Overview",
  operations: "Operations",
  growth: "Growth",
  finance: "Finance",
  administration: "Administration",
  ai: "AI",
  other: "Other",
};

/** Whether a tenant feature is enabled (fail-open when the set is unknown). */
function featureAllowed(identity: Identity | undefined, featureKey?: string): boolean {
  if (!featureKey) {
    return true;
  }

  const features = identity?.features ?? [];

  return features.length === 0 || features.includes(featureKey);
}

/** Whether the identity holds a permission (`"*"` = superuser). */
function permissionAllowed(identity: Identity | undefined, permission?: string): boolean {
  if (!permission) {
    return true;
  }

  const permissions = identity?.permissions ?? [];

  return permissions.includes("*") || permissions.includes(permission);
}

/**
 * Builds the visible nav entries from the resource registry, filtered by the
 * identity's features + permissions and labeled with tenant terminology.
 */
function useNavEntries(identity: Identity | undefined): NavEntry[] {
  const { pathname } = useLocation();

  return appResources
    .filter(
      (resource): resource is AppResource & { list: string } => typeof resource.list === "string",
    )
    .filter(
      (resource) =>
        featureAllowed(identity, resource.meta.featureKey) &&
        permissionAllowed(identity, resource.meta.requiredPermission),
    )
    .map((resource) => {
      const href = resource.list;

      return {
        name: resource.name,
        href,
        label: identity?.terminology?.[resource.name] ?? resource.meta.label,
        Icon: resource.meta.icon,
        isCurrent: pathname === href || pathname.startsWith(`${href}/`),
        groupKey: resource.meta.groupKey ?? "other",
      };
    });
}

/**
 * Splits nav entries into the canonical primary-sidebar groups (Overview,
 * Operations, Growth, Finance, Administration, AI). Returns groups in the
 * order defined by {@link SIDEBAR_GROUP_ORDER}, dropping any group with no
 * visible entries so we do not render an empty header. Any entry whose module
 * forgot to declare `groupKey` lands in the trailing `"other"` bucket and
 * emits a dev-only warning so the miss is fixed in a follow-up.
 */
function useNavGroups(entries: NavEntry[]): {
  key: SidebarGroupKey | "other";
  label: string;
  entries: NavEntry[];
}[] {
  const byGroup = new Map<SidebarGroupKey | "other", NavEntry[]>();

  for (const entry of entries) {
    const bucket = byGroup.get(entry.groupKey) ?? [];

    bucket.push(entry);
    byGroup.set(entry.groupKey, bucket);
  }

  if (import.meta.env.DEV) {
    const stray = byGroup.get("other");

    if (stray && stray.length > 0) {
      const names = stray.map((entry) => entry.name).join(", ");

      // eslint-disable-next-line no-console
      console.warn(
        `[sidebar] The following resources have no groupKey and fell into "Other": ${names}. ` +
          `Set AppResourceMeta.groupKey on each module manifest.`,
      );
    }
  }

  return SIDEBAR_GROUP_ORDER.flatMap((key) => {
    const bucket = byGroup.get(key);

    if (!bucket || bucket.length === 0) {
      return [];
    }

    return [
      {
        key,
        label: SIDEBAR_GROUP_LABEL[key],
        entries: bucket,
      },
    ];
  });
}

/**
 * Global search trigger rendered in the navbar. Opens the command palette
 * (⌘K) via {@link useCommandPalette}. Renders a chip-shaped button so the
 * affordance looks like a search input at rest.
 */
function GlobalSearchTrigger(): ReactNode {
  const { open } = useCommandPalette();

  return (
    <button
      aria-label="Open command palette"
      className="hidden h-8 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-default/40 px-2.5 text-left text-sm text-muted transition-colors hover:bg-default/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:inline-flex"
      type="button"
      onClick={open}
    >
      <MagnifyingGlassIcon aria-hidden="true" className="size-4" />
      <span className="flex-1 truncate">Search or jump to…</span>
      <Kbd className="text-xs">
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>
    </button>
  );
}

/**
 * Notification bell with an unread-count badge. Phase 1e ships the visual;
 * the drawer + real-time counts land alongside the notifications module in
 * Phase 5 (see `DASHBOARD_UX_PLAN.md` §11.2).
 */
function NotificationBell(): ReactNode {
  return (
    <Button isIconOnly aria-label="Notifications" variant="ghost">
      <Badge color="danger" size="sm">
        <BellIcon aria-hidden="true" className="size-5" />
      </Badge>
    </Button>
  );
}

/**
 * Help popover trigger. Phase 1e renders the button and a static dropdown
 * with placeholder links; a richer help surface (docs, changelog, contact
 * support) lands later.
 */
function HelpMenu(): ReactNode {
  return (
    <Dropdown>
      <Button isIconOnly aria-label="Help and resources" variant="ghost">
        <QuestionMarkCircleIcon aria-hidden="true" className="size-5" />
      </Button>
      <Dropdown.Popover className="min-w-[220px]" placement="bottom end">
        <Dropdown.Menu>
          <Dropdown.Item id="docs" textValue="Documentation">
            <Label>Documentation</Label>
          </Dropdown.Item>
          <Dropdown.Item id="shortcuts" textValue="Keyboard shortcuts">
            <Label>Keyboard shortcuts</Label>
          </Dropdown.Item>
          <Dropdown.Item id="changelog" textValue="Changelog">
            <Label>Changelog</Label>
          </Dropdown.Item>
          <Dropdown.Item id="support" textValue="Contact support">
            <Label>Contact support</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** Navbar user menu, driven by the current identity. */
function UserMenu(): ReactNode {
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  const handleAction = (key: Key): void => {
    if (key === "logout") {
      logout();
    }
  };

  return (
    <Dropdown>
      <Button isIconOnly aria-label="Account menu" variant="ghost">
        <Avatar className="size-8">
          {identity?.avatar_url ? (
            <Avatar.Image alt={identity.name} src={identity.avatar_url} />
          ) : null}
          <Avatar.Fallback>{identity?.initials ?? "?"}</Avatar.Fallback>
        </Avatar>
      </Button>

      <Dropdown.Popover className="min-w-[240px]" placement="bottom end">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar className="size-9">
            {identity?.avatar_url ? (
              <Avatar.Image alt={identity.name} src={identity.avatar_url} />
            ) : null}
            <Avatar.Fallback>{identity?.initials ?? "?"}</Avatar.Fallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {identity?.name ?? "Signed in"}
            </span>
            <span className="truncate text-xs text-muted">{identity?.email ?? ""}</span>
          </div>
        </div>

        <Separator />

        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Item id="account" textValue="Account">
            <UserCircleIcon aria-hidden="true" className="size-4 text-muted" />
            <Label>Account</Label>
          </Dropdown.Item>
          <Dropdown.Item id="settings" textValue="Settings">
            <Cog6ToothIcon aria-hidden="true" className="size-4 text-muted" />
            <Label>Settings</Label>
          </Dropdown.Item>

          <Separator />

          <Dropdown.Item id="logout" textValue="Log out">
            <ArrowRightStartOnRectangleIcon aria-hidden="true" className="size-4 text-muted" />
            <Label>Log out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** The sidebar: brand header + identity-filtered navigation menu, grouped. */
function AppSidebar({ entries }: { entries: NavEntry[] }): ReactNode {
  const groups = useNavGroups(entries);

  return (
    <Sidebar>
      <Sidebar.Header>
        <div className="flex flex-col gap-1 px-1 py-1">
          <div className="flex items-center gap-2">
            <AcademicCapIcon aria-hidden="true" className="size-6 shrink-0 text-accent" />
            <span className="truncate text-base font-semibold text-foreground">
              {siteConfig.name}
            </span>
          </div>
          {/* Active academy (tenant) context; a switcher for cross-tenant users. */}
          <WorkspaceSwitcher />
        </div>
      </Sidebar.Header>

      <Sidebar.Content>
        {groups.map((group) => (
          <Sidebar.Group key={group.key}>
            <Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
            <Sidebar.Menu>
              {group.entries.map((entry) => (
                <Sidebar.MenuItem
                  key={entry.name}
                  href={entry.href}
                  id={entry.name}
                  isCurrent={entry.isCurrent}
                  tooltip={entry.label}
                >
                  <Sidebar.MenuIcon>
                    {entry.Icon ? <entry.Icon aria-hidden="true" className="size-5" /> : null}
                  </Sidebar.MenuIcon>
                  <Sidebar.MenuLabel>{entry.label}</Sidebar.MenuLabel>
                </Sidebar.MenuItem>
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        ))}
      </Sidebar.Content>
    </Sidebar>
  );
}

/**
 * Wraps authenticated pages in the HeroUI Pro app shell (sidebar + navbar).
 *
 * @param props - The routed page to render inside the shell.
 */
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps): ReactNode {
  return (
    <CommandPaletteProvider>
      <AuthenticatedLayoutInner>{children}</AuthenticatedLayoutInner>
      <CommandPalette />
    </CommandPaletteProvider>
  );
}

/**
 * The inner shell — extracted so it can consume `useCommandPalette` (which
 * requires the provider) inside the navbar's search-trigger button.
 */
function AuthenticatedLayoutInner({ children }: AuthenticatedLayoutProps): ReactNode {
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<Identity>();
  const entries = useNavEntries(identity);

  const activeLabel = entries.find((entry) => entry.isCurrent)?.label ?? siteConfig.name;

  return (
    <AppLayout
      navbar={
        <Navbar maxWidth="full">
          <Navbar.Header>
            <AppLayout.MenuToggle />
            <Sidebar.Trigger />
            <span className="hidden text-sm font-semibold text-foreground sm:inline">
              {activeLabel}
            </span>
            <Navbar.Spacer />
            <GlobalSearchTrigger />
            {/* Working-scope switchers — hidden on small screens to save room. */}
            <div className="hidden items-center gap-1.5 lg:flex">
              <OrganizationSwitcher />
              <BranchSwitcher />
              <SeasonSwitcher />
            </div>
            <NotificationBell />
            <HelpMenu />
            <LanguageSwitcher />
            <ThemeSwitcher />
            <UserMenu />
          </Navbar.Header>
        </Navbar>
      }
      navigate={navigate}
      scrollMode="content"
      sidebar={<AppSidebar entries={entries} />}
      sidebarCollapsible="icon"
      sidebarVariant="inset"
    >
      <ImpersonationBanner />
      <SubscriptionBanner />
      {children}
    </AppLayout>
  );
}
