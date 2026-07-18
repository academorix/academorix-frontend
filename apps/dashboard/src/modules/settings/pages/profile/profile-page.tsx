/**
 * @file profile-page.tsx
 * @module modules/settings/pages/profile/profile-page
 *
 * @description
 * `/settings/profile` — the operator's personal profile settings.
 * Hosts:
 *
 *   1. **Identity card** — name / email / avatar / role.
 *   2. **Phone verification** panel — {@link PhoneVerificationPanel}
 *      wired to the caller's current identity so returning users
 *      land on the "verified" state without re-verifying.
 *
 * Rendered inside the shared `SettingsPageShell` so the sidebar
 * chrome + "Profile" card wrapper stay consistent with every other
 * settings section.
 */

import { Card, Separator, Spinner } from "@heroui/react";
import { useGetIdentity } from "@refinedev/core";

import type { ReactNode } from "react";
import type { Identity } from "@/refine/auth-provider";

import { Iconify } from "@/icons/iconify";
import { SettingsPageShell } from "@/modules/settings/pages/settings-page-shell";

import { PhoneVerificationPanel } from "./phone-verification-panel";

/**
 * Extend the frontend `Identity` type with the phone verification
 * flags — these come from `GET /api/auth/me` when the backend
 * surfaces them (see backend `MeController`). Kept optional so the
 * page still renders while the auth provider carries the legacy
 * shape.
 */
type ProfileIdentity = Identity & {
  phone?: string | null;
  phoneVerifiedAt?: string | null;
};

export default function ProfilePage(): ReactNode {
  const { data: identity, isLoading } = useGetIdentity<ProfileIdentity>();

  return (
    <SettingsPageShell>
      <div className="flex flex-col gap-6">
        {isLoading && !identity ? (
          <div className="flex items-center justify-center py-10">
            <Spinner color="accent" size="lg" />
          </div>
        ) : identity ? (
          <>
            <IdentityCard identity={identity} />
            <Separator />
            <PhoneVerificationPanel
              initialIsVerified={Boolean(identity.phoneVerifiedAt)}
              initialPhone={identity.phone ?? ""}
            />
          </>
        ) : null}
      </div>
    </SettingsPageShell>
  );
}

/**
 * Read-only identity summary — name / email / role + avatar. Edit
 * flows for these fields belong in a follow-up (each edit needs
 * server-side change confirmation + re-verification), so this
 * turn's ship is deliberately view-only.
 */
function IdentityCard({ identity }: { identity: ProfileIdentity }): ReactNode {
  return (
    <Card className="border-border">
      <Card.Header className="flex items-start gap-4">
        {identity.avatarUrl ? (
          <img
            alt={`${identity.name} avatar`}
            className="size-14 shrink-0 rounded-full object-cover ring-2 ring-border"
            src={identity.avatarUrl}
          />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
            {identity.initials || "?"}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Card.Title className="text-lg font-semibold">{identity.name || "Unnamed"}</Card.Title>
          <Card.Description className="flex items-center gap-2 text-sm text-muted">
            <Iconify className="size-3.5" icon="envelope" />
            <span className="truncate">{identity.email || "No email on file"}</span>
          </Card.Description>
          {identity.role ? (
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-0.5 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
              <Iconify className="size-3" icon="person-worker" />
              {identity.role}
            </span>
          ) : null}
        </div>
      </Card.Header>
    </Card>
  );
}
