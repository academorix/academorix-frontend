/**
 * @file password-field.tsx
 * @module modules/auth/components/password-field
 *
 * @description
 * Reusable password input with a show/hide toggle. Encapsulates the
 * type-toggle state so every auth page (sign-in, sign-up, reset,
 * change-password) picks up the same UX without repeating the
 * boilerplate.
 *
 * Uses `Input.EndContent` (HeroUI slot on the Input) so the toggle
 * lives inside the field's border and matches the visual rhythm
 * of any other trailing input adornment (e.g. currency, unit).
 */

import { Button, Description, FieldError, InputGroup, Label, TextField } from "@heroui/react";
import { useState } from "react";

import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

/** Props for {@link PasswordField}. */
export interface PasswordFieldProps {
  /** Form input name — surfaced in the submitted `FormData`. */
  name: string;
  /** Visible label above the field. */
  label: string;
  /** Placeholder shown inside the input. */
  placeholder?: string;
  /** Whether the field must be filled. Wired to native form validation. */
  isRequired?: boolean;
  /** Whether to seed autoFocus on mount — typically only on the first field. */
  autoFocus?: boolean;
  /** Native `autoComplete` hint — pass `new-password` for signup, `current-password` for login. */
  autoComplete?: string;
  /** Minimum-length validation. Applies natively via the underlying input. */
  minLength?: number;
  /** Whether the field is disabled while a submit is in flight. */
  isDisabled?: boolean;
  /**
   * Field-level error message (server-side or client-side). When
   * present, flips the field into the invalid state and renders the
   * message under the input.
   */
  errorMessage?: string;
  /** Optional description shown under the field (helper copy). */
  description?: ReactNode;
  /** Controlled value. Optional — falls back to uncontrolled behaviour when omitted. */
  value?: string;
  /** Controlled change handler. */
  onChange?: (value: string) => void;
}

/**
 * A password `<TextField>` with a right-hand eye toggle that flips
 * between `type="password"` and `type="text"` so the user can verify
 * what they typed without giving up on the field's masking by default.
 *
 * Kept as a wrapper (not a fork of `<TextField>`) so future HeroUI
 * updates to base styling / focus rings / density propagate here
 * without a manual sync.
 */
export function PasswordField({
  name,
  label,
  placeholder,
  isRequired,
  autoFocus,
  autoComplete = "current-password",
  minLength,
  isDisabled,
  errorMessage,
  description,
  value,
  onChange,
}: PasswordFieldProps): ReactNode {
  const [isRevealed, setRevealed] = useState(false);
  const hasError = Boolean(errorMessage);

  return (
    <TextField
      isDisabled={isDisabled}
      isInvalid={hasError}
      isRequired={isRequired}
      name={name}
      onChange={onChange}
      type={isRevealed ? "text" : "password"}
      value={value}
    >
      <Label>{label}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          minLength={minLength}
          placeholder={placeholder}
        />
        <InputGroup.Suffix className="pr-1">
          <Button
            aria-label={isRevealed ? "Hide password" : "Show password"}
            aria-pressed={isRevealed}
            isIconOnly
            onPress={() => setRevealed((prev) => !prev)}
            size="sm"
            variant="ghost"
          >
            <Iconify className="size-4" icon={isRevealed ? "eye-slash" : "eye"} />
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {hasError ? (
        <FieldError>{errorMessage}</FieldError>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
    </TextField>
  );
}
