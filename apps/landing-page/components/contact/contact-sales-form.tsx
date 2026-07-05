/**
 * @file contact-sales-form.tsx
 * @module components/contact/contact-sales-form
 *
 * @description
 * Client Component powering `/contact-sales`. Collects the intake fields a
 * B2B enterprise sales team actually needs — first + last name, work email,
 * company, team size, primary interest, and message — and POSTs them to
 * the marketing backend. On success we swap the form for an EmptyState
 * confirmation with a link back home; on transport failure we surface a
 * mailto fallback so the lead is never lost.
 *
 * ## Composition
 *
 * HeroUI v3 form-field errors live on `<FieldError>` children of a
 * `<TextField>` (not on an `errorMessage` prop). The description slot
 * automatically hides when the field is invalid — no manual toggling.
 * That keeps every field's markup consistent with the rest of the
 * marketing forms (`create-workspace-form`, `find-workspaces-form`).
 */

"use client";

import { EnvelopeIcon, PaperAirplaneIcon } from "@academorix/ui/icons/outline";
import {
  Button,
  Checkbox,
  Description,
  EmptyState,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@academorix/ui/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import type { Key } from "@heroui/react";
import type { FormEvent, ReactNode } from "react";

import { MarketingApiError, postJson } from "@/lib/api-client/http";

/** Discriminated union of the form's rendering states. */
type FormState = "idle" | "submitting" | "sent" | "failed";

/** Team-size options — matched to standard B2B qualification bands. */
const TEAM_SIZE_KEYS = ["1_25", "26_100", "101_500", "500_plus"] as const;

/** Sales interest options — mirrors what the Enterprise product pages sell. */
const INTEREST_KEYS = [
  "multi_branch",
  "compliance",
  "migration",
  "custom_gateway",
  "volume_pricing",
  "other",
] as const;

/** Minimal in-memory payload the form posts to the backend. */
interface ContactSalesPayload {
  first_name: string;
  last_name: string;
  work_email: string;
  company: string;
  workspace_url: string;
  team_size: string;
  primary_interest: string;
  message: string;
  marketing_opt_in: boolean;
}

/**
 * Enterprise-grade Talk-to-Sales form. Client Component — every field is
 * controlled so we can surface field-level validation errors surfaced by the
 * backend and keep the "clear on retry" UX predictable.
 */
export function ContactSalesForm(): ReactNode {
  const t = useTranslations("contactSales.form");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [company, setCompany] = useState("");
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [teamSize, setTeamSize] = useState<Key | null>(null);
  const [primaryInterest, setPrimaryInterest] = useState<Key | null>(null);
  const [message, setMessage] = useState("");
  const [optIn, setOptIn] = useState(true);

  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isBusy = state === "submitting";

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setError(null);
      setFieldErrors({});
      setState("submitting");

      const payload: ContactSalesPayload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        work_email: workEmail.trim(),
        company: company.trim(),
        workspace_url: workspaceUrl.trim(),
        team_size: teamSize ? String(teamSize) : "",
        primary_interest: primaryInterest ? String(primaryInterest) : "",
        message: message.trim(),
        marketing_opt_in: optIn,
      };

      try {
        await postJson<null>("/v1/marketing/contact-sales", payload);
        setState("sent");
      } catch (caught) {
        if (caught instanceof MarketingApiError) {
          if (caught.errors) {
            setFieldErrors(caught.errors);
          }
          setError(caught.message);
        } else {
          setError(t("errors.transport"));
        }
        setState("failed");
      }
    },
    [
      firstName,
      lastName,
      workEmail,
      company,
      workspaceUrl,
      teamSize,
      primaryInterest,
      message,
      optIn,
      t,
    ],
  );

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-default bg-surface p-8 shadow-xl">
        <EmptyState size="lg">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <PaperAirplaneIcon className="size-6" />
            </EmptyState.Media>
            <EmptyState.Title>{t("sent.title")}</EmptyState.Title>
            <EmptyState.Description className="max-w-md text-pretty">
              {t("sent.description")}
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setState("idle");
                setFirstName("");
                setLastName("");
                setWorkEmail("");
                setCompany("");
                setWorkspaceUrl("");
                setTeamSize(null);
                setPrimaryInterest(null);
                setMessage("");
              }}
            >
              {t("sent.sendAnother")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      </div>
    );
  }

  return (
    <Form
      className="rounded-2xl border border-default bg-surface p-6 shadow-xl sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-6">
        {/* First + Last name */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            isRequired
            isDisabled={isBusy}
            isInvalid={Boolean(fieldErrors.first_name)}
            name="first_name"
            value={firstName}
            onChange={setFirstName}
          >
            <Label>{t("fields.firstName.label")}</Label>
            <Input
              autoComplete="given-name"
              placeholder={t("fields.firstName.placeholder")}
              variant="secondary"
            />
            {fieldErrors.first_name ? <FieldError>{fieldErrors.first_name[0]}</FieldError> : null}
          </TextField>
          <TextField
            isRequired
            isDisabled={isBusy}
            isInvalid={Boolean(fieldErrors.last_name)}
            name="last_name"
            value={lastName}
            onChange={setLastName}
          >
            <Label>{t("fields.lastName.label")}</Label>
            <Input
              autoComplete="family-name"
              placeholder={t("fields.lastName.placeholder")}
              variant="secondary"
            />
            {fieldErrors.last_name ? <FieldError>{fieldErrors.last_name[0]}</FieldError> : null}
          </TextField>
        </div>

        {/* Work email */}
        <TextField
          isRequired
          isDisabled={isBusy}
          isInvalid={Boolean(fieldErrors.work_email)}
          name="work_email"
          type="email"
          value={workEmail}
          onChange={setWorkEmail}
        >
          <Label>{t("fields.workEmail.label")}</Label>
          <Input
            autoComplete="email"
            placeholder={t("fields.workEmail.placeholder")}
            variant="secondary"
          />
          <Description>{t("fields.workEmail.help")}</Description>
          {fieldErrors.work_email ? <FieldError>{fieldErrors.work_email[0]}</FieldError> : null}
        </TextField>

        {/* Company + workspace URL */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            isRequired
            isDisabled={isBusy}
            isInvalid={Boolean(fieldErrors.company)}
            name="company"
            value={company}
            onChange={setCompany}
          >
            <Label>{t("fields.company.label")}</Label>
            <Input
              autoComplete="organization"
              placeholder={t("fields.company.placeholder")}
              variant="secondary"
            />
            {fieldErrors.company ? <FieldError>{fieldErrors.company[0]}</FieldError> : null}
          </TextField>
          <TextField
            isDisabled={isBusy}
            isInvalid={Boolean(fieldErrors.workspace_url)}
            name="workspace_url"
            value={workspaceUrl}
            onChange={setWorkspaceUrl}
          >
            <Label>{t("fields.workspaceUrl.label")}</Label>
            <Input
              autoComplete="url"
              placeholder={t("fields.workspaceUrl.placeholder")}
              variant="secondary"
            />
            <Description>{t("fields.workspaceUrl.help")}</Description>
            {fieldErrors.workspace_url ? (
              <FieldError>{fieldErrors.workspace_url[0]}</FieldError>
            ) : null}
          </TextField>
        </div>

        {/* Team size + primary interest */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            isRequired
            className="w-full"
            isDisabled={isBusy}
            name="team_size"
            placeholder={t("fields.teamSize.placeholder")}
            value={teamSize}
            variant="secondary"
            onChange={setTeamSize}
          >
            <Label>{t("fields.teamSize.label")}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {TEAM_SIZE_KEYS.map((key) => (
                  <ListBox.Item key={key} id={key} textValue={t(`fields.teamSize.options.${key}`)}>
                    {t(`fields.teamSize.options.${key}`)}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            isRequired
            className="w-full"
            isDisabled={isBusy}
            name="primary_interest"
            placeholder={t("fields.primaryInterest.placeholder")}
            value={primaryInterest}
            variant="secondary"
            onChange={setPrimaryInterest}
          >
            <Label>{t("fields.primaryInterest.label")}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {INTEREST_KEYS.map((key) => (
                  <ListBox.Item
                    key={key}
                    id={key}
                    textValue={t(`fields.primaryInterest.options.${key}`)}
                  >
                    {t(`fields.primaryInterest.options.${key}`)}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Message — TextArea composed inside TextField for validation slots */}
        <TextField
          isRequired
          isDisabled={isBusy}
          isInvalid={Boolean(fieldErrors.message)}
          name="message"
          value={message}
          onChange={setMessage}
        >
          <Label>{t("fields.message.label")}</Label>
          <TextArea
            minLength={20}
            placeholder={t("fields.message.placeholder")}
            rows={5}
            variant="secondary"
          />
          <Description>{t("fields.message.help")}</Description>
          {fieldErrors.message ? <FieldError>{fieldErrors.message[0]}</FieldError> : null}
        </TextField>

        {/* Consent */}
        <Checkbox isDisabled={isBusy} isSelected={optIn} onChange={setOptIn}>
          <Checkbox.Control />
          <Label className="text-sm text-muted">{t("fields.optIn.label")}</Label>
        </Checkbox>

        {/* Error banner + mailto fallback */}
        {state === "failed" && error ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm">
            <p className="font-medium text-danger">{error}</p>
            <p className="mt-1 text-muted">
              {t("errors.fallbackPrompt")}{" "}
              <a
                className="text-accent underline"
                href={`mailto:sales@academorix.com?subject=${encodeURIComponent(
                  t("errors.fallbackSubject"),
                )}&body=${encodeURIComponent(
                  [
                    `${t("fields.firstName.label")}: ${firstName} ${lastName}`,
                    `${t("fields.workEmail.label")}: ${workEmail}`,
                    `${t("fields.company.label")}: ${company}`,
                    `${t("fields.message.label")}: ${message}`,
                  ].join("\n"),
                )}`}
              >
                sales@academorix.com
              </a>
            </p>
          </div>
        ) : null}

        {/* Submit */}
        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">{t("privacy")}</p>
          <Button className="w-full sm:w-auto" isDisabled={isBusy} type="submit" variant="primary">
            {isBusy ? (
              t("submit.busy")
            ) : (
              <>
                <EnvelopeIcon aria-hidden="true" className="size-4" />
                {t("submit.idle")}
              </>
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
}
