/**
 * @file settings-page-shell.tsx
 * @module modules/settings/pages/settings-page-shell
 *
 * @description
 * Every `/settings/*` page renders through this shell so the secondary
 * sidebar and the section header are consistent. Pass the routed content
 * as children.
 */

import { useLocation } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { SettingsLayout } from "@/modules/settings/layout/settings-layout";

export function SettingsPageShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return <SettingsLayout pathname={pathname}>{children}</SettingsLayout>;
}
