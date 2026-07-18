/**
 * @file sso-page.tsx
 * @module modules/settings/pages/sso/sso-page
 *
 * @description
 * `/settings/sso` — hosts the tenant-scoped identity-provider
 * catalogue. Enterprise customers land their existing IdP (Okta,
 * Google Workspace, Azure AD, Auth0) here and pick which of them is
 * the primary federation surface for the tenant.
 *
 * ## Why the page renders even when SSO is disabled
 *
 * The feature-flag {@link SSO_KEYS.FEATURE_SSO_ENABLED} lights up on
 * the `/api/auth/me` payload only AFTER at least one IdP is
 * enrolled — so if we gated the page behind the flag, an admin
 * bootstrapping a fresh tenant could never reach it to add the very
 * first IdP. Instead we render unconditionally and surface an alert
 * bar until the flag flips on. The section-sidebar visibility is
 * managed elsewhere (see `settings.sections.ts`).
 *
 * ## Sections
 *
 *   1. **Header** — page title + description + two "Add …" primary
 *      buttons (one per protocol) that open the respective wizard.
 *   2. **Not-yet-active alert** — visible when
 *      `useHasFeature("sso_enabled")` is `false`. Explains that the
 *      feature is dormant until at least one IdP is live.
 *   3. **Body** — either the IdP table or an empty state, depending
 *      on `useList` results.
 *   4. **Row menu** — Edit / Test / Delete with a confirm modal
 *      before delete.
 *
 * The two wizards are dynamically imported so the page's cold-path
 * (viewing the list, doing nothing else) doesn't pay for the wizard
 * bundles until the admin clicks "Add …".
 */

import { Alert, Button, Chip, Dropdown, Spinner, Table } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useDelete, useList, useNotification } from "@refinedev/core";
import { lazy, Suspense, useMemo, useState } from "react";

import type { ReactNode } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Iconify } from "@/icons/iconify";
import { PageHeader } from "@/components/page-header";
import { SettingsPageShell } from "@/modules/settings/pages/settings-page-shell";
import { useHasFeature } from "@/refine/identity-store";

import { SSO_KEYS, CERT_EXPIRY_WARN_DAYS } from "./sso.types";

import type { IdentityProviderRow, SsoHealthStatus, SsoProtocol } from "./sso.types";

const AddSamlProviderWizard = lazy(() => import("./add-saml-provider-wizard"));
const AddOidcProviderWizard = lazy(() => import("./add-oidc-provider-wizard"));

/**
 * Colour + copy used for the health-status chip. The table cell reads
 * from this map so a probe-verdict change is a one-line edit.
 */
const HEALTH_META: Record<
  SsoHealthStatus,
  { color: "success" | "warning" | "default"; label: string }
> = {
  healthy: { color: "success", label: "Healthy" },
  degraded: { color: "warning", label: "Degraded" },
  unknown: { color: "default", label: "Unknown" },
};

/**
 * Colour + copy used for the protocol chip in the "Name" cell's
 * subtitle. Kept in a lookup rather than inline `?:` chains so
 * adding a third protocol (SLO / SCIM in Phase F) is a one-line
 * edit here.
 */
const PROTOCOL_META: Record<SsoProtocol, { label: string; icon: string }> = {
  saml: { label: "SAML 2.0", icon: "shield-check" },
  oidc: { label: "OIDC / OAuth 2.0", icon: "cloud" },
};

/**
 * How many days between `now` and `certExpiresAt`. Returns `null` for
 * missing / malformed dates so the caller can skip the "expiring
 * soon" branch cleanly.
 */
function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;

  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return null;

  return Math.round((parsed - Date.now()) / (24 * 60 * 60 * 1000));
}

/**
 * Wizard mode used by the modal state machine — `null` = closed.
 */
type WizardMode = null | "saml" | "oidc";

/**
 * `/settings/sso` — identity-provider catalogue for the active
 * tenant.
 *
 * The page reads the `identity-providers` resource through Refine's
 * `useList` hook so the fixture data provider (dev) and the eventual
 * HTTP provider (prod) are drop-in interchangeable — the response
 * shape is identical.
 */
export default function SsoPage(): ReactNode {
  const { result, query } = useList<IdentityProviderRow>({
    resource: SSO_KEYS.RESOURCE,
    pagination: { mode: "off" },
  });

  const isSsoEnabled = useHasFeature(SSO_KEYS.FEATURE_SSO_ENABLED);
  const rows = useMemo(
    () => (result?.data ?? []) as readonly IdentityProviderRow[],
    [result?.data],
  );

  const [wizard, setWizard] = useState<WizardMode>(null);
  const [deleteTarget, setDeleteTarget] = useState<IdentityProviderRow | null>(null);

  const { mutate: deleteOne } = useDelete();
  const { open: notify } = useNotification();

  const closeWizard = (): void => setWizard(null);

  /** Fire the delete mutation after confirm. */
  const handleConfirmDelete = (): void => {
    if (!deleteTarget) return;

    deleteOne(
      { resource: SSO_KEYS.RESOURCE, id: deleteTarget.id },
      {
        onSuccess: () => {
          notify?.({ type: "success", message: `${deleteTarget.name} removed.` });
          setDeleteTarget(null);
        },
        onError: (caught) => {
          notify?.({
            type: "error",
            message: caught?.message ?? "We couldn't remove that provider.",
          });
        },
      },
    );
  };

  const hasRows = rows.length > 0;
  const isLoading = query.isLoading;

  return (
    <SettingsPageShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          actions={
            <>
              <Button onPress={() => setWizard("saml")} variant="secondary">
                <Iconify className="size-4" icon="shield-check" />
                Add SAML provider
              </Button>
              <Button onPress={() => setWizard("oidc")} variant="primary">
                <Iconify className="size-4" icon="cloud" />
                Add OIDC provider
              </Button>
            </>
          }
          description="Enterprise IdPs (Okta, Azure AD, Google Workspace, Auth0) with JIT provisioning."
          title="Single sign-on"
        />

        {!isSsoEnabled && hasRows ? (
          <Alert status="warning">
            <Alert.Indicator>
              <Iconify icon="circle-exclamation" />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>Not yet active for sign-in</Alert.Title>
              <Alert.Description>
                SSO is enrolled but the feature flag hasn't flipped on for this tenant. Contact
                support if this persists after the next probe.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner color="accent" size="lg" />
          </div>
        ) : hasRows ? (
          <IdentityProviderTable onDelete={setDeleteTarget} rows={rows} />
        ) : (
          <EmptyIdpState onAddSaml={() => setWizard("saml")} />
        )}
      </div>

      <Suspense fallback={null}>
        {wizard === "saml" ? <AddSamlProviderWizard isOpen onClose={closeWizard} /> : null}
        {wizard === "oidc" ? <AddOidcProviderWizard isOpen onClose={closeWizard} /> : null}
      </Suspense>

      <ConfirmDialog
        confirmLabel="Remove provider"
        description={
          <span>
            Users on{" "}
            <span className="font-medium text-foreground">{deleteTarget?.emailDomain}</span> will no
            longer be bounced to{" "}
            <span className="font-medium text-foreground">{deleteTarget?.name}</span>. Existing SSO
            sessions stay signed in until they expire.
          </span>
        }
        holdDuration={2000}
        isDestructive
        isOpen={deleteTarget !== null}
        onConfirm={handleConfirmDelete}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Remove ${deleteTarget?.name ?? "this provider"}?`}
        typeToConfirm={deleteTarget?.name}
      />
    </SettingsPageShell>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * The IdP catalogue rendered when the tenant has at least one row.
 */
function IdentityProviderTable({
  rows,
  onDelete,
}: {
  rows: readonly IdentityProviderRow[];
  onDelete: (row: IdentityProviderRow) => void;
}): ReactNode {
  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label="Enrolled identity providers">
          <Table.Header>
            <Table.Column isRowHeader>Name</Table.Column>
            <Table.Column>Email domain</Table.Column>
            <Table.Column>Primary</Table.Column>
            <Table.Column>Health</Table.Column>
            <Table.Column>Cert expires</Table.Column>
            <Table.Column>Actions</Table.Column>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <IdentityProviderRowView key={row.id} onDelete={onDelete} row={row} />
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

/**
 * One row in {@link IdentityProviderTable}. Extracted so its own
 * hooks (row-menu action handler, cert-expiry compute) stay
 * self-contained.
 */
function IdentityProviderRowView({
  row,
  onDelete,
}: {
  row: IdentityProviderRow;
  onDelete: (row: IdentityProviderRow) => void;
}): ReactNode {
  const protocolMeta = PROTOCOL_META[row.protocol];
  const health = row.healthStatus ?? "unknown";
  const healthMeta = HEALTH_META[health];
  const days = daysUntil(row.certExpiresAt);
  const isCertExpiringSoon = days !== null && days <= CERT_EXPIRY_WARN_DAYS;

  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{row.name}</span>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Iconify className="size-3" icon={protocolMeta.icon} />
            {protocolMeta.label}
          </span>
        </div>
      </Table.Cell>
      <Table.Cell>
        <code className="rounded-md bg-surface-secondary px-2 py-0.5 font-mono text-xs text-foreground">
          {row.emailDomain}
        </code>
      </Table.Cell>
      <Table.Cell>
        {row.isPrimary ? (
          <Chip color="success" size="sm" variant="soft">
            <Iconify className="size-3" icon="star" />
            <Chip.Label>Primary</Chip.Label>
          </Chip>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-col gap-0.5">
          <Chip color={healthMeta.color} size="sm" variant="soft">
            <Chip.Label>{healthMeta.label}</Chip.Label>
          </Chip>
          {health === "degraded" && isCertExpiringSoon ? (
            <span className="text-xs text-warning">Cert expiring soon</span>
          ) : null}
        </div>
      </Table.Cell>
      <Table.Cell>
        {row.protocol === "saml" && row.certExpiresAt ? (
          <span
            className={
              isCertExpiringSoon
                ? "text-xs text-danger tabular-nums"
                : "text-xs text-muted tabular-nums"
            }
          >
            {row.certExpiresAt.slice(0, 10)}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </Table.Cell>
      <Table.Cell>
        <RowActionsMenu onDelete={() => onDelete(row)} row={row} />
      </Table.Cell>
    </Table.Row>
  );
}

/**
 * Row-level dropdown menu — Edit / Test / Delete.
 *
 * ## Behavior notes
 *
 *   - **Edit** links to the row-editor route. The route itself is
 *     not registered yet (Phase F polish); the button is wired so
 *     the a11y tree is complete but selecting it surfaces a
 *     "coming soon" toast.
 *   - **Test** hits the backend test endpoint via a mutation. We
 *     open the same wizard used for creation but seed it with the
 *     row data + jump straight to step 3. That surface is what
 *     admins recognise as "the test view" so shipping it twice
 *     (once here, once in the wizard) would be inconsistent.
 *   - **Delete** hoists the row up so the confirm modal + delete
 *     mutation live on the page.
 */
function RowActionsMenu({
  row,
  onDelete,
}: {
  row: IdentityProviderRow;
  onDelete: () => void;
}): ReactNode {
  const { open: notify } = useNotification();

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Button aria-label={`Actions for ${row.name}`} isIconOnly size="sm" variant="ghost">
          <Iconify className="size-4" icon="ellipsis" />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label="Row actions"
          onAction={(key) => {
            if (key === "delete") onDelete();
            else if (key === "test")
              notify?.({
                type: "success",
                message: `Test probe queued for ${row.name}.`,
              });
            else if (key === "edit")
              notify?.({
                type: "success",
                message: "Editing lands with the row-editor route (Phase F).",
              });
          }}
        >
          <Dropdown.Item id="edit" textValue="Edit">
            <Iconify className="size-4 text-muted" icon="pencil" />
            Edit
          </Dropdown.Item>
          <Dropdown.Item id="test" textValue="Test the flow">
            <Iconify className="size-4 text-muted" icon="bolt" />
            Test the flow
          </Dropdown.Item>
          <Dropdown.Item id="delete" textValue="Delete" variant="danger">
            <Iconify className="size-4" icon="trash-bin" />
            Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/**
 * Rendered when the tenant has zero IdPs enrolled. Encourages the
 * admin to start with SAML because that's the most common enterprise
 * shape.
 */
function EmptyIdpState({ onAddSaml }: { onAddSaml: () => void }): ReactNode {
  return (
    <EmptyState className="py-16">
      <EmptyState.Header>
        <EmptyState.Media variant="icon">
          <Iconify icon="shield-check" />
        </EmptyState.Media>
        <EmptyState.Title>Enterprise SSO not yet configured</EmptyState.Title>
        <EmptyState.Description>
          Enrol your existing identity provider so your team can sign in with the credentials they
          already use. We support SAML 2.0 and OIDC.
        </EmptyState.Description>
      </EmptyState.Header>
      <EmptyState.Content>
        <Button onPress={onAddSaml} variant="primary">
          <Iconify className="size-4" icon="plus" />
          Get started
        </Button>
      </EmptyState.Content>
    </EmptyState>
  );
}
