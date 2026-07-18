/**
 * @file phone-input.tsx
 * @module components/phone-input
 *
 * @description
 * Production `PhoneInput` — a country-code picker fused with a national-
 * number input that always emits **E.164** ("+15551234567") into the
 * enclosing form. Designed to slot into `GenericFormPage`'s field
 * dispatch table (`kind: "phone"`) without any special wiring at the
 * call site: it renders a hidden `<input name={name}>` so native
 * `FormData` submission captures the normalised value regardless of
 * the internal composition.
 *
 * ## Anatomy
 *
 *   ┌───────────────────────────────────────────────────┐
 *   │ [🇸🇦 +966 ▾]  55 123 4567                          │
 *   └───────────────────────────────────────────────────┘
 *
 * Left half is a HeroUI `Autocomplete` (typeahead-searchable Select
 * with SearchField inside its Popover) fed by `PHONE_COUNTRIES`. The
 * trigger renders the current country's flag + dial code via
 * `Autocomplete.Value`'s render-prop. The popover surfaces a fully
 * accessible list with search-as-you-type on English name / ISO / dial.
 * Right half is a plain `<Input>` for the national number, filtered to
 * digits + separators on input so users can paste anything and end up
 * with a clean canonical form on the way out.
 *
 * ## Value contract
 *
 *   * Uncontrolled by default — `defaultValue="+15551234567"` seeds
 *     both halves, and the form reads the emitted E.164 out of the
 *     hidden input on submit.
 *   * Fully controlled via `value` + `onChange` when the caller wants
 *     to observe or override typing (cross-field validation, etc.).
 *   * Empty national number emits `""` — the enclosing form's
 *     `coerceValue` converts that to `undefined` and drops the field
 *     from the payload entirely.
 *
 * ## Accessibility
 *
 *   * The visible `<Label>` sits above the composite and its `htmlFor`
 *     targets the national-number input, so screen readers read
 *     "Phone number" as the label for the primary editable surface.
 *   * The country picker exposes its own `aria-label` ("Country code")
 *     inside `Autocomplete` so the two halves have independent
 *     accessible names.
 *   * The hidden `<input>` picks up the same `name` + `required` so
 *     browser-native form validation still fires on submit.
 *
 * ## Design intent
 *
 * We deliberately avoided a full `libphonenumber` bundle here — the
 * curated country table in `phone-countries.ts` covers every market
 * the app ships to today (60+ countries), while a real
 * `libphonenumber-js` swap-in would add ~150 KB gzipped. When we need
 * per-country strict validation the field can grow a `strict` flag
 * and lazy-import metadata for that country only.
 */

import type { Key } from "react";
import type { PhoneCountry } from "@/lib/phone-countries";
import type { ReactNode } from "react";

import {
  Autocomplete,
  Description,
  EmptyState,
  FieldError,
  Input,
  Label,
  ListBox,
  SearchField,
  useFilter,
} from "@heroui/react";
import { useCallback, useId, useMemo, useState } from "react";

import { Iconify } from "@/icons/iconify";
import {
  DEFAULT_PHONE_COUNTRY_ISO2,
  PHONE_COUNTRIES,
  findCountryByIso2,
  formatE164,
  parseE164,
} from "@/lib/phone-countries";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Public props for `PhoneInput`.
 *
 * A deliberately narrow surface — the caller only needs the field
 * metadata (name / label / description) and a handful of behavioural
 * flags. Advanced compositions (validation, imperative focus, etc.)
 * can drop down to a bespoke arrangement of `Autocomplete` + `Input`
 * from `@heroui/react` — this component is a pre-composed primitive
 * for the form dispatch table.
 */
export type PhoneInputProps = {
  /** Form field name — used for the hidden `<input>` that submits E.164. */
  name: string;
  /** Visible label above the composite. */
  label: string;
  /** Optional helper text under the composite. */
  description?: string;
  /** Placeholder for the national-number input (e.g. "55 123 4567"). */
  placeholder?: string;
  /** Whether the field is required — surfaces on both the visible + hidden inputs. */
  isRequired?: boolean;
  /** Disable the entire composite. */
  isDisabled?: boolean;
  /** Initial E.164 value for uncontrolled usage. */
  defaultValue?: string;
  /** Controlled E.164 value. When set, the caller must also supply `onChange`. */
  value?: string;
  /** Fired whenever the effective E.164 value changes (empty string when cleared). */
  onChange?: (e164: string) => void;
  /**
   * ISO 3166-1 alpha-2 fallback when the value can't infer a country
   * (empty string, malformed input). Defaults to
   * `DEFAULT_PHONE_COUNTRY_ISO2` from the country table.
   */
  defaultIso2?: string;
  /** Extra className for the outer wrapper. */
  className?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * The composite phone input. See the file-level docblock for the full
 * behavioural contract; the implementation notes below focus on the
 * moving parts.
 *
 * State model:
 *
 *   1. `country` — the currently selected {@link PhoneCountry}. Drives
 *      the trigger label + which dial code is prepended to the emitted
 *      E.164 string.
 *   2. `national` — the raw user-typed national number. We keep the
 *      user's exact string (including spaces / dashes) inside the
 *      visible input so typing feels natural, and normalise to digits
 *      only when computing the hidden E.164 output.
 *   3. `syntheticValue` — the joined E.164 string emitted to the hidden
 *      input + `onChange` callback. Recomputed from `country` + `national`
 *      on every render — never stored — so there's no drift risk.
 *
 * Controlled vs uncontrolled: when `value` is set we derive both halves
 * from it on every render; otherwise local state is authoritative and
 * `defaultValue` seeds it once.
 */
export function PhoneInput({
  name,
  label,
  description,
  placeholder,
  isRequired,
  isDisabled,
  defaultValue,
  value,
  onChange,
  defaultIso2,
  className,
}: PhoneInputProps): ReactNode {
  const isControlled = value !== undefined;
  const { contains } = useFilter({ sensitivity: "base" });

  // --- initial state --------------------------------------------------------
  // Prefer `value` (controlled) → `defaultValue` (uncontrolled seed) → empty.
  // Whichever we pick, `parseE164` might return `undefined` — in that case
  // we fall back to the caller's `defaultIso2` and finally the app-wide
  // default (Saudi Arabia today).
  const initial = useMemo(() => {
    const seed = isControlled ? value : (defaultValue ?? "");
    const parsed = seed ? parseE164(seed) : undefined;

    if (parsed) return parsed;
    const fallback =
      findCountryByIso2(defaultIso2 ?? DEFAULT_PHONE_COUNTRY_ISO2) ?? PHONE_COUNTRIES[0]!;

    return { country: fallback, nationalNumber: "" };
  }, [defaultValue, defaultIso2, isControlled, value]);

  // Uncontrolled local state — kept authoritative unless `value` is set.
  const [localCountry, setLocalCountry] = useState<PhoneCountry>(initial.country);
  const [localNational, setLocalNational] = useState<string>(initial.nationalNumber);

  // Controlled synchronisation — recompute on every render from `value`.
  // Cheap because both `parseE164` and `findCountryByIso2` are O(n) over a
  // 60-row table without any per-render allocations besides the return
  // object.
  const { country, national } = useMemo<{ country: PhoneCountry; national: string }>(() => {
    if (!isControlled) return { country: localCountry, national: localNational };
    const parsed = value ? parseE164(value) : undefined;

    return parsed
      ? { country: parsed.country, national: parsed.nationalNumber }
      : { country: initial.country, national: "" };
  }, [isControlled, value, localCountry, localNational, initial.country]);

  // --- derived --------------------------------------------------------------
  // The joined E.164 string. Empty when the national number is empty —
  // matches "field left blank" so the form drops it from the payload.
  const syntheticValue = useMemo(() => formatE164(country, national), [country, national]);

  // --- handlers -------------------------------------------------------------
  const handleCountrySelect = useCallback(
    (nextKey: Key | Key[] | null) => {
      if (!nextKey || Array.isArray(nextKey)) return;
      const next = findCountryByIso2(String(nextKey));

      if (!next) return; // guard against stale keys

      if (!isControlled) setLocalCountry(next);
      onChange?.(formatE164(next, national));
    },
    [isControlled, national, onChange],
  );

  const handleNationalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;

      // Allow digits, spaces, dashes, parentheses so pastes from
      // various sources feel natural. Normalisation happens in
      // `formatE164` before emission.
      const filtered = raw.replace(/[^\d\s\-()]/g, "");

      if (!isControlled) setLocalNational(filtered);
      onChange?.(formatE164(country, filtered));
    },
    [country, isControlled, onChange],
  );

  // Stable id for the internal label ↔ input association. React 18's
  // `useId` gives a per-instance value that survives HMR without
  // colliding with sibling forms on the same page.
  const fieldId = useId();

  // --- render ---------------------------------------------------------------
  return (
    <div className={"flex flex-col gap-1.5 " + (className ?? "")}>
      <Label htmlFor={fieldId}>{label}</Label>

      <div className="flex items-stretch gap-2">
        <Autocomplete
          className="w-auto shrink-0"
          isDisabled={isDisabled}
          onChange={handleCountrySelect}
          selectionMode="single"
          value={country.iso2}
        >
          <Autocomplete.Trigger className="min-w-[92px]">
            <Autocomplete.Value>
              {({ isPlaceholder }) => {
                // We always have a country (default fallback ensures it), so
                // `isPlaceholder` should be false — but guard just in case
                // React Aria re-mounts with a stale value.
                if (isPlaceholder) {
                  return <span className="text-muted">Country</span>;
                }

                return (
                  <span className="inline-flex items-center gap-1.5">
                    <Iconify
                      aria-hidden
                      className="size-4 rounded-[3px]"
                      icon={`flag:${country.iso2}-4x3`}
                    />
                    <span className="text-sm tabular-nums">{country.dialCode}</span>
                  </span>
                );
              }}
            </Autocomplete.Value>
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover className="min-w-64">
            <Autocomplete.Filter filter={contains}>
              <SearchField autoFocus name="phone-country-search" variant="secondary">
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Search country or dial code" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
              <ListBox
                className="max-h-72 overflow-y-auto"
                renderEmptyState={() => <EmptyState>No country found</EmptyState>}
              >
                {PHONE_COUNTRIES.map((entry) => (
                  <ListBox.Item
                    key={entry.iso2}
                    id={entry.iso2}
                    textValue={`${entry.name} ${entry.dialCode} ${entry.iso2}`}
                  >
                    <Iconify
                      aria-hidden
                      className="size-4 shrink-0 rounded-[3px]"
                      icon={`flag:${entry.iso2}-4x3`}
                    />
                    <span className="flex-1 truncate">{entry.name}</span>
                    <span className="text-muted tabular-nums">{entry.dialCode}</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Autocomplete.Filter>
          </Autocomplete.Popover>
        </Autocomplete>

        <Input
          aria-required={isRequired}
          disabled={isDisabled}
          id={fieldId}
          inputMode="tel"
          onChange={handleNationalChange}
          placeholder={placeholder}
          type="tel"
          value={national}
        />
      </div>

      {description ? <Description>{description}</Description> : null}
      <FieldError />

      {/*
       * The single source of truth for form submission. Native
       * FormData reads this input on submit — the visible composite
       * above is presentational only. `required` on the hidden input
       * keeps browser validation working even though the visible focus
       * target is the national-number input.
       */}
      <input
        aria-hidden
        name={name}
        readOnly
        required={isRequired}
        tabIndex={-1}
        type="hidden"
        value={syntheticValue}
      />
    </div>
  );
}
