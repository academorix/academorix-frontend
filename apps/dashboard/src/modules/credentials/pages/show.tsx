/**
 * @file show.tsx
 * @module modules/credentials/pages/show
 *
 * @description
 * Credential detail — the athlete, technology, code, status, and issue date. The
 * athlete name is resolved from the `athletes` resource.
 */

import { Card, Spinner } from "@stackra/ui/react";
import { useOne, useShow } from "@refinedev/core";

import type { Credential } from "@/modules/credentials/credentials.types";
import type { Athlete } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { CredentialStatusChip } from "@/modules/credentials/components/credential-status-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The credential detail page. */
export default function CredentialShow(): ReactNode {
  const { result: credential, query } = useShow<Credential>({ resource: "credentials" });

  // Resolve the athlete's name once the credential is known.
  const { result: athlete } = useOne<Athlete>({
    resource: "athletes",
    id: credential?.athlete_id ?? "",
    queryOptions: { enabled: Boolean(credential?.athlete_id) },
  });

  const athleteLabel = athlete
    ? `${athlete.first_name} ${athlete.last_name}`
    : (credential?.athlete_id ?? "");

  return (
    <ShowView resource="credentials">
      {query.isLoading || !credential ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{athleteLabel}</Card.Title>
            <Card.Description>Access credential</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Athlete">{athleteLabel}</Field>
              <Field label="Type">{credential.type.toUpperCase()}</Field>
              <Field label="Code">
                <span className="font-mono">{credential.code}</span>
              </Field>
              <Field label="Status">
                <CredentialStatusChip status={credential.status} />
              </Field>
              <Field label="Issued">{formatDate(credential.issued_at)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
