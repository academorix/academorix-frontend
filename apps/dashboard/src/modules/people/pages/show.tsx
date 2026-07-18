/**
 * @file show.tsx
 * @module modules/people/pages/show
 *
 * @description
 * The global identity detail — the full Person view. Sections:
 *
 *  1. **Identity header** — avatar, name, contact rail, DOB, nationality.
 *  2. **Tenant projections** — one row per tenant showing role, status, and
 *     a deep-link to the tenant-scoped resource (athlete/coach/staff).
 *  3. **External IDs** — Stripe customer, MailChimp subscriber, etc.
 *  4. **Merge history** — {@link PersonMerge} events, when present.
 *
 * TODO(backend-endpoint): `GET /api/v1/people/{id}`. Until the backend
 * ships, `useShow` surfaces the error via a fallback panel and a debug log
 * fires so an operator can trace the shape locally.
 */

import { ArrowsRightLeftIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";
import { useEffect } from "react";
import { Link } from "@stackra/routing/react";

import type { Person } from "@/modules/people/people.types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { PersonHeader } from "@/modules/people/components/person-header";
import { ProfileStatusChip } from "@/modules/people/components/profile-status-chip";
import { RoleChip } from "@/modules/people/components/role-chip";
import { EMPTY_PLACEHOLDER, labelForExternalId } from "@/modules/people/people.config";

/**
 * The per-tenant projections section — a compact table with one row per
 * profile. Rendered inline instead of pulled into its own component
 * because the columns are one-off (role/status/deep link).
 */
function TenantProjectionsSection({ person }: { person: Person }): ReactNode {
  const profiles = person.profiles ?? [];

  return (
    <Card>
      <Card.Header>
        <Card.Title>Tenant projections</Card.Title>
        <Card.Description>
          {profiles.length === 0
            ? "This person does not have a projection in any tenant yet."
            : `${profiles.length} projection${profiles.length === 1 ? "" : "s"} across ${
                new Set(profiles.map((profile) => profile.tenant_id)).size
              } tenant(s).`}
        </Card.Description>
      </Card.Header>
      {profiles.length === 0 ? null : (
        <Card.Content>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs tracking-wide text-muted uppercase">
                <th className="py-2 pe-4 text-start font-medium">Tenant</th>
                <th className="py-2 pe-4 text-start font-medium">Role</th>
                <th className="py-2 pe-4 text-start font-medium">Status</th>
                <th className="py-2 pe-4 text-start font-medium">Profile</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-t border-border">
                  <td className="py-2 pe-4 text-foreground">
                    {profile.tenant_name ?? profile.tenant_id}
                  </td>
                  <td className="py-2 pe-4">
                    <RoleChip role={profile.role_in_tenant} />
                  </td>
                  <td className="py-2 pe-4">
                    <ProfileStatusChip status={profile.status} />
                  </td>
                  <td className="py-2 pe-4 text-xs text-muted">{profile.profile_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card.Content>
      )}
    </Card>
  );
}

/** The external-integration IDs section (Stripe, MailChimp, etc.). */
function ExternalIdsSection({ person }: { person: Person }): ReactNode {
  const entries = Object.entries(person.external_ids ?? {});

  return (
    <Card>
      <Card.Header>
        <Card.Title>External integrations</Card.Title>
        <Card.Description>Identifiers linking this person to third-party systems.</Card.Description>
      </Card.Header>
      <Card.Content>
        {entries.length === 0 ? (
          <p className="text-sm text-muted">No external identifiers on file.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                  {labelForExternalId(key)}
                </dt>
                <dd className="font-mono text-xs text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card.Content>
    </Card>
  );
}

/** The merge-history section — only shown when the backend returns events. */
function MergeHistorySection({ person }: { person: Person }): ReactNode {
  const merges = person.merges ?? [];

  if (merges.length === 0) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Merge history</Card.Title>
        <Card.Description>
          {merges.length} previous merge{merges.length === 1 ? "" : "s"} were applied to this
          identity.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <ul className="flex flex-col gap-2">
          {merges.map((merge) => (
            <li key={merge.id} className="flex flex-col gap-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft">
                  Merged
                </Chip>
                <span className="text-foreground">Absorbed {merge.merged_from_person_id}</span>
                <span className="text-xs text-muted">{formatDateTime(merge.created_at)}</span>
              </div>
              <div className="text-xs text-muted">
                By {merge.merged_by} · {merge.note ?? EMPTY_PLACEHOLDER}
              </div>
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
  );
}

/** The global-identity detail page. */
export default function PeopleShow(): ReactNode {
  const { result: person, query } = useShow<Person>({ resource: "people" });

  useEffect(() => {
    if (query.error) {
      // eslint-disable-next-line no-console
      console.debug(
        "[people] GET /api/v1/people/{id} is not yet implemented on the backend — TODO(backend-endpoint)",
        query.error,
      );
    }
  }, [query.error]);

  if (query.isLoading) {
    return (
      <ShowView resource="people">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  if (!person || query.error) {
    return (
      <ShowView resource="people">
        <Card>
          <Card.Header>
            <Card.Title>Identity not available</Card.Title>
            <Card.Description>
              The People backend has not shipped this endpoint yet. Once
              <code className="mx-1">GET /api/v1/people/{"{id}"}</code>
              lands, this page will render the full identity detail.
            </Card.Description>
          </Card.Header>
        </Card>
      </ShowView>
    );
  }

  return (
    <ShowView resource="people">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Content>
            <PersonHeader
              actions={
                <Button size="sm" variant="secondary">
                  <Link
                    aria-label="Merge this person with another"
                    className="flex items-center gap-1"
                    to={`/people/${person.id}/merge`}
                  >
                    <ArrowsRightLeftIcon aria-hidden="true" className="size-4" />
                    Merge
                  </Link>
                </Button>
              }
              person={person}
            />
          </Card.Content>
        </Card>

        <TenantProjectionsSection person={person} />
        <ExternalIdsSection person={person} />
        <MergeHistorySection person={person} />
      </div>
    </ShowView>
  );
}
