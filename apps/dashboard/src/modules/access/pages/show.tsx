/**
 * @file show.tsx
 * @module modules/access/pages/show
 *
 * @description
 * Role detail — description, type, and the full list of granted permission keys.
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Role } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";

/** The role detail page. */
export default function RoleShow(): ReactNode {
  const { result: role, query } = useShow<Role>({ resource: "roles" });

  return (
    <ShowView resource="roles">
      {query.isLoading || !role ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{role.name}</Card.Title>
            <Card.Description>{role.description ?? "Role"}</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium tracking-wide text-muted uppercase">
                Permissions ({role.permissions.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map((permission) => (
                  <Chip key={permission} size="sm" variant="soft">
                    {permission}
                  </Chip>
                ))}
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
