/**
 * @file list.tsx
 * @module modules/people/pages/list
 *
 * @description
 * People search + list — a debounced search bar (email/phone/name) over the
 * platform's global identity ledger, plus a `ResourceDataGrid` with avatar,
 * name, primary contact, tenant count, profile count, and creation date.
 *
 * TODO(backend-endpoint): `GET /api/v1/people`. Until the backend ships the
 * endpoint, the DataGrid renders an empty state and a debug log fires on
 * 404/501. See `usePeopleSearch` for the graceful-degradation shape.
 */

import { useEffect, useMemo, useState } from "react";

import type { Person } from "@/modules/people/people.types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { ListingToolbar } from "@/components/refine/listing-toolbar";
import { formatDate } from "@/lib/format";
import { PersonAvatar } from "@/modules/people/components/person-avatar";
import { EMPTY_PLACEHOLDER } from "@/modules/people/people.config";
import { usePeopleSearch } from "@/modules/people/use-people-search";

/** Small helper that renders the # of tenants a person spans. */
function tenantCount(person: Person): number {
  const uniqueTenants = new Set((person.profiles ?? []).map((profile) => profile.tenant_id));

  return uniqueTenants.size;
}

/** Small helper that renders the total # of profiles a person owns. */
function profileCount(person: Person): number {
  return (person.profiles ?? []).length;
}

/** The people search + list page. */
export default function PeopleList(): ReactNode {
  const [query, setQuery] = useState("");
  const search = usePeopleSearch({ query });

  // Log the backend-missing state to the debug console so a developer running
  // the app locally sees exactly why the list looks empty. Kept behind an
  // effect so log entries don't stack on every render.
  useEffect(() => {
    if (search.error) {
      // eslint-disable-next-line no-console
      console.debug(
        "[people] GET /api/v1/people is not yet implemented on the backend — TODO(backend-endpoint)",
        search.error,
      );
    }
  }, [search.error]);

  const columns = useMemo<DataGridColumn<Person>[]>(
    () => [
      {
        id: "full_name",
        header: "Person",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 240,
        cell: (person) => (
          <div className="flex items-center gap-3">
            <PersonAvatar avatarUrl={person.avatar_url} name={person.full_name} size="sm" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{person.full_name}</span>
              <span className="text-xs text-muted">{person.id}</span>
            </div>
          </div>
        ),
      },
      {
        id: "primary_email",
        header: "Primary contact",
        minWidth: 220,
        cell: (person) => (
          <div className="flex flex-col text-sm">
            <span className="text-foreground">{person.primary_email ?? EMPTY_PLACEHOLDER}</span>
            <span className="text-xs text-muted">{person.primary_phone ?? EMPTY_PLACEHOLDER}</span>
          </div>
        ),
      },
      {
        id: "tenants",
        header: "# tenants",
        align: "end",
        cell: (person) => <span className="tabular-nums">{tenantCount(person)}</span>,
      },
      {
        id: "profiles",
        header: "# profiles",
        align: "end",
        cell: (person) => <span className="tabular-nums">{profileCount(person)}</span>,
      },
      {
        id: "created_at",
        header: "Created",
        allowsSorting: true,
        cell: (person) => formatDate(person.created_at),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 100,
        cell: (person) => (
          <div className="flex justify-end gap-1">
            <ShowButton
              isIconOnly
              aria-label="View person"
              recordItemId={person.id}
              resource="people"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [],
  );

  const emptyMessage = search.isBelowMinLength
    ? "Start typing an email, phone, or name to search the identity ledger."
    : search.error
      ? "The People backend is not available yet. Try again later."
      : "No people match this search.";

  return (
    <ListView resource="people">
      <ResourceDataGrid<Person>
        ariaLabel="People"
        columns={columns}
        contentClassName="min-w-[900px]"
        emptyMessage={emptyMessage}
        initialSorters={[{ field: "created_at", order: "desc" }]}
        resource="people"
        toolbar={
          <ListingToolbar
            searchPlaceholder="Search by email, phone, or name…"
            searchValue={query}
            onSearchChange={setQuery}
          />
        }
      />

      {search.error ? (
        <p className="text-xs text-muted" role="status">
          People search is temporarily unavailable while the backend endpoint ships.
        </p>
      ) : null}
    </ListView>
  );
}
