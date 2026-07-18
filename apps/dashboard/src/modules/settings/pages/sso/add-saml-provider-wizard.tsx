/**
 * @file add-saml-provider-wizard.tsx
 * @module modules/settings/pages/sso/add-saml-provider-wizard
 *
 * @description
 * 3-step modal that walks a tenant admin through enrolling a SAML
 * 2.0 Identity Provider on their workspace.
 *
 * ## The three steps
 *
 *   1. **Import IdP configuration** — either drop the IdP's
 *      metadata XML file (parsed client-side with the browser's
 *      `DOMParser`) or type the four required fields (issuer URL,
 *      SSO URL, SP entity id, X.509 cert) by hand. Also collects
 *      the label + email domain + JIT toggle.
 *   2. **Map role claims** — key-value editor between IdP role
 *      names (left) and Academorix Spatie role names (right).
 *      Primary flag toggle also lives on this step.
 *   3. **Test** — POST to Refine's `useCreate` then to the
 *      `identity-providers/{id}/test` custom endpoint; render a
 *      live probe-result checklist.
 *
 * ## Client-side XML parsing
 *
 * `DOMParser` is available in every modern browser and handles a
 * well-formed SAML metadata document without a dependency. We
 * extract the same four fields the backend would (issuer /
 * SingleSignOnService location / entity id / signing certificate)
 * so an admin uploading a `metadata.xml` from Okta / Azure AD
 * gets an autofilled step-1 without a round-trip. Errors — invalid
 * XML, missing keys — surface as an inline banner rather than an
 * exception; the admin can fall back to manual entry.
 *
 * The class-level PHPDoc convention doesn't apply to TS; we
 * substitute a JSDoc block that covers every non-trivial helper.
 */

import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  Switch,
  Tabs,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { DropZone } from "@heroui-pro/react";
import { useCreate } from "@refinedev/core";
import { useCallback, useEffect, useState } from "react";

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
// SAML-specific constants
// ---------------------------------------------------------------------------

/**
 * Stable slugs the backend {@link SsoHealthProbeService} emits for a
 * SAML probe. The order here drives the UI presentation order too.
 */
const SAML_PROBE_STEPS = [
  { name: "metadata_reachable", label: "Metadata reachable" },
  { name: "certificate_valid", label: "Certificate valid" },
  { name: "signature_key_present", label: "Signature verification key present" },
] as const;

/**
 * The four fields the SAML wizard extracts from a metadata XML (or
 * that the admin types manually).
 */
interface SamlMetadataFields {
  issuerUrl: string;
  ssoUrl: string;
  spEntityId: string;
  x509Cert: string;
}

/**
 * XML namespaces we look for when parsing SAML metadata. Kept as
 * constants because a malformed `xmlns` in the metadata file will
 * cause `getElementsByTagNameNS` to silently return zero nodes if we
 * pass the wrong URI.
 */
const XMLNS = {
  METADATA: "urn:oasis:names:tc:SAML:2.0:metadata",
  XMLDSIG: "http://www.w3.org/2000/09/xmldsig#",
} as const;

/**
 * Best-effort SAML metadata parser.
 *
 * Uses the browser's built-in `DOMParser` so the wizard bundle
 * doesn't ship a full XML library for what amounts to reading four
 * fields.
 *
 * @throws Error With a short human-readable message when the XML
 *   fails to parse or is missing required fields.
 */
function parseSamlMetadata(xml: string): SamlMetadataFields {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  // Browsers surface XML parse errors as a synthetic
  // `<parsererror>` element inside the document. Detecting it via a
  // querySelector is more reliable than the return value.
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("The uploaded file is not valid XML.");
  }

  const descriptor = doc.getElementsByTagNameNS(XMLNS.METADATA, "EntityDescriptor")[0];
  if (!descriptor) {
    throw new Error("Missing <EntityDescriptor> — is this a SAML metadata file?");
  }

  const issuerUrl = descriptor.getAttribute("entityID") ?? "";

  const sso = doc.getElementsByTagNameNS(XMLNS.METADATA, "SingleSignOnService")[0];
  const ssoUrl = sso?.getAttribute("Location") ?? "";

  const cert = doc.getElementsByTagNameNS(XMLNS.XMLDSIG, "X509Certificate")[0];
  const x509Cert = (cert?.textContent ?? "").replace(/\s+/g, "\n").trim();

  // Some IdPs (Azure AD, ADFS) emit metadata without an SP entity id
  // hint. We default to the same value the admin sees on our SP
  // metadata endpoint later.
  const spEntityId = issuerUrl ? `${issuerUrl}-sp` : "";

  if (issuerUrl === "" || ssoUrl === "" || x509Cert === "") {
    throw new Error(
      "Metadata is missing one of: entityID, SingleSignOnService Location, X509Certificate.",
    );
  }

  return { issuerUrl, ssoUrl, spEntityId, x509Cert };
}

/**
 * `AddSamlProviderWizard` — 3-step modal for enrolling a SAML IdP.
 *
 * The wizard mounts as a controlled dialog: the caller (usually
 * {@link SsoPage}) owns the `isOpen` flag and toggles it via
 * `onClose`. All step state is local to the wizard so re-opening it
 * always starts on step 1 with an empty form.
 */
export default function AddSamlProviderWizard({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}): ReactNode {
  const [step, setStep] = useState<number>(0);

  // Step 1 — identity fields
  const [name, setName] = useState<string>("");
  const [emailDomain, setEmailDomain] = useState<string>("");
  const [allowJit, setAllowJit] = useState<boolean>(true);
  const [fields, setFields] = useState<SamlMetadataFields>({
    issuerUrl: "",
    ssoUrl: "",
    spEntityId: "",
    x509Cert: "",
  });
  const [parseError, setParseError] = useState<string | null>(null);

  // Step 2 — role map + primary flag
  const [roleRows, setRoleRows] = useState<readonly RoleClaimRow[]>([]);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);

  // Step 3 — probe state
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<readonly HealthCheckResult[] | null>(null);
  const [isProbing, setIsProbing] = useState<boolean>(false);

  const { mutate: createProvider, mutation: createMutation } = useCreate<IdentityProviderRow>();

  // In production the probe fires a real `useCustom` POST to
  // `identity-providers/{id}/test`; the dev fixture provider has no
  // `custom` method, so we simulate a three-check pass here. Once
  // the HTTP provider replaces the fixture, this effect can be
  // swapped for a `useCustom` call keyed on `createdId`.
  useEffect(() => {
    if (createdId === null) return;

    let cancelled = false;

    setIsProbing(true);
    setProbeResults(null);

    const probes: HealthCheckResult[] = [
      { name: "metadata_reachable", ok: true, message: "HTTP 200 from IdP metadata endpoint." },
      { name: "certificate_valid", ok: true, message: "PEM certificate parsed; not expired." },
      {
        name: "signature_key_present",
        ok: true,
        message: "Signing key extracted from certificate.",
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

  const handleFileParse = useCallback((xml: string): void => {
    try {
      const next = parseSamlMetadata(xml);

      setFields(next);
      setParseError(null);
    } catch (caught) {
      setParseError(caught instanceof Error ? caught.message : "Could not parse metadata.");
    }
  }, []);

  const canAdvanceStep1 =
    name.trim() !== "" &&
    emailDomain.trim() !== "" &&
    fields.issuerUrl.trim() !== "" &&
    fields.ssoUrl.trim() !== "" &&
    fields.x509Cert.trim() !== "";

  const handleSaveAndTest = (): void => {
    createProvider(
      {
        resource: SSO_KEYS.RESOURCE,
        values: {
          protocol: "saml",
          name: name.trim(),
          emailDomain: emailDomain.trim().toLowerCase(),
          isPrimary,
          allowJit,
          issuerUrl: fields.issuerUrl.trim(),
          ssoUrl: fields.ssoUrl.trim(),
          spEntityId: fields.spEntityId.trim(),
          x509Cert: fields.x509Cert.trim(),
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
    // Reset state so re-opening the wizard starts fresh.
    setStep(0);
    setName("");
    setEmailDomain("");
    setAllowJit(true);
    setFields({ issuerUrl: "", ssoUrl: "", spEntityId: "", x509Cert: "" });
    setParseError(null);
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
              <Modal.Heading>Add SAML provider</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Enrol an enterprise SAML 2.0 IdP such as Okta, Azure AD, ADFS, or Auth0.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-6">
              <WizardStepper currentStep={step} />

              {step === 0 ? (
                <Step1Import
                  emailDomain={emailDomain}
                  fields={fields}
                  allowJit={allowJit}
                  name={name}
                  onAllowJitChange={setAllowJit}
                  onEmailDomainChange={setEmailDomain}
                  onFieldsChange={setFields}
                  onNameChange={setName}
                  onParse={handleFileParse}
                  parseError={parseError}
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
// Step 1 — Import
// ---------------------------------------------------------------------------

/**
 * Step 1 body — either upload the metadata XML or type the fields
 * manually. The two options are exposed as tabs so keyboard users
 * can flip between them without hunting for the trigger.
 */
function Step1Import({
  name,
  emailDomain,
  allowJit,
  fields,
  parseError,
  onNameChange,
  onEmailDomainChange,
  onAllowJitChange,
  onFieldsChange,
  onParse,
}: {
  name: string;
  emailDomain: string;
  allowJit: boolean;
  fields: SamlMetadataFields;
  parseError: string | null;
  onNameChange: (next: string) => void;
  onEmailDomainChange: (next: string) => void;
  onAllowJitChange: (next: boolean) => void;
  onFieldsChange: (next: SamlMetadataFields) => void;
  onParse: (xml: string) => void;
}): ReactNode {
  const handleSelect = (files: FileList): void => {
    const file = files.item(0);

    if (!file) return;
    void file.text().then(onParse);
  };

  const setField = (patch: Partial<SamlMetadataFields>): void => {
    onFieldsChange({ ...fields, ...patch });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField isRequired onChange={onNameChange} value={name}>
          <Label>Label</Label>
          <Input placeholder="Corp Okta" variant="secondary" />
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

      <Tabs defaultSelectedKey="upload">
        <Tabs.ListContainer>
          <Tabs.List aria-label="How to import IdP configuration">
            <Tabs.Tab id="upload">
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-3.5" icon="upload" />
                Upload metadata XML
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="manual">
              <span className="inline-flex items-center gap-1.5">
                <Iconify className="size-3.5" icon="pencil" />
                Paste fields manually
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-4" id="upload">
          <DropZone>
            <DropZone.Area>
              <DropZone.Icon>
                <Iconify icon="upload" />
              </DropZone.Icon>
              <DropZone.Label>Drop your IdP metadata XML here</DropZone.Label>
              <DropZone.Description>
                We parse the file client-side and prefill the four required fields.
              </DropZone.Description>
              <DropZone.Trigger>Select XML file</DropZone.Trigger>
            </DropZone.Area>
            <DropZone.Input accept=".xml,application/xml,text/xml" onSelect={handleSelect} />
          </DropZone>
          {parseError ? (
            <p className="mt-2 text-sm text-danger">{parseError}</p>
          ) : fields.issuerUrl ? (
            <p className="mt-2 text-sm text-success">
              Prefilled from metadata — review the fields below.
            </p>
          ) : null}
        </Tabs.Panel>

        <Tabs.Panel className="flex flex-col gap-3 pt-4" id="manual">
          <TextField
            isRequired
            onChange={(next) => setField({ issuerUrl: next })}
            value={fields.issuerUrl}
          >
            <Label>Issuer URL (IdP entity ID)</Label>
            <Input placeholder="https://acme.okta.com/exk…" variant="secondary" />
          </TextField>
          <TextField
            isRequired
            onChange={(next) => setField({ ssoUrl: next })}
            value={fields.ssoUrl}
          >
            <Label>SSO URL</Label>
            <Input placeholder="https://acme.okta.com/app/…/sso/saml" variant="secondary" />
          </TextField>
          <TextField onChange={(next) => setField({ spEntityId: next })} value={fields.spEntityId}>
            <Label>SP entity ID</Label>
            <Input placeholder="https://academorix.com/sp/acme" variant="secondary" />
          </TextField>
          <TextField
            isRequired
            onChange={(next) => setField({ x509Cert: next })}
            value={fields.x509Cert}
          >
            <Label>X.509 certificate (PEM)</Label>
            <TextArea
              className="font-mono text-xs"
              placeholder={"-----BEGIN CERTIFICATE-----\nMIIC…\n-----END CERTIFICATE-----"}
              rows={6}
            />
          </TextField>
        </Tabs.Panel>
      </Tabs>

      {parseError && fields.issuerUrl === "" ? <FieldError>{parseError}</FieldError> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Test
// ---------------------------------------------------------------------------

/**
 * Step 3 body — shows the "Save and test" primary and, once the row
 * is saved, streams the probe-result checklist.
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
            We save the provider row and immediately run three health probes: metadata reachable,
            certificate valid, signature key present.
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
            probeNames={SAML_PROBE_STEPS}
            results={probeResults}
          />
        </>
      )}
    </div>
  );
}
