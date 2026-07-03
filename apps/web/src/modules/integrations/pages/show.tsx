/**
 * @file show.tsx
 * @module modules/integrations/pages/show
 *
 * @description
 * Integration detail — provider, category, connection status, enablement, last
 * sync, and any status note for a single third-party integration.
 */

import { Card, Chip, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Integration, IntegrationStatus } from "@/modules/integrations/integrations.types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { INTEGRATION_STATUS_LABELS } from "@/modules/integrations/integrations.types";

/** Maps integration status to a semantic Chip color. */
const STATUS_COLOR: Record<IntegrationStatus, "success" | "danger" | "default"> = {
  connected: "success",
  disconnected: "default",
  error: "danger",
};

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The integration detail page. */
export default function IntegrationsShow(): ReactNode {
  const { result: integration, query } = useShow<Integration>({ resource: "integrations" });

  if (query.isLoading || !integration) {
    return (
      <ShowView resource="integrations">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="integrations">
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between gap-2">
            <Card.Title>{integration.name}</Card.Title>
            <Chip color={STATUS_COLOR[integration.status]} size="sm" variant="soft">
              {INTEGRATION_STATUS_LABELS[integration.status]}
            </Chip>
          </div>
          <Card.Description>{integration.category}</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Provider">{integration.provider}</Field>
            <Field label="Category">{integration.category}</Field>
            <Field label="Status">{INTEGRATION_STATUS_LABELS[integration.status]}</Field>
            <Field label="Enabled">{integration.is_enabled ? "Yes" : "No"}</Field>
            <Field label="Last sync">{formatDateTime(integration.last_synced_at)}</Field>
          </dl>

          <div className="mt-6 flex flex-col gap-1">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">Note</dt>
            <dd className="text-sm whitespace-pre-line text-foreground">
              {integration.note ?? "—"}
            </dd>
          </div>
        </Card.Content>
      </Card>
    </ShowView>
  );
}
