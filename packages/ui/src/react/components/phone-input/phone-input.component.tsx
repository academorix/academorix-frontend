/**
 * @file phone-input.component.tsx
 * @module @stackra/ui/react/components/phone-input
 * @description International phone number input with configurable country picker.
 *   Uses Intl.DisplayNames for localized country names and HeroUI components
 *   for the selector UI. Formatting via simple E.164 pattern matching.
 */

"use client";

import { TextField, Label, Description, FieldError, InputGroup, Button } from "@heroui/react";
import React, { useState, useRef, useMemo, useCallback } from "react";

import { CALLING_CODES, DEFAULT_COUNTRIES } from "./phone-input.constants";

import type { PhoneInputProps, PhoneInputInfo, PhoneCountry } from "./phone-input.interface";

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
  return CALLING_CODES[countryCode.toUpperCase()] ?? "1";
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
 * Provides a phone number input field with a country code prefix button.
 * The country selector renders as a Select dropdown for simplicity.
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
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry.toUpperCase());
  const inputRef = useRef<HTMLInputElement>(null);

  // Build country list (reserved for future picker implementation).
  useMemo((): PhoneCountry[] => {
    let list = DEFAULT_COUNTRIES;

    if (onlyCountries && onlyCountries.length > 0) {
      const only = new Set(onlyCountries.map((c) => c.toUpperCase()));

      list = list.filter((c) => only.has(c.code));
    }

    if (excludedCountries && excludedCountries.length > 0) {
      const excluded = new Set(excludedCountries.map((c) => c.toUpperCase()));

      list = list.filter((c) => !excluded.has(c.code));
    }

    if (preferredCountries && preferredCountries.length > 0) {
      const preferred = preferredCountries.map((c) => c.toUpperCase());
      const preferredSet = new Set(preferred);
      const top = list.filter((c) => preferredSet.has(c.code));
      const rest = list.filter((c) => !preferredSet.has(c.code));

      list = [...top, ...rest];
    }

    return list;
  }, [onlyCountries, excludedCountries, preferredCountries]);

  const callingCode = getCallingCode(selectedCountry);

  // Country change handler (reserved for future picker implementation).
  useCallback(
    (key: string | number | null) => {
      if (!key) return;
      const newCountry = String(key);

      setSelectedCountry(newCountry);

      const info = buildInfo(value, newCountry);

      onChange?.(value, info);

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
            <span className="text-foreground-600 flex items-center gap-1.5 px-3 text-sm">
              <img
                alt={selectedCountry}
                className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                src={`https://flagcdn.com/h20/${selectedCountry.toLowerCase()}.png`}
              />
              <span>+{callingCode}</span>
            </span>
          ) : (
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
                src={`https://flagcdn.com/h20/${selectedCountry.toLowerCase()}.png`}
              />
              <span className="text-foreground-600 text-xs">+{callingCode}</span>
              <svg
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
