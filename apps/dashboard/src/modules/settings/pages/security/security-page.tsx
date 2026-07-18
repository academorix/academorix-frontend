/**
 * @file security-page.tsx
 * @module modules/settings/pages/security/security-page
 *
 * @description
 * `/settings/security` — hosts every account-security surface inside
 * a three-tab layout so the caller can move between panels without
 * losing scroll position. `?tab=password|sessions|mfa` deep-links
 * into a specific panel (used by email links).
 */

import { Tabs } from "@heroui/react";
import { useSearchParams } from "@stackra/routing/react";

import type { Key } from "react";
import type { ReactNode } from "react";

import { SettingsPageShell } from "@/modules/settings/pages/settings-page-shell";
import { Iconify } from "@/icons/iconify";

import { ChangePasswordPanel } from "./change-password-panel";
import { MfaMethodsPanel } from "./mfa-methods-panel";
import { RecoveryCodesPanel } from "./recovery-codes-panel";
import { SessionsPanel } from "./sessions-panel";

/** Tab keys mirrored in the `?tab=` query param for deep-linking. */
type TabKey = "password" | "sessions" | "mfa" | "recovery";

const TAB_KEYS: readonly TabKey[] = ["password", "sessions", "mfa", "recovery"];

function isTabKey(value: string | null): value is TabKey {
  return value !== null && (TAB_KEYS as readonly string[]).includes(value);
}

export default function SecurityPage(): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = isTabKey(searchParams.get("tab"))
    ? (searchParams.get("tab") as TabKey)
    : "password";

  const handleTabChange = (key: Key): void => {
    const next = String(key);

    if (!isTabKey(next)) return;

    // Preserve any sibling params (`?redirect=…`) — only rewrite `tab`.
    const params = new URLSearchParams(searchParams);

    params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  return (
    <SettingsPageShell>
      <Tabs defaultSelectedKey={initial} onSelectionChange={handleTabChange}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Security settings tabs">
            <Tabs.Tab id="password">
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-3.5" icon="key" />
                Password
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="sessions">
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-3.5" icon="laptop" />
                Sessions
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="mfa">
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-3.5" icon="shield-check" />
                Two-factor
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="recovery">
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-3.5" icon="life-ring" />
                Recovery codes
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-4" id="password">
          <ChangePasswordPanel />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="sessions">
          <SessionsPanel />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="mfa">
          <MfaMethodsPanel />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="recovery">
          <RecoveryCodesPanel />
        </Tabs.Panel>
      </Tabs>
    </SettingsPageShell>
  );
}
