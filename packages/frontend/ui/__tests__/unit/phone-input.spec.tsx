// @vitest-environment jsdom
/**
 * @file phone-input.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<PhoneInput>` — the international
 *   phone-number field. Covers label + placeholder rendering, the
 *   calling-code prefix per `defaultCountry`, controlled `value` +
 *   `onChange` contract (E.164 + info payload), formatting off-switch,
 *   dropdown-disabled mode, invalid / disabled / read-only flags,
 *   and error/description slots.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PhoneInput } from "@/react/components/phone-input/phone-input.component";

afterEach(cleanup);

describe("<PhoneInput>", () => {
  it("renders the label", () => {
    render(<PhoneInput label="Phone Number" />);
    expect(screen.getByText("Phone Number")).toBeDefined();
  });

  it("renders the placeholder on the tel input", () => {
    const { container } = render(<PhoneInput placeholder="Type here" />);
    const input = container.querySelector('input[type="tel"]') as HTMLInputElement;
    expect(input.placeholder).toBe("Type here");
  });

  it("shows the calling code for the default country (US -> +1)", () => {
    render(<PhoneInput />);
    // Match the "+1" chip — assert via the surrounding country button's aria-label.
    expect(
      screen.getByRole("button", {
        name: /Selected country: US, \+1/,
      }),
    ).toBeDefined();
  });

  it("honours a custom defaultCountry (FR -> +33)", () => {
    render(<PhoneInput defaultCountry="FR" />);
    expect(
      screen.getByRole("button", {
        name: /Selected country: FR, \+33/,
      }),
    ).toBeDefined();
  });

  it("renders a static country label (no button) when disableDropdown=true", () => {
    render(<PhoneInput disableDropdown />);
    // The dropdown Button is skipped; the fallback span carries the flag + code.
    expect(screen.queryByRole("button", { name: /Selected country/ })).toBeNull();
    // The prefix span shows "+1" for the default US country.
    expect(screen.getByText("+1")).toBeDefined();
  });

  it("fires onChange with (value, info) on user input", () => {
    const onChange = vi.fn();
    const { container } = render(<PhoneInput value="" onChange={onChange} />);
    const input = container.querySelector('input[type="tel"]') as HTMLInputElement;

    fireEvent.change(input, { target: { value: "4155552671" } });

    expect(onChange).toHaveBeenCalledOnce();
    const [value, info] = onChange.mock.calls[0] ?? [];
    expect(value).toBe("4155552671");
    // Default country US -> calling code '1', so E.164 uses '+14155552671'.
    expect(info).toMatchObject({
      countryCode: "US",
      callingCode: "1",
      e164: "+14155552671",
      isValid: true,
    });
  });

  it("marks isValid=false when the digit run is shorter than 7", () => {
    const onChange = vi.fn();
    const { container } = render(<PhoneInput value="" onChange={onChange} />);
    const input = container.querySelector('input[type="tel"]') as HTMLInputElement;

    fireEvent.change(input, { target: { value: "415" } });

    const info = onChange.mock.calls.at(-1)?.[1];
    expect(info.isValid).toBe(false);
  });

  it("strips non-digit chars from user input when formatting is on", () => {
    const onChange = vi.fn();
    const { container } = render(<PhoneInput value="" onChange={onChange} />);
    const input = container.querySelector('input[type="tel"]') as HTMLInputElement;

    // Letters are stripped; spaces / dashes / parens are allowed.
    fireEvent.change(input, { target: { value: "a(415) 555-2671b" } });

    const [value] = onChange.mock.calls[0] ?? [];
    // "a" + "b" are stripped; parens + spaces + dashes survive.
    expect(value).toBe("(415) 555-2671");
  });

  it("preserves the raw value when disableFormatting is true", () => {
    const onChange = vi.fn();
    const { container } = render(<PhoneInput disableFormatting value="" onChange={onChange} />);
    const input = container.querySelector('input[type="tel"]') as HTMLInputElement;

    fireEvent.change(input, { target: { value: "abc123" } });

    const [value] = onChange.mock.calls[0] ?? [];
    expect(value).toBe("abc123");
  });

  it("fires onBlur with (event, info)", () => {
    const onBlur = vi.fn();
    const { container } = render(<PhoneInput value="4155552671" onBlur={onBlur} />);
    const input = container.querySelector('input[type="tel"]') as HTMLInputElement;

    fireEvent.blur(input);

    expect(onBlur).toHaveBeenCalledOnce();
    const info = onBlur.mock.calls[0]?.[1];
    expect(info).toMatchObject({ countryCode: "US", e164: "+14155552671" });
  });

  it("renders the error message when errorMessage is set", () => {
    render(<PhoneInput errorMessage="Required" isInvalid label="Phone" />);
    expect(screen.getByText("Required")).toBeDefined();
  });

  it("renders the description below the input", () => {
    render(<PhoneInput description="We only send SMS." label="Phone" />);
    expect(screen.getByText("We only send SMS.")).toBeDefined();
  });

  it('stamps data-component="phone-input" on the field root', () => {
    const { container } = render(<PhoneInput />);
    expect(container.querySelector('[data-component="phone-input"]')).not.toBeNull();
  });

  it("disables the tel input when isDisabled", () => {
    const { container } = render(<PhoneInput isDisabled />);
    const input = container.querySelector('input[type="tel"]') as HTMLInputElement;
    expect(input.disabled || input.getAttribute("aria-disabled") === "true").toBe(true);
  });
});
