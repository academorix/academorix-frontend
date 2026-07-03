/**
 * @file show.tsx
 * @module modules/sports/formations/pages/show
 *
 * @description
 * Formation detail — plots the formation's player slots on a normalized pitch.
 * This is the read-only tactics board for the demo; drag-to-edit authoring
 * lands with the write API. Slot coordinates are percentages (see
 * {@link FormationSlot}).
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Formation } from "@/modules/sports/formations/formation.types";
import type { CSSProperties, ReactNode } from "react";

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

/** The formation detail + pitch page. */
export default function FormationsShow(): ReactNode {
  const { result: formation, query } = useShow<Formation>({ resource: "formations" });

  if (query.isLoading || !formation) {
    return (
      <ShowView resource="formations">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="formations">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{formation.name}</Card.Title>
            <Card.Description>{formation.shape}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Shape">{formation.shape}</Field>
              <Field label="Sport">{formation.sport_key}</Field>
              <Field label="Players">{formation.slots.length}</Field>
              {formation.note ? <Field label="Note">{formation.note}</Field> : null}
            </dl>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Pitch</Card.Title>
          </Card.Header>
          <Card.Content>
            <figure className="mx-auto w-full max-w-sm">
              <div
                aria-label={`${formation.shape} formation on the pitch`}
                className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-emerald-700/40 bg-gradient-to-b from-emerald-600 to-emerald-700"
                role="img"
              >
                {/* Halfway line + centre circle for orientation. */}
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/40" />
                <div className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />

                {formation.slots.map((slot) => {
                  // Percentages come from data, so position is set inline.
                  const style: CSSProperties = {
                    left: `${slot.x}%`,
                    bottom: `${slot.y}%`,
                  };

                  return (
                    <div
                      key={slot.id}
                      className="absolute flex size-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-emerald-800 shadow"
                      style={style}
                      title={slot.label}
                    >
                      {slot.label}
                    </div>
                  );
                })}
              </div>
              <figcaption className="mt-2 text-center text-xs text-muted">
                Attacking direction is upward.
              </figcaption>
            </figure>
          </Card.Content>
        </Card>
      </div>
    </ShowView>
  );
}
