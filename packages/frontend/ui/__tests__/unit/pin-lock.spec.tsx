// @vitest-environment jsdom
/**
 * @file pin-lock.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<PinLock>` — the numeric PIN keypad
 *   with dot indicators. Covers keypad rendering, digit entry appending
 *   into the PIN buffer, auto-submit via `onComplete` when the buffer
 *   fills, backspace, error state clearing after the shake animation,
 *   optional biometric slot, and title/subtitle rendering.
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PinLock } from "@/react/components/pin-lock/pin-lock.component";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("<PinLock>", () => {
  it("renders all 10 digit buttons plus a backspace", () => {
    render(<PinLock onComplete={vi.fn()} />);
    for (const digit of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(screen.getByRole("button", { name: String(digit) })).toBeDefined();
    }
    expect(screen.getByRole("button", { name: "Delete last digit" })).toBeDefined();
  });

  it('stamps data-component="pin-lock" on the root', () => {
    const { container } = render(<PinLock onComplete={vi.fn()} />);
    expect(container.querySelector('[data-component="pin-lock"]')).not.toBeNull();
  });

  it("renders title + subtitle when provided", () => {
    render(<PinLock onComplete={vi.fn()} subtitle="Enter to unlock" title="Enter PIN" />);
    expect(screen.getByText("Enter PIN")).toBeDefined();
    expect(screen.getByText("Enter to unlock")).toBeDefined();
  });

  it("auto-fires onComplete once the PIN reaches `length`", () => {
    const onComplete = vi.fn();
    render(<PinLock length={4} onComplete={onComplete} />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "1" }));
      fireEvent.click(screen.getByRole("button", { name: "2" }));
      fireEvent.click(screen.getByRole("button", { name: "3" }));
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "4" }));
    });
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("does not accept more digits after the PIN is full", () => {
    const onComplete = vi.fn();
    render(<PinLock length={4} onComplete={onComplete} />);

    // Each click is its own act so `handleDigitPress`'s
    // `pin.length >= length` guard sees the latest state before the
    // next press — matching a real user tapping the keypad.
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "1" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "2" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "3" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "4" }));
    });
    // The 5th press is ignored — the buffer is already at `length`.
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "5" }));
    });

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("backspace removes the last entered digit", () => {
    const onComplete = vi.fn();
    render(<PinLock length={4} onComplete={onComplete} />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "1" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "2" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Delete last digit" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "3" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "4" }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "5" }));
    });

    expect(onComplete).toHaveBeenCalledWith("1345");
  });

  it("reports current progress via the dot indicator label", () => {
    render(<PinLock length={4} onComplete={vi.fn()} />);
    // Zero digits at first.
    expect(screen.getByLabelText("0 of 4 digits entered")).toBeDefined();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "9" }));
    });
    expect(screen.getByLabelText("1 of 4 digits entered")).toBeDefined();
  });

  it("disables every digit button when isDisabled=true", () => {
    render(<PinLock isDisabled onComplete={vi.fn()} />);
    for (const digit of ["0", "1", "2", "9"]) {
      const btn = screen.getByRole("button", { name: digit }) as HTMLButtonElement;
      expect(btn.disabled || btn.getAttribute("aria-disabled") === "true").toBe(true);
    }
  });

  it("ignores presses while isLoading is true", () => {
    const onComplete = vi.fn();
    render(<PinLock isLoading length={4} onComplete={onComplete} />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "1" }));
      fireEvent.click(screen.getByRole("button", { name: "2" }));
      fireEvent.click(screen.getByRole("button", { name: "3" }));
      fireEvent.click(screen.getByRole("button", { name: "4" }));
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("clears the PIN buffer after the isError shake settles", () => {
    // Force error before any digits are entered — the effect still runs its
    // 500 ms shake window, then clears the buffer.
    const { rerender } = render(<PinLock length={4} onComplete={vi.fn()} />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "1" }));
      fireEvent.click(screen.getByRole("button", { name: "2" }));
    });
    expect(screen.getByLabelText("2 of 4 digits entered")).toBeDefined();

    rerender(<PinLock isError length={4} onComplete={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByLabelText("0 of 4 digits entered")).toBeDefined();
  });

  it("renders the biometric slot and fires onBiometricPress on click", () => {
    const onBiometricPress = vi.fn();
    render(
      <PinLock
        biometricButton={<span data-testid="face-icon">FaceID</span>}
        length={4}
        onBiometricPress={onBiometricPress}
        onComplete={vi.fn()}
      />,
    );
    // The biometric button carries an aria-label of "Biometric authentication".
    fireEvent.click(screen.getByRole("button", { name: "Biometric authentication" }));
    expect(onBiometricPress).toHaveBeenCalledOnce();
  });

  it("omits the biometric slot when either prop is missing", () => {
    render(<PinLock length={4} onComplete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Biometric authentication" })).toBeNull();
  });

  it("renders a keypad with unique aria-labels when scramble is enabled", () => {
    // Regression guard for the fixed a11y bug: the bottom-row zero
    // slot previously hardcoded `aria-label="0"` regardless of the
    // shuffled digit, producing duplicate accessible names. The fix
    // uses `aria-label={String(zeroDigit)}` so every digit-cell has
    // a unique announcement matching its rendered value.
    const { container } = render(<PinLock length={4} onComplete={vi.fn()} scramble />);

    const digitButtons = Array.from(container.querySelectorAll(".grid button")).filter(
      (btn) => (btn.getAttribute("aria-label") ?? "") !== "Delete last digit",
    );

    // 10 digit buttons total (0..9), no duplicates.
    expect(digitButtons.length).toBe(10);
    const labels = digitButtons.map((b) => b.getAttribute("aria-label"));
    expect(new Set(labels).size).toBe(10);
    expect(labels.sort()).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("bottom zero-slot`s aria-label matches the shuffled digit rendered inside it", () => {
    // With scramble off, `zeroDigit` is always 0 and the bottom slot
    // rounds out the keypad — the label + text content agree.
    const { container } = render(<PinLock length={4} onComplete={vi.fn()} />);
    const bottomButton = Array.from(container.querySelectorAll(".grid button")).find(
      (btn) => (btn.textContent ?? "").trim() === "0",
    ) as HTMLButtonElement | undefined;

    expect(bottomButton).toBeDefined();
    expect(bottomButton?.getAttribute("aria-label")).toBe("0");
  });
});
