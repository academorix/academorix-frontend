/**
 * @file authenticated-layout.tsx
 * @module components/layout/authenticated-layout
 *
 * @description
 * The application shell for every authenticated route, built with HeroUI Pro's
 * `AppLayout` + `Sidebar` + `Navbar`.
 *
 * - The **sidebar menu** is generated from Refine's `useMenu()` (which reads
 *   the `resources` registry), so adding a resource automatically adds a nav
 *   item — no duplicate menu config.
 * - `AppLayout` sets up `Sidebar.Provider` internally; we must **not** wrap it
 *   ourselves. We forward React Router's `navigate` so `href`-based menu items
 *   route client-side.
 * - The **navbar** carries the mobile menu toggle, the sidebar collapse
 *   trigger, the current section title, and a user dropdown wired to Refine's
 *   `useGetIdentity` / `useLogout`.
 *
 * @see https://docs.heroui.pro/react/components/app-layout
 */

import {
  AcademicCapIcon,
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
import { useGetIdentity, useLogout, useMenu } from "@refinedev/core";
import { useNavigate } from "react-router";

import type { Identity } from "@/types";
import type { Key, ReactNode } from "react";

import { siteConfig } from "@/config/site";

/** Props for {@link AuthenticatedLayout}. */
interface AuthenticatedLayoutProps {
  /** The routed page content rendered in the main region. */
  children: ReactNode;
}

/** Sidebar footer / navbar user menu, driven by the current identity. */
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

/** The sidebar: brand header + resource-driven navigation menu. */
function AppSidebar(): ReactNode {
  const { menuItems, selectedKey } = useMenu();

  const items = menuItems.filter((item) => Boolean(item.route));

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
          {items.map((item) => (
            <Sidebar.MenuItem
              key={item.key}
              href={item.route}
              id={String(item.key)}
              isCurrent={item.key === selectedKey}
              tooltip={item.label}
            >
              <Sidebar.MenuIcon>{item.icon}</Sidebar.MenuIcon>
              <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
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
  const { menuItems, selectedKey } = useMenu();

  const activeLabel = menuItems.find((item) => item.key === selectedKey)?.label ?? siteConfig.name;

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
      sidebar={<AppSidebar />}
      sidebarCollapsible="icon"
      sidebarVariant="inset"
    >
      {children}
    </AppLayout>
  );
}
