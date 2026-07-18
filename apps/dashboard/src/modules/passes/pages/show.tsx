/**
 * @file show.tsx
 * @module modules/passes/pages/show
 *
 * @description
 * Pass detail — renders the pass as a card with its scannable code (a QR in
 * production; a styled code block here) plus holder, type, status, and validity.
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Pass, PassStatus } from "@/modules/passes/passes.types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { PASS_STATUS_LABELS, PASS_TYPE_LABELS } from "@/modules/passes/passes.types";

/** Maps pass status to a semantic Chip color. */
const STATUS_COLOR: Record<PassStatus, "success" | "danger" | "default"> = {
  active: "success",
  expired: "default",
  revoked: "danger",
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

/** The pass detail page. */
export default function PassesShow(): ReactNode {
  const { result: pass, query } = useShow<Pass>({ resource: "passes" });

  if (query.isLoading || !pass) {
    return (
      <ShowView resource="passes">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="passes">
      <Card className="mx-auto max-w-md">
        <Card.Header>
          <div className="flex items-center justify-between gap-2">
            <Card.Title>{pass.holder_name}</Card.Title>
            <Chip color={STATUS_COLOR[pass.status]} size="sm" variant="soft">
              {PASS_STATUS_LABELS[pass.status]}
            </Chip>
          </div>
          <Card.Description>{PASS_TYPE_LABELS[pass.type]} pass</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-6">
          {/* Scan payload — a real QR renders here in production. */}
          <div className="flex flex-col items-center gap-2 rounded-lg border border-default bg-default/20 p-6">
            <div
              aria-hidden="true"
              className="size-28 rounded-md border border-black/10"
              style={{
                backgroundColor: "#ffffff",
                backgroundImage:
                  "repeating-linear-gradient(0deg, #111 0 6px, transparent 6px 12px), repeating-linear-gradient(90deg, #111 0 6px, transparent 6px 12px)",
              }}
            />
            <code className="text-xs tracking-widest text-muted">{pass.code}</code>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type">{PASS_TYPE_LABELS[pass.type]}</Field>
            <Field label="Status">{PASS_STATUS_LABELS[pass.status]}</Field>
            <Field label="Valid from">{formatDate(pass.valid_from)}</Field>
            <Field label="Valid until">{formatDate(pass.valid_until)}</Field>
          </dl>
        </Card.Content>
      </Card>
    </ShowView>
  );
}
