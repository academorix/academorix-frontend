/**
 * @file show.tsx
 * @module modules/regions/pages/show
 *
 * @description
 * Region detail — currency, countries, timezone, locale, and tax configuration.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Region } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The region detail page. */
export default function RegionShow(): ReactNode {
  const { result: region, query } = useShow<Region>({ resource: "regions" });

  const taxLabel = region?.tax_config
    ? `${String((region.tax_config as { label?: string }).label ?? "Tax")} · ${String(
        (region.tax_config as { rate?: number }).rate ?? 0,
      )}%`
    : "—";

  return (
    <ShowView resource="regions">
      {query.isLoading || !region ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{region.name}</Card.Title>
            <Card.Description>Commercial region</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Currency">{region.currency_code}</Field>
              <Field label="Countries">{region.countries.join(", ")}</Field>
              <Field label="Timezone">{region.timezone}</Field>
              <Field label="Locale">{region.locale}</Field>
              <Field label="Tax">{taxLabel}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
