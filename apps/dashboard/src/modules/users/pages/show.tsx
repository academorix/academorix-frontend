/**
 * @file show.tsx
 * @module modules/users/pages/show
 *
 * @description
 * User detail — identity, roles, and status.
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { User } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { UserStatusChip } from "@/modules/users/components/user-status-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The user detail page. */
export default function UserShow(): ReactNode {
  const { result: user, query } = useShow<User>({ resource: "users" });

  return (
    <ShowView resource="users">
      {query.isLoading || !user ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>
              {user.first_name} {user.last_name}
            </Card.Title>
            <Card.Description>{user.email}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <UserStatusChip status={user.status} />
              </Field>
              <Field label="Username">{user.username ?? "—"}</Field>
              <Field label="Phone">{user.phone ?? "—"}</Field>
              <Field label="Roles">
                <div className="flex flex-wrap gap-1">
                  {user.roles.length === 0
                    ? "—"
                    : user.roles.map((role) => (
                        <Chip key={role} size="sm" variant="soft">
                          {role}
                        </Chip>
                      ))}
                </div>
              </Field>
              <Field label="Last login">{formatDate(user.last_login_at)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
