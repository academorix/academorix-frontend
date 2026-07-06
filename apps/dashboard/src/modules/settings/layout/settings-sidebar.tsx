/**
 * @file settings-sidebar.tsx
 * @module modules/settings/layout/settings-sidebar
 *
 * @description
 * The Settings module's secondary sidebar. Renders inside the primary shell
 * (`AuthenticatedLayout`) as an inner navigation column, sits between the
 * primary sidebar and the section content, and groups the sixteen sections
 * by the buckets defined in `DASHBOARD_UX_PLAN.md` §9.2. Modelled after the
 * GitHub / Linear / Vercel settings sidebar pattern.
 */

import { Chip, Sidebar } from "@academorix/ui/react";
import { useGetIdentity } from "@refinedev/core";
import { useLocation } from "react-router";

import type { Identity } from "@/types";
import type { ReactNode } from "react";

import {
  SETTINGS_GROUP_LABEL,
  SETTINGS_GROUP_ORDER,
  settingsSections,
} from "@/modules/settings/settings.sections";

/** Whether the identity has the given permission (`"*"` = superuser). */
function permissionAllowed(identity: Identity | undefined, permission?: string): boolean {
  if (!permission) {
    return true;
  }

  const permissions = identity?.permissions ?? [];

  return permissions.includes("*") || permissions.includes(permission);
}

/**
 * Renders the settings secondary sidebar. Sections the current identity has
 * no permission to view are hidden entirely so the sidebar length reflects
 * the operator's actual surface area.
 */
export function SettingsSidebar(): ReactNode {
  const { data: identity } = useGetIdentity<Identity>();
  const { pathname } = useLocation();

  const visible = settingsSections.filter((section) =>
    permissionAllowed(identity, section.requiredPermission),
  );

  return (
    <Sidebar className="border-e border-border">
      <Sidebar.Content>
        {SETTINGS_GROUP_ORDER.map((groupKey) => {
          const groupItems = visible.filter((section) => section.group === groupKey);

          if (groupItems.length === 0) {
            return null;
          }

          return (
            <Sidebar.Group key={groupKey}>
              <Sidebar.GroupLabel>{SETTINGS_GROUP_LABEL[groupKey]}</Sidebar.GroupLabel>
              <Sidebar.Menu>
                {groupItems.map((section) => {
                  const href = `/settings/${section.id}`;
                  const isCurrent = pathname === href;

                  return (
                    <Sidebar.MenuItem
                      key={section.id}
                      href={href}
                      id={section.id}
                      isCurrent={isCurrent}
                      tooltip={section.label}
                    >
                      <Sidebar.MenuIcon>
                        <section.icon aria-hidden="true" className="size-4" />
                      </Sidebar.MenuIcon>
                      <Sidebar.MenuLabel>{section.label}</Sidebar.MenuLabel>
                      {!section.isAvailable ? (
                        <Chip size="sm" variant="secondary">
                          <Chip.Label>Soon</Chip.Label>
                        </Chip>
                      ) : null}
                    </Sidebar.MenuItem>
                  );
                })}
              </Sidebar.Menu>
            </Sidebar.Group>
          );
        })}
      </Sidebar.Content>
    </Sidebar>
  );
}
