/**
 * @file phone-input.interface.ts
 * @module @stackra/ui/react/components/phone-input
 * @description Props interfaces for the PhoneInput component.
 */

import type { FocusEvent } from "react";

// ============================================================================
// Types
// ============================================================================

/** Country picker display mode. */
export type PhonePickerMode = "drawer" | "popover" | "select";

/** Information about the current phone number state. */
export interface PhoneInputInfo {
  /** ISO country code (e.g., 'US', 'GB'). */
  countryCode: string | null;

  /** International calling code (e.g., '1', '44'). */
  callingCode: string | null;

  /** Formatted national number (e.g., '(415) 555-2671'). */
  nationalNumber: string;

  /** Full E.164 number (e.g., '+14155552671'). */
  e164: string;

  /** Whether the number is valid per libphonenumber. */
  isValid: boolean;
}

/** Country item for the picker list. */
export interface PhoneCountry {
  /** ISO 3166-1 alpha-2 code (e.g., 'US'). */
  code: string;

  /** International calling code (e.g., '1'). */
  callingCode: string;

  /** Localized country name. */
  name: string;
}

// ============================================================================
// Component Props
// ============================================================================

/** Props for the PhoneInput component. */
export interface PhoneInputProps {
  /** Current phone value in E.164 format or partial input. Controlled. */
  value?: string;

  /** Callback when the phone value changes. */
  onChange?: (value: string, info: PhoneInputInfo) => void;

  /** Callback on input blur. */
  onBlur?: (event: FocusEvent<HTMLInputElement>, info: PhoneInputInfo) => void;

  /** Default country code (ISO 3166-1 alpha-2). */
  defaultCountry?: string;

  /** Restrict to specific countries only. */
  onlyCountries?: string[];

  /** Exclude specific countries. */
  excludedCountries?: string[];

  /** Countries shown at the top of the picker. */
  preferredCountries?: string[];

  /** Force display of the calling code prefix (e.g., +1). */
  forceCallingCode?: boolean;

  /** Disable real-time formatting of the phone number. */
  disableFormatting?: boolean;

  /** Disable the country picker (lock to defaultCountry). */
  disableDropdown?: boolean;

  /** Country picker mode: 'drawer', 'popover', or 'select'. */
  pickerMode?: PhonePickerMode;

  /** Field label. */
  label?: string;

  /** Input placeholder. */
  placeholder?: string;

  /** Error message displayed below the input. */
  errorMessage?: string;

  /** Description text below the input. */
  description?: string;

  /** Whether the field is required. */
  isRequired?: boolean;

  /** Whether the field is in an invalid state. */
  isInvalid?: boolean;

  /** Whether the field is disabled. */
  isDisabled?: boolean;

  /** Whether the field is read-only. */
  isReadOnly?: boolean;

  /** HTML name attribute. */
  name?: string;

  /** Additional CSS classes. */
  className?: string;
}
