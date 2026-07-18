/**
 * @file reference-hover-card.tsx
 * @module components/reference-hover-card
 *
 * @description
 * The canonical foreign-key preview shell per §6.2. Wraps any cell content in
 * a HeroUI Pro `HoverCard` that fetches the referenced record via Refine's
 * `useOne` and renders a compact preview — Avatar + name + key attributes +
 * View link. On mobile, HoverCard gracefully degrades to tap-to-open via the
 * OS pointer conventions.
 *
 * Usage:
 * ```tsx
 * <ReferenceHoverCard kind="athlete" id={row.athleteId}>
 *   <Link>{row.athleteName}</Link>
 * </ReferenceHoverCard>
 * ```
 */

import { Avatar, Chip, Link, Skeleton } from "@heroui/react";
import { HoverCard } from "@heroui-pro/react";
import { useOne } from "@refinedev/core";

import type { BaseKey, BaseRecord } from "@refinedev/core";
import type { ReactNode } from "react";

import type { ReferenceKind } from "@/lib/module";

import { formatCurrency, formatDate } from "@/refine/format";

type ReferenceHoverCardProps = {
  kind: ReferenceKind;
  id: BaseKey | undefined;
  children: ReactNode;
};

const KIND_TO_RESOURCE: Record<ReferenceKind, string> = {
  athlete: "athletes",
  coach: "coaches",
  staff: "staff",
  team: "teams",
  invoice: "invoices",
  lead: "leads",
  facility: "facilities",
  credential: "credentials",
  branch: "branches",
  season: "seasons",
};

function getField<T = unknown>(row: BaseRecord | undefined, ...keys: string[]): T | undefined {
  if (!row) return undefined;
  for (const key of keys) {
    const value = key.split(".").reduce<unknown>(
      (acc, part) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];

        return undefined;
      },
      row as Record<string, unknown>,
    );

    if (value !== undefined && value !== null && value !== "") return value as T;
  }

  return undefined;
}

function PreviewPerson({ record, kind }: { record: BaseRecord; kind: ReferenceKind }) {
  const name = getField<string>(record, "fullName", "name") ?? "Unknown";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const avatarUrl = getField<string>(record, "avatar.0.url");
  const email = getField<string>(record, "email");
  const status = getField<{ text?: string; color?: string }>(record, "status");
  const primary = getField<string>(record, "primarySport", "role", "kind");
  const branch = getField<string>(record, "branch");

  return (
    <div className="flex min-w-[240px] flex-col gap-2">
      <div className="flex items-center gap-3">
        <Avatar className="size-10" color="accent" size="md">
          {avatarUrl ? <Avatar.Image alt={name} src={avatarUrl} /> : null}
          <Avatar.Fallback>{initials || "?"}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-medium text-foreground">{name}</p>
          {email ? <p className="truncate text-xs text-muted">{email}</p> : null}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {primary ? (
          <>
            <dt className="text-muted">Kind</dt>
            <dd className="truncate text-foreground">{primary}</dd>
          </>
        ) : null}
        {branch ? (
          <>
            <dt className="text-muted">Branch</dt>
            <dd className="truncate text-foreground">{branch}</dd>
          </>
        ) : null}
        {status?.text ? (
          <>
            <dt className="text-muted">Status</dt>
            <dd>
              <Chip
                color={
                  (status.color as "success" | "warning" | "danger" | "accent" | "default") ??
                  "accent"
                }
                size="sm"
                variant="soft"
              >
                <Chip.Label>{status.text}</Chip.Label>
              </Chip>
            </dd>
          </>
        ) : null}
      </dl>
      <Link className="text-xs" href={`/${KIND_TO_RESOURCE[kind]}/${record.id}`}>
        View {kind}
        <Link.Icon />
      </Link>
    </div>
  );
}

function PreviewTeam({ record }: { record: BaseRecord }) {
  const name = getField<string>(record, "name") ?? "Team";
  const sport = getField<string>(record, "sport", "primarySport");
  const coach = getField<string>(record, "coach", "coachName");
  const rosterCount = getField<number>(record, "rosterCount", "athletes");

  return (
    <div className="flex min-w-[240px] flex-col gap-2">
      <p className="text-sm leading-tight font-medium text-foreground">{name}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {sport ? (
          <>
            <dt className="text-muted">Sport</dt>
            <dd className="text-foreground">{sport}</dd>
          </>
        ) : null}
        {coach ? (
          <>
            <dt className="text-muted">Coach</dt>
            <dd className="truncate text-foreground">{coach}</dd>
          </>
        ) : null}
        {typeof rosterCount === "number" ? (
          <>
            <dt className="text-muted">Roster</dt>
            <dd className="text-foreground tabular-nums">{rosterCount}</dd>
          </>
        ) : null}
      </dl>
      <Link className="text-xs" href={`/teams/${record.id}`}>
        View team
        <Link.Icon />
      </Link>
    </div>
  );
}

function PreviewInvoice({ record }: { record: BaseRecord }) {
  const code = getField<string>(record, "invoiceNumber", "code", "name") ?? `#${record.id}`;
  const amount = getField<number>(record, "amount", "total");
  const status = getField<{ text?: string; color?: string }>(record, "status");
  const dueDate = getField<string>(record, "dueDate", "createdAt");

  return (
    <div className="flex min-w-[240px] flex-col gap-2">
      <p className="text-sm leading-tight font-medium text-foreground tabular-nums">{code}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {typeof amount === "number" ? (
          <>
            <dt className="text-muted">Amount</dt>
            <dd className="text-foreground tabular-nums">{formatCurrency(amount)}</dd>
          </>
        ) : null}
        {status?.text ? (
          <>
            <dt className="text-muted">Status</dt>
            <dd>
              <Chip
                color={
                  (status.color as "success" | "warning" | "danger" | "accent" | "default") ??
                  "accent"
                }
                size="sm"
                variant="soft"
              >
                <Chip.Label>{status.text}</Chip.Label>
              </Chip>
            </dd>
          </>
        ) : null}
        {dueDate ? (
          <>
            <dt className="text-muted">Due</dt>
            <dd className="text-foreground">{formatDate(dueDate)}</dd>
          </>
        ) : null}
      </dl>
      <Link className="text-xs" href={`/invoices/${record.id}`}>
        View invoice
        <Link.Icon />
      </Link>
    </div>
  );
}

function PreviewFacility({ record }: { record: BaseRecord }) {
  const name = getField<string>(record, "name") ?? "Facility";
  const type = getField<string>(record, "type");
  const capacity = getField<number>(record, "capacity");
  const branch = getField<string>(record, "branch");
  const indoor = getField<boolean>(record, "indoor");

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      <p className="text-sm leading-tight font-medium text-foreground">{name}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {type ? (
          <>
            <dt className="text-muted">Type</dt>
            <dd className="text-foreground capitalize">{type}</dd>
          </>
        ) : null}
        {typeof capacity === "number" ? (
          <>
            <dt className="text-muted">Capacity</dt>
            <dd className="text-foreground tabular-nums">{capacity}</dd>
          </>
        ) : null}
        {branch ? (
          <>
            <dt className="text-muted">Branch</dt>
            <dd className="truncate text-foreground">{branch}</dd>
          </>
        ) : null}
        {typeof indoor === "boolean" ? (
          <>
            <dt className="text-muted">Environment</dt>
            <dd className="text-foreground">{indoor ? "Indoor" : "Outdoor"}</dd>
          </>
        ) : null}
      </dl>
      <Link className="text-xs" href={`/facilities/${record.id}`}>
        View facility
        <Link.Icon />
      </Link>
    </div>
  );
}

function PreviewCredential({ record }: { record: BaseRecord }) {
  const name = getField<string>(record, "name") ?? `Credential #${record.id}`;
  const kind = getField<string>(record, "kind");
  const holder = getField<string>(record, "holder");
  const expiresAt = getField<string>(record, "expiresAt");
  const status = getField<{ text?: string; color?: string }>(record, "status");

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      <p className="text-sm leading-tight font-medium text-foreground">{name}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {kind ? (
          <>
            <dt className="text-muted">Kind</dt>
            <dd className="text-foreground uppercase">{kind}</dd>
          </>
        ) : null}
        {holder ? (
          <>
            <dt className="text-muted">Holder</dt>
            <dd className="truncate text-foreground">{holder}</dd>
          </>
        ) : null}
        {expiresAt ? (
          <>
            <dt className="text-muted">Expires</dt>
            <dd className="text-foreground">{formatDate(expiresAt)}</dd>
          </>
        ) : null}
        {status?.text ? (
          <>
            <dt className="text-muted">Status</dt>
            <dd>
              <Chip
                color={
                  (status.color as "success" | "warning" | "danger" | "accent" | "default") ??
                  "accent"
                }
                size="sm"
                variant="soft"
              >
                <Chip.Label>{status.text}</Chip.Label>
              </Chip>
            </dd>
          </>
        ) : null}
      </dl>
      <Link className="text-xs" href={`/credentials/${record.id}`}>
        View credential
        <Link.Icon />
      </Link>
    </div>
  );
}

function PreviewBranch({ record }: { record: BaseRecord }) {
  const name = getField<string>(record, "name") ?? "Branch";
  const city = getField<string>(record, "city");
  const country = getField<string>(record, "country");
  const athletesCount = getField<number>(record, "athletesCount");
  const status = getField<{ text?: string; color?: string }>(record, "status");

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      <p className="text-sm leading-tight font-medium text-foreground">{name}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {city || country ? (
          <>
            <dt className="text-muted">Location</dt>
            <dd className="truncate text-foreground">
              {[city, country].filter(Boolean).join(", ")}
            </dd>
          </>
        ) : null}
        {typeof athletesCount === "number" ? (
          <>
            <dt className="text-muted">Athletes</dt>
            <dd className="text-foreground tabular-nums">{athletesCount}</dd>
          </>
        ) : null}
        {status?.text ? (
          <>
            <dt className="text-muted">Status</dt>
            <dd>
              <Chip
                color={
                  (status.color as "success" | "warning" | "danger" | "accent" | "default") ??
                  "accent"
                }
                size="sm"
                variant="soft"
              >
                <Chip.Label>{status.text}</Chip.Label>
              </Chip>
            </dd>
          </>
        ) : null}
      </dl>
      <Link className="text-xs" href={`/branches/${record.id}`}>
        View branch
        <Link.Icon />
      </Link>
    </div>
  );
}

function PreviewSeason({ record }: { record: BaseRecord }) {
  const name = getField<string>(record, "name") ?? "Season";
  const sport = getField<string>(record, "sport");
  const startAt = getField<string>(record, "startAt");
  const endAt = getField<string>(record, "endAt");

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      <p className="text-sm leading-tight font-medium text-foreground">{name}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {sport ? (
          <>
            <dt className="text-muted">Sport</dt>
            <dd className="text-foreground">{sport}</dd>
          </>
        ) : null}
        {startAt ? (
          <>
            <dt className="text-muted">Starts</dt>
            <dd className="text-foreground">{formatDate(startAt)}</dd>
          </>
        ) : null}
        {endAt ? (
          <>
            <dt className="text-muted">Ends</dt>
            <dd className="text-foreground">{formatDate(endAt)}</dd>
          </>
        ) : null}
      </dl>
      <Link className="text-xs" href={`/seasons/${record.id}`}>
        View season
        <Link.Icon />
      </Link>
    </div>
  );
}

function PreviewGeneric({ record, kind }: { record: BaseRecord; kind: ReferenceKind }) {
  const name = getField<string>(record, "name", "fullName", "title") ?? String(record.id);
  const description = getField<string>(record, "description", "type", "city", "sport");
  const status = getField<{ text?: string; color?: string }>(record, "status");

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      <p className="text-sm leading-tight font-medium text-foreground">{name}</p>
      {description ? <p className="text-xs text-muted">{description}</p> : null}
      {status?.text ? (
        <Chip
          color={
            (status.color as "success" | "warning" | "danger" | "accent" | "default") ?? "accent"
          }
          size="sm"
          variant="soft"
        >
          <Chip.Label>{status.text}</Chip.Label>
        </Chip>
      ) : null}
      <Link className="text-xs" href={`/${KIND_TO_RESOURCE[kind]}/${record.id}`}>
        View {kind}
        <Link.Icon />
      </Link>
    </div>
  );
}

function ReferencePreview({ kind, id }: { kind: ReferenceKind; id: BaseKey }) {
  const { query, result } = useOne<BaseRecord>({ resource: KIND_TO_RESOURCE[kind], id });

  if (query.isLoading) {
    return (
      <div className="flex min-w-[220px] flex-col gap-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    );
  }
  if (!result) {
    return <p className="text-xs text-muted">Record not found.</p>;
  }
  const record = result as BaseRecord;

  if (kind === "athlete" || kind === "coach" || kind === "staff" || kind === "lead") {
    return <PreviewPerson kind={kind} record={record} />;
  }
  if (kind === "team") return <PreviewTeam record={record} />;
  if (kind === "invoice") return <PreviewInvoice record={record} />;
  if (kind === "facility") return <PreviewFacility record={record} />;
  if (kind === "credential") return <PreviewCredential record={record} />;
  if (kind === "branch") return <PreviewBranch record={record} />;
  if (kind === "season") return <PreviewSeason record={record} />;

  return <PreviewGeneric kind={kind} record={record} />;
}

export function ReferenceHoverCard({ kind, id, children }: ReferenceHoverCardProps) {
  if (id === undefined || id === null) return <>{children}</>;

  return (
    <HoverCard>
      <HoverCard.Trigger>{children}</HoverCard.Trigger>
      <HoverCard.Content className="p-3">
        <HoverCard.Arrow />
        <ReferencePreview id={id} kind={kind} />
      </HoverCard.Content>
    </HoverCard>
  );
}
