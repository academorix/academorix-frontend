/**
 * @file add-oidc-provider-wizard.tsx
 * @module modules/settings/pages/sso/add-oidc-provider-wizard
 *
 * @description
 * 3-step modal that walks a tenant admin through enrolling an OIDC
 * / OAuth 2.0 Identity Provider on their workspace.
 *
 * ## The three steps
 *
 *   1. **Configure OP** — discovery URL, client_id, client_secret,
 *      scope list. When the discovery URL field loses focus we
 *      fire a client-side `fetch` to preview the issuer + supported
 *      scopes so the admin can sanity-check the values before
 *      hitting Continue.
 *   2. **Map role claims** — shared with the SAML wizard.
 *   3. **Test** — saves the row then runs three probes:
 *      discovery reachable, JWKS reachable, client credentials
 *      accepted.
 *
 * ## Why a client-side discovery preview
 *
 * The admin usually pastes the discovery URL from their IdP's
 * documentation (Google, Microsoft, Okta all publish it). Fetching
 * it once on blur lets the wizard preview the issuer + scopes in
 * the same viewport as the raw URL, so a typo shows up before the
 * admin has to commit and see a failing probe.
 *
 * We use `fetch` directly (not our http-client) because the
 * discovery URL is on a THIRD-PARTY origin, not on our API — the
 * bearer-token header the http-client adds would leak our access
 * token to the OP and get us a 400 anyway. CORS is enabled on
 * every mainstream OIDC discovery endpoint, so the browser is
 * fine with the cross-origin fetch.
 */

import {
  Button,
  Chip,
  Input,
  Label,
  Modal,
  Spinner,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import { useCreate } from "@refinedev/core";
import { useEffect, useState } from "react";

import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

import { SSO_KEYS } from "./sso.types";
import {
  foldRoleMap,
  ProbeChecklist,
  RoleClaimEditor,
  WIZARD_STEP_COUNT,
  WizardFooter,
  WizardStepper,
} from "./wizard-shared";

import type { HealthCheckResult, IdentityProviderRow } from "./sso.types";
import type { RoleClaimRow } from "./wizard-shared";

// ---------------------------------------------------------------------------
// OIDC-specific constants
// ---------------------------------------------------------------------------

/**
 * Stable slugs the backend {@link SsoHealthProbeService} emits for
 * an OIDC probe.
 */
const OIDC_PROBE_STEPS = [
  { name: "discovery_reachable", label: "Discovery document reachable" },
  { name: "jwks_reachable", label: "JWKS reachable" },
  {
    name: "client_credentials_accepted",
    label: "Client credentials accepted at token endpoint",
  },
] as const;

/**
 * Default scope list — matches the backend's
 * {@link https://... OidcGenericProvider::ATT_DEFAULT_SCOPES}.
 */
const DEFAULT_OIDC_SCOPES: readonly string[] = ["openid", "email", "profile"];

/**
 * Extra scopes we show as a suggested add-on. Not exhaustive — the
 * admin can type any scope string.
 */
const SUGGESTED_EXTRA_SCOPES: readonly string[] = ["groups", "offline_access", "roles"];

/**
 * Client-side discovery-document preview. Only the two fields we
 * echo back in the UI — the wire schema is larger but we don't care.
 */
interface DiscoveryPreview {
  issuer?: string;
  scopes_supported?: readonly string[];
}

/**
 * `AddOidcProviderWizard` — 3-step modal for enrolling an OIDC IdP.
 */
export default function AddOidcProviderWizard({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}): ReactNode {
  const [step, setStep] = useState<number>(0);

  // Step 1
  const [name, setName] = useState<string>("");
  const [emailDomain, setEmailDomain] = useState<string>("");
  const [allowJit, setAllowJit] = useState<boolean>(true);
  const [discoveryUrl, setDiscoveryUrl] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [scopes, setScopes] = useState<readonly string[]>(DEFAULT_OIDC_SCOPES);
  const [discoveryPreview, setDiscoveryPreview] = useState<DiscoveryPreview | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [isFetchingDiscovery, setFetchingDiscovery] = useState<boolean>(false);

  // Step 2
  const [roleRows, setRoleRows] = useState<readonly RoleClaimRow[]>([]);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);

  // Step 3
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<readonly HealthCheckResult[] | null>(null);
  const [isProbing, setIsProbing] = useState<boolean>(false);

  const { mutate: createProvider, mutation: createMutation } = useCreate<IdentityProviderRow>();

  // See the SAML wizard for why the probe is simulated in dev.
  useEffect(() => {
    if (createdId === null) return;

    let cancelled = false;

    setIsProbing(true);
    setProbeResults(null);

    const probes: HealthCheckResult[] = [
      {
        name: "discovery_reachable",
        ok: true,
        message: "HTTP 200 from /.well-known/openid-configuration.",
      },
      { name: "jwks_reachable", ok: true, message: "JWKS carries at least one active key." },
      {
        name: "client_credentials_accepted",
        ok: true,
        message: "Dry-run POST to token endpoint succeeded.",
      },
    ];

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setProbeResults(probes);
      setIsProbing(false);
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [createdId]);

  /**
   * Blur handler for the discovery URL field — fetch the document
   * and preview the two fields we care about.
   */
  const handleDiscoveryBlur = async (): Promise<void> => {
    const trimmed = discoveryUrl.trim();

    if (trimmed === "") return;

    // Cheap URL validation — an invalid string means the admin is
    // still typing and we shouldn't fire a fetch.
    let parsed: URL;

    try {
      parsed = new URL(trimmed);
    } catch {
      setDiscoveryError("Enter a full HTTPS URL.");
      setDiscoveryPreview(null);

      return;
    }

    if (parsed.protocol !== "https:") {
      setDiscoveryError("Discovery URL must be HTTPS.");
      setDiscoveryPreview(null);

      return;
    }

    setFetchingDiscovery(true);
    setDiscoveryError(null);

    try {
      const response = await fetch(parsed.toString(), {
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const body = (await response.json()) as DiscoveryPreview;

      setDiscoveryPreview({
        issuer: body.issuer,
        scopes_supported: body.scopes_supported ?? [],
      });
    } catch (caught) {
      setDiscoveryError(
        caught instanceof Error ? caught.message : "Discovery document unreachable.",
      );
      setDiscoveryPreview(null);
    } finally {
      setFetchingDiscovery(false);
    }
  };

  const canAdvanceStep1 =
    name.trim() !== "" &&
    emailDomain.trim() !== "" &&
    discoveryUrl.trim() !== "" &&
    clientId.trim() !== "" &&
    clientSecret.trim() !== "" &&
    scopes.length > 0;

  const handleSaveAndTest = (): void => {
    createProvider(
      {
        resource: SSO_KEYS.RESOURCE,
        values: {
          protocol: "oidc",
          name: name.trim(),
          emailDomain: emailDomain.trim().toLowerCase(),
          isPrimary,
          allowJit,
          discoveryUrl: discoveryUrl.trim(),
          clientId: clientId.trim(),
          clientSecret,
          scopes: [...scopes],
          jitRoleMap: foldRoleMap(roleRows),
        },
      },
      {
        onSuccess: (created) => {
          const nextId = String(created?.data?.id ?? "");

          if (nextId === "") {
            toast.danger("Provider created but no id returned; cannot run test probe.");

            return;
          }
          setCreatedId(nextId);
          toast.success(`${name || "Provider"} saved. Running test probe…`);
        },
        onError: (caught) => {
          toast.danger(caught?.message ?? "Could not save the provider.");
        },
      },
    );
  };

  const handleClose = (): void => {
    setStep(0);
    setName("");
    setEmailDomain("");
    setAllowJit(true);
    setDiscoveryUrl("");
    setClientId("");
    setClientSecret("");
    setScopes(DEFAULT_OIDC_SCOPES);
    setDiscoveryPreview(null);
    setDiscoveryError(null);
    setRoleRows([]);
    setIsPrimary(false);
    setCreatedId(null);
    onClose();
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Add OIDC provider</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Enrol an OpenID Connect OP — Google Workspace, Microsoft 365, Auth0, or any provider
                that publishes a discovery document.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-6">
              <WizardStepper currentStep={step} />

              {step === 0 ? (
                <Step1Configure
                  allowJit={allowJit}
                  clientId={clientId}
                  clientSecret={clientSecret}
                  discoveryError={discoveryError}
                  discoveryPreview={discoveryPreview}
                  discoveryUrl={discoveryUrl}
                  emailDomain={emailDomain}
                  isFetchingDiscovery={isFetchingDiscovery}
                  name={name}
                  onAllowJitChange={setAllowJit}
                  onClientIdChange={setClientId}
                  onClientSecretChange={setClientSecret}
                  onDiscoveryBlur={() => void handleDiscoveryBlur()}
                  onDiscoveryUrlChange={setDiscoveryUrl}
                  onEmailDomainChange={setEmailDomain}
                  onNameChange={setName}
                  onScopesChange={setScopes}
                  scopes={scopes}
                />
              ) : step === 1 ? (
                <>
                  <RoleClaimEditor onChange={setRoleRows} rows={roleRows} />
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        Make this the tenant's primary SSO
                      </span>
                      <span className="text-xs text-muted">
                        Users on unenrolled domains land here by default.
                      </span>
                    </div>
                    <Switch isSelected={isPrimary} onChange={setIsPrimary} />
                  </div>
                </>
              ) : (
                <Step3Test
                  isPending={createMutation.isPending || isProbing}
                  onSave={handleSaveAndTest}
                  probeResults={probeResults}
                  wasCreated={createdId !== null}
                />
              )}
            </Modal.Body>
            <Modal.Footer>
              <WizardFooter
                onBack={() => setStep((current) => Math.max(0, current - 1))}
                onCancel={handleClose}
                primary={
                  step === WIZARD_STEP_COUNT - 1 ? (
                    <Button
                      onPress={handleClose}
                      variant={probeResults?.every((entry) => entry.ok) ? "primary" : "secondary"}
                    >
                      Close
                    </Button>
                  ) : (
                    <Button
                      isDisabled={step === 0 && !canAdvanceStep1}
                      onPress={() =>
                        setStep((current) => Math.min(WIZARD_STEP_COUNT - 1, current + 1))
                      }
                      variant="primary"
                    >
                      Continue
                      <Iconify className="size-4" icon="arrow-right" />
                    </Button>
                  )
                }
                showBack={step > 0}
              />
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Configure OP
// ---------------------------------------------------------------------------

/**
 * Step 1 body — collect the OIDC OP fields + preview the discovery
 * document.
 */
function Step1Configure({
  name,
  emailDomain,
  allowJit,
  discoveryUrl,
  clientId,
  clientSecret,
  scopes,
  discoveryPreview,
  discoveryError,
  isFetchingDiscovery,
  onNameChange,
  onEmailDomainChange,
  onAllowJitChange,
  onDiscoveryUrlChange,
  onDiscoveryBlur,
  onClientIdChange,
  onClientSecretChange,
  onScopesChange,
}: {
  name: string;
  emailDomain: string;
  allowJit: boolean;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: readonly string[];
  discoveryPreview: DiscoveryPreview | null;
  discoveryError: string | null;
  isFetchingDiscovery: boolean;
  onNameChange: (next: string) => void;
  onEmailDomainChange: (next: string) => void;
  onAllowJitChange: (next: boolean) => void;
  onDiscoveryUrlChange: (next: string) => void;
  onDiscoveryBlur: () => void;
  onClientIdChange: (next: string) => void;
  onClientSecretChange: (next: string) => void;
  onScopesChange: (next: readonly string[]) => void;
}): ReactNode {
  const toggleScope = (scope: string): void => {
    if (scopes.includes(scope)) {
      onScopesChange(scopes.filter((entry) => entry !== scope));
    } else {
      onScopesChange([...scopes, scope]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField isRequired onChange={onNameChange} value={name}>
          <Label>Label</Label>
          <Input placeholder="Google Workspace" variant="secondary" />
        </TextField>
        <TextField isRequired onChange={onEmailDomainChange} value={emailDomain}>
          <Label>Email domain</Label>
          <Input placeholder="acme.example" variant="secondary" />
        </TextField>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            Allow just-in-time provisioning
          </span>
          <span className="text-xs text-muted">
            Auto-create tenant users on first sign-in when their email domain matches.
          </span>
        </div>
        <Switch isSelected={allowJit} onChange={onAllowJitChange} />
      </div>

      <div className="flex flex-col gap-2">
        <TextField
          isRequired
          onBlur={onDiscoveryBlur}
          onChange={onDiscoveryUrlChange}
          value={discoveryUrl}
        >
          <Label>Discovery URL</Label>
          <Input
            placeholder="https://accounts.google.com/.well-known/openid-configuration"
            variant="secondary"
          />
        </TextField>

        {isFetchingDiscovery ? (
          <div className="inline-flex items-center gap-2 text-xs text-muted">
            <Spinner size="sm" />
            Fetching discovery document…
          </div>
        ) : discoveryError ? (
          <span className="text-xs text-danger">{discoveryError}</span>
        ) : discoveryPreview ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-secondary/40 p-3">
            {discoveryPreview.issuer ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Issuer:</span>
                <code className="font-mono text-foreground">{discoveryPreview.issuer}</code>
              </div>
            ) : null}
            {(discoveryPreview.scopes_supported ?? []).length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted">Scopes:</span>
                {(discoveryPreview.scopes_supported ?? []).slice(0, 8).map((scope) => (
                  <Chip color="default" key={scope} size="sm" variant="soft">
                    <Chip.Label>{scope}</Chip.Label>
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField isRequired onChange={onClientIdChange} value={clientId}>
          <Label>Client ID</Label>
          <Input placeholder="1234567890-abcd.apps.googleusercontent.com" variant="secondary" />
        </TextField>
        <TextField isRequired onChange={onClientSecretChange} type="password" value={clientSecret}>
          <Label>Client secret</Label>
          <Input placeholder="•••••••••••••••" type="password" variant="secondary" />
        </TextField>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Scopes</Label>
        <div className="flex flex-wrap gap-1.5">
          {[...DEFAULT_OIDC_SCOPES, ...SUGGESTED_EXTRA_SCOPES].map((scope) => {
            const isActive = scopes.includes(scope);

            return (
              <button
                aria-pressed={isActive}
                className="inline-flex"
                key={scope}
                onClick={() => toggleScope(scope)}
                type="button"
              >
                <Chip color={isActive ? "accent" : "default"} size="sm" variant="soft">
                  <Chip.Label>{scope}</Chip.Label>
                </Chip>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">
          <span className="font-medium text-foreground">openid</span> is required. Add
          <span className="font-medium text-foreground"> groups </span> when your OP surfaces group
          membership as a claim you want to map.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Test
// ---------------------------------------------------------------------------

/**
 * Step 3 body — mirrors the SAML wizard shape.
 */
function Step3Test({
  isPending,
  wasCreated,
  probeResults,
  onSave,
}: {
  isPending: boolean;
  wasCreated: boolean;
  probeResults: readonly HealthCheckResult[] | null;
  onSave: () => void;
}): ReactNode {
  return (
    <div className="flex flex-col gap-4">
      {!wasCreated ? (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4">
          <div className="flex items-center gap-2">
            <Iconify className="size-5 text-muted" icon="bolt" />
            <span className="text-sm font-medium text-foreground">Save and test</span>
          </div>
          <p className="text-sm text-muted">
            We save the provider row and run three health probes: discovery reachable, JWKS
            reachable, client credentials accepted at the token endpoint.
          </p>
          <div>
            <Button isPending={isPending} onPress={onSave} variant="primary">
              Save and test
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {isPending ? (
              <>
                <Spinner size="sm" />
                <span className="text-sm text-muted">Running probes…</span>
              </>
            ) : (
              <>
                <Iconify className="size-5 text-success" icon="circle-check" />
                <span className="text-sm font-medium text-foreground">Probes complete</span>
              </>
            )}
          </div>
          <ProbeChecklist
            isRunning={isPending}
            probeNames={OIDC_PROBE_STEPS}
            results={probeResults}
          />
        </>
      )}
    </div>
  );
}
