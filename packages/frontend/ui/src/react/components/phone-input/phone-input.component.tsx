/**
 * @file phone-input.component.tsx
 * @module @stackra/ui/react/components/phone-input
 * @description International phone number input with a searchable
 *   country picker.
 *
 *   The country prefix is a real `Popover` trigger — pressing it
 *   opens a scrollable `ListBox` of countries filterable via
 *   `preferredCountries` / `onlyCountries` / `excludedCountries`.
 *   React Aria owns the `aria-haspopup` / `aria-expanded` linkage,
 *   keyboard activation (Enter / Space to open, arrows to move
 *   through the list, Enter to select), and screen-reader
 *   announcements — closing the Round 6 UI reviewer P1 finding
 *   that the previous button was inert.
 *
 *   See `.kiro/reports/ui-p1-fixes-2026-07-21.md`.
 */

"use client";

import {
  Button,
  Description,
  FieldError,
  InputGroup,
  Label,
  ListBox,
  Popover,
  TextField,
} from "@heroui/react";
import { Str } from "@stackra/support";
import React, { useCallback, useMemo, useRef, useState, type Key } from "react";

import { CALLING_CODES, DEFAULT_COUNTRIES } from "./phone-input.constants";

import type { PhoneCountry, PhoneInputInfo, PhoneInputProps } from "./phone-input.interface";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get the calling code for a country.
 *
 * @param countryCode - ISO 3166-1 alpha-2 code.
 * @returns The calling code (without +).
 */
function getCallingCode(countryCode: string): string {
  return CALLING_CODES[Str.upper(countryCode)] ?? "1";
}

/**
 * Build the PhoneInputInfo from the current state.
 *
 * @param inputValue - The raw input string.
 * @param countryCode - The selected country code.
 * @returns PhoneInputInfo object.
 */
function buildInfo(inputValue: string, countryCode: string | null): PhoneInputInfo {
  const callingCode = countryCode ? getCallingCode(countryCode) : null;
  const digits = inputValue.replace(/\D/g, "");
  const e164 = callingCode ? `+${callingCode}${digits}` : `+${digits}`;

  return {
    countryCode,
    callingCode,
    nationalNumber: inputValue,
    e164,
    isValid: digits.length >= 7 && digits.length <= 15,
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * PhoneInput — International phone input with country selector.
 *
 * Provides a phone number input field with a country code prefix
 * button that opens a searchable list of countries in a `Popover`.
 *
 * @param props - Component props.
 * @returns The phone input element.
 *
 * @example
 * ```tsx
 * const [phone, setPhone] = useState('');
 *
 * <PhoneInput
 *   label="Phone Number"
 *   value={phone}
 *   onChange={(value, info) => setPhone(value)}
 *   defaultCountry="US"
 *   preferredCountries={['US', 'CA', 'GB']}
 * />
 * ```
 */
export const PhoneInput = React.memo(function PhoneInput({
  value = "",
  onChange,
  onBlur,
  defaultCountry = "US",
  onlyCountries,
  excludedCountries,
  preferredCountries,
  forceCallingCode = false,
  disableFormatting = false,
  disableDropdown = false,
  label,
  placeholder = "Enter phone number",
  errorMessage,
  description,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  name,
  className,
}: PhoneInputProps): React.ReactElement {
  const [selectedCountry, setSelectedCountry] = useState(Str.upper(defaultCountry));
  const inputRef = useRef<HTMLInputElement>(null);

  // Compose the country list from the DEFAULT_COUNTRIES table plus
  // the optional filter props. Result is memoised because sort +
  // filter over ~46 rows shouldn't run on every render — the
  // input's own re-render cadence would otherwise blow through it
  // multiple times per keystroke.
  const countryList = useMemo((): PhoneCountry[] => {
    let list = DEFAULT_COUNTRIES;

    if (onlyCountries && onlyCountries.length > 0) {
      const only = new Set(onlyCountries.map((c) => Str.upper(c)));

      list = list.filter((c) => only.has(c.code));
    }

    if (excludedCountries && excludedCountries.length > 0) {
      const excluded = new Set(excludedCountries.map((c) => Str.upper(c)));

      list = list.filter((c) => !excluded.has(c.code));
    }

    if (preferredCountries && preferredCountries.length > 0) {
      const preferred = preferredCountries.map((c) => Str.upper(c));
      const preferredSet = new Set(preferred);
      const top = list.filter((c) => preferredSet.has(c.code));
      const rest = list.filter((c) => !preferredSet.has(c.code));

      list = [...top, ...rest];
    }

    return list;
  }, [onlyCountries, excludedCountries, preferredCountries]);

  const callingCode = getCallingCode(selectedCountry);

  // Country change handler wired to the ListBox's selection event.
  // `ListBox.selectionMode="single"` hands us a `Set<Key>` with at
  // most one member — narrow it back to the string country code
  // the buildInfo helper expects.
  const handleCountryChange = useCallback(
    (keys: "all" | Set<Key>) => {
      if (keys === "all") return;
      const nextKey = keys.values().next().value;

      if (typeof nextKey !== "string") return;

      const newCountry = Str.upper(nextKey);

      setSelectedCountry(newCountry);

      const info = buildInfo(value, newCountry);

      onChange?.(value, info);

      // Return focus to the number input so the user can keep
      // typing — the picker was the momentary detour, not the
      // destination.
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [value, onChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value;

      if (!disableFormatting) {
        // Strip non-digit characters except spaces and dashes
        rawValue = rawValue.replace(/[^\d\s\-()]/g, "");
      }

      const info = buildInfo(rawValue, selectedCountry);

      onChange?.(rawValue, info);
    },
    [selectedCountry, onChange, disableFormatting],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const info = buildInfo(value, selectedCountry);

      onBlur?.(e, info);
    },
    [value, selectedCountry, onBlur],
  );

  return (
    <TextField
      className={className}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      name={name}
      {...(!label ? { "aria-label": "Phone number" } : {})}
      data-component="phone-input"
    >
      {label && <Label>{label}</Label>}
      <InputGroup>
        <InputGroup.Prefix className="p-0">
          {disableDropdown ? (
            // Read-only prefix — mirrors the picker visual without
            // the interactive affordance for consumers that lock
            // the country.
            <span className="text-foreground-600 flex items-center gap-1.5 px-3 text-sm">
              <img
                alt={selectedCountry}
                className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                src={`https://flagcdn.com/h20/${Str.lower(selectedCountry)}.png`}
              />
              <span>+{callingCode}</span>
            </span>
          ) : (
            <Popover>
              <Button
                aria-label={`Selected country: ${selectedCountry}, +${callingCode}`}
                className="h-full gap-1.5 rounded-none border-0 bg-transparent px-3 shadow-none"
                isDisabled={isDisabled}
                size="sm"
                variant="ghost"
              >
                <img
                  alt={selectedCountry}
                  className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                  src={`https://flagcdn.com/h20/${Str.lower(selectedCountry)}.png`}
                />
                <span className="text-foreground-600 text-xs">+{callingCode}</span>
                <svg
                  aria-hidden="true"
                  className="text-foreground-400 size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
              <Popover.Content className="w-64">
                <Popover.Dialog className="p-1">
                  {/*
                    ListBox owns the roving tabindex + typeahead for
                    the country choices. `selectionMode="single"`
                    binds `aria-selected` per option, and we mirror
                    the current country into `selectedKeys` so the
                    ItemIndicator draws a check next to it.
                  */}
                  <ListBox
                    aria-label="Country"
                    className="max-h-64 overflow-y-auto"
                    selectedKeys={new Set([selectedCountry])}
                    selectionMode="single"
                    onSelectionChange={handleCountryChange}
                  >
                    {countryList.map((c) => (
                      <ListBox.Item id={c.code} key={c.code} textValue={c.name}>
                        <img
                          alt=""
                          aria-hidden="true"
                          className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                          src={`https://flagcdn.com/h20/${Str.lower(c.code)}.png`}
                        />
                        <div className="flex min-w-0 flex-col">
                          <Label>{c.name}</Label>
                          <Description>+{c.callingCode}</Description>
                        </div>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          )}
        </InputGroup.Prefix>
        <InputGroup.Input
          ref={inputRef}
          placeholder={placeholder}
          type="tel"
          value={forceCallingCode ? value : value}
          onBlur={handleBlur}
          onChange={handleInputChange}
        />
      </InputGroup>
      {description && <Description>{description}</Description>}
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </TextField>
  );
});

PhoneInput.displayName = "PhoneInput";
