/**
 * @file authenticated-layout.tsx
 * @module components/layout/authenticated-layout
 *
 * @description
 * The application shell for every authenticated route, built with HeroUI Pro's
 * `AppLayout` + `Sidebar` + `Navbar`.
 *
 * - The **sidebar** is generated from the module {@link "@/app/registry" registry}'s
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
  Cog6ToothIcon,
  UserCircleIcon,
} from "@academorix/ui/icons/outline";
import {
  AppLayout,
  Avatar,
  Button,
  Dropdown,
  Label,
  Navbar,
  Separator,
  Sidebar,
} from "@academorix/ui/react";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { useLocation, useNavigate } from "react-router";

import type { AppResourceMeta } from "@/app/module";
import type { Identity } from "@/types";
import type { ResourceProps } from "@refinedev/core";
import type { Key, ReactNode } from "react";

import { appResources } from "@/app/registry";
import { siteConfig } from "@/config/site";

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
  icon: ReactNode;
  isCurrent: boolean;
}

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
      (resource): resource is ResourceProps & { list: string } => typeof resource.list === "string",
    )
    .map((resource) => {
      const meta = (resource.meta ?? {}) as AppResourceMeta;

      return { resource, meta };
    })
    .filter(
      ({ meta }) =>
        featureAllowed(identity, meta.featureKey) &&
        permissionAllowed(identity, meta.requiredPermission),
    )
    .map(({ resource, meta }) => {
      const href = resource.list;

      return {
        name: resource.name,
        href,
        label: identity?.terminology?.[resource.name] ?? meta.label,
        icon: meta.icon,
        isCurrent: pathname === href || pathname.startsWith(`${href}/`),
      };
    });
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

/** The sidebar: brand header + identity-filtered navigation menu. */
function AppSidebar({ entries }: { entries: NavEntry[] }): ReactNode {
  return (
    <Sidebar>
      <Sidebar.Header>
        <div className="flex items-center gap-2 px-1 py-1">
          <AcademicCapIcon aria-hidden="true" className="size-6 shrink-0 text-accent" />
          <span className="truncate text-base font-semibold text-foreground">
            {siteConfig.name}
          </span>
        </div>
      </Sidebar.Header>

      <Sidebar.Content>
        <Sidebar.Menu>
          {entries.map((entry) => (
            <Sidebar.MenuItem
              key={entry.name}
              href={entry.href}
              id={entry.name}
              isCurrent={entry.isCurrent}
              tooltip={entry.label}
            >
              <Sidebar.MenuIcon>{entry.icon}</Sidebar.MenuIcon>
              <Sidebar.MenuLabel>{entry.label}</Sidebar.MenuLabel>
            </Sidebar.MenuItem>
          ))}
        </Sidebar.Menu>
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
            <span className="text-sm font-semibold text-foreground">{activeLabel}</span>
            <Navbar.Spacer />
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
      {children}
    </AppLayout>
  );
}
