/**
 * @file wizard-shared.tsx
 * @module modules/settings/pages/sso/wizard-shared
 *
 * @description
 * Small building blocks shared by {@link AddSamlProviderWizard} and
 * {@link AddOidcProviderWizard}. Both wizards ship the same shell —
 * a three-step modal with a top stepper, per-step body, and a
 * consistent footer bar (Back / Cancel / Continue) — so we pull the
 * common surfaces into one file rather than duplicating the JSX in
 * each wizard.
 *
 * ## What's shared
 *
 *  - **`WizardStepper`** — the horizontal step indicator at the top
 *    of both wizards. Keys off the raw step index (1..3) so we don't
 *    need a per-wizard step-catalog object.
 *  - **`WizardFooter`** — the consistent Back / Cancel / Primary
 *    bar. Callers pass in the primary button, which changes copy per
 *    step (Continue → Save + test → Close).
 *  - **`RoleClaimEditor`** — step 2 body. Identical UX between the
 *    two wizards: a repeated `<key, value>` row with add + delete +
 *    the "your roles look like this" hint.
 *  - **`ProbeChecklist`** — step 3 body. Renders the streaming
 *    probe-result list with spinner → checkmark / xmark transitions.
 *
 * The two wizard files stay slim — each owns its step 1 body (the
 * only part that differs between protocols) and re-uses everything
 * else from this module.
 */

import { Button, Chip, Input, Label, Spinner, TextField } from "@heroui/react";
import { Stepper } from "@heroui-pro/react";
import { useList } from "@refinedev/core";

import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

import type { HealthCheckResult } from "./sso.types";

/**
 * Step keys used across both wizards. Numbered rather than named so
 * the state-machine reduces to `step + 1` / `step - 1` arithmetic in
 * the caller.
 */
export const WIZARD_STEP_COUNT = 3;

/**
 * Titles for the three shared steps. Passed into the stepper header
 * so the two wizards render an identical progress row.
 */
export const WIZARD_STEP_TITLES = ["Import", "Map roles", "Test"] as const;

/**
 * Progress bar rendered at the top of both wizards.
 */
export function WizardStepper({ currentStep }: { currentStep: number }): ReactNode {
  return (
    <Stepper currentStep={currentStep} size="sm">
      {WIZARD_STEP_TITLES.map((title) => (
        <Stepper.Step key={title}>
          <Stepper.Indicator />
          <Stepper.Content>
            <Stepper.Title>{title}</Stepper.Title>
          </Stepper.Content>
          <Stepper.Separator />
        </Stepper.Step>
      ))}
    </Stepper>
  );
}

/**
 * The Back + Cancel + Primary button row at the bottom of every step.
 *
 * Explicit props (rather than a `children`-slot approach) keep every
 * button consistent between wizards — copy, ordering, and disabled
 * states can't drift.
 */
export function WizardFooter({
  onBack,
  onCancel,
  primary,
  showBack,
}: {
  onBack: () => void;
  onCancel: () => void;
  primary: ReactNode;
  showBack: boolean;
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        {showBack ? (
          <Button onPress={onBack} variant="ghost">
            <Iconify className="size-4" icon="arrow-left" />
            Back
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button onPress={onCancel} variant="ghost">
          Cancel
        </Button>
        {primary}
      </div>
    </div>
  );
}

/**
 * One row in the JIT role-map editor.
 */
export interface RoleClaimRow {
  /** Client-side row id — random, not persisted. */
  key: string;
  /** IdP-side role name that the SAML / OIDC claim delivers. */
  idpRole: string;
  /** The Academorix Spatie role this maps to. */
  academorixRole: string;
}

/**
 * Step-2 role-claim editor shared by both wizards.
 *
 * ## Why a controlled list
 *
 * Refine has no first-class "repeated field" helper — the editor
 * owns its own row array and reports every change via `onChange`.
 * That keeps validation (empty row detection) and the "Academorix
 * roles" hint (populated from `useList({resource: "roles"})`) local
 * to this component; the wrapping wizard only cares about the final
 * `Record<string, string>` shape it hands to the create mutation.
 */
export function RoleClaimEditor({
  rows,
  onChange,
}: {
  rows: readonly RoleClaimRow[];
  onChange: (rows: RoleClaimRow[]) => void;
}): ReactNode {
  const { result } = useList<{ id: number | string; name: string }>({
    resource: "roles",
    pagination: { mode: "off" },
  });
  const availableRoles = result?.data ?? [];

  const updateRow = (key: string, patch: Partial<RoleClaimRow>): void => {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeRow = (key: string): void => {
    onChange(rows.filter((row) => row.key !== key));
  };

  const addRow = (): void => {
    onChange([
      ...rows,
      {
        key: crypto.randomUUID(),
        idpRole: "",
        academorixRole: "",
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Map role claims</h3>
        <p className="mt-1 text-sm text-muted">
          The claim your IdP sends (left) is translated into an Academorix Spatie role (right) when
          a user is provisioned. Unmapped users fall back to the tenant default.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_1.75rem_1fr_2.5rem] items-center gap-2 text-xs font-medium text-muted">
          <span>IdP role</span>
          <span aria-hidden="true">↔</span>
          <span>Academorix role</span>
          <span className="sr-only">Actions</span>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            No role mappings yet. Add one below or leave empty to route every user to the tenant's
            default role.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[1fr_1.75rem_1fr_2.5rem] items-center gap-2"
            >
              <TextField
                aria-label="IdP role name"
                onChange={(next) => updateRow(row.key, { idpRole: next })}
                value={row.idpRole}
              >
                <Input placeholder="sso://roles/administrator" variant="secondary" />
              </TextField>
              <span aria-hidden="true" className="text-center text-muted">
                →
              </span>
              <TextField
                aria-label="Academorix role name"
                onChange={(next) => updateRow(row.key, { academorixRole: next })}
                value={row.academorixRole}
              >
                <Input placeholder="admin" variant="secondary" />
              </TextField>
              <Button
                aria-label={`Remove ${row.idpRole || "row"}`}
                isIconOnly
                onPress={() => removeRow(row.key)}
                size="sm"
                variant="ghost"
              >
                <Iconify className="size-4" icon="trash-bin" />
              </Button>
            </div>
          ))
        )}
        <div>
          <Button onPress={addRow} size="sm" variant="secondary">
            <Iconify className="size-4" icon="plus" />
            Add mapping
          </Button>
        </div>
      </div>

      {availableRoles.length > 0 ? (
        <div className="rounded-xl border border-border p-3">
          <div className="mb-1.5 text-xs font-medium text-foreground">Your Academorix roles</div>
          <div className="flex flex-wrap gap-1.5">
            {availableRoles.map((role) => (
              <Chip color="default" key={role.id} size="sm" variant="soft">
                <Chip.Label>{role.name}</Chip.Label>
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Step-3 probe checklist shared by both wizards. Renders each named
 * check with a spinner → checkmark / xmark transition once the probe
 * finishes.
 */
export function ProbeChecklist({
  isRunning,
  results,
  probeNames,
}: {
  isRunning: boolean;
  results: readonly HealthCheckResult[] | null;
  probeNames: readonly { name: string; label: string }[];
}): ReactNode {
  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
      {probeNames.map(({ name, label }) => {
        const result = results?.find((entry) => entry.name === name) ?? null;
        const status = result ? (result.ok ? "ok" : "failed") : isRunning ? "running" : "pending";

        return (
          <li className="flex items-start gap-3 p-3" key={name}>
            <span className="mt-0.5">
              {status === "running" ? (
                <Spinner size="sm" />
              ) : status === "ok" ? (
                <Iconify className="size-5 text-success" icon="circle-check" />
              ) : status === "failed" ? (
                <Iconify className="size-5 text-danger" icon="circle-xmark" />
              ) : (
                <Iconify className="size-5 text-muted" icon="circle-dashed" />
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{label}</span>
              {result ? (
                <span className={result.ok ? "text-xs text-muted" : "text-xs text-danger"}>
                  {result.message}
                </span>
              ) : (
                <span className="text-xs text-muted">
                  {status === "running" ? "Checking…" : "Waiting to run"}
                </span>
              )}
            </div>
            <Label className="sr-only">{label}</Label>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Fold a list of {@link RoleClaimRow} into the wire-shape
 * `{idpRole: academorixRole}` map. Empty rows are dropped so the
 * backend never sees an empty-key mapping.
 */
export function foldRoleMap(rows: readonly RoleClaimRow[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const row of rows) {
    const idp = row.idpRole.trim();
    const roleName = row.academorixRole.trim();

    if (idp === "" || roleName === "") continue;
    map[idp] = roleName;
  }

  return map;
}
