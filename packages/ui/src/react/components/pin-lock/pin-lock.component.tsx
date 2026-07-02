/**
 * @file pin-lock.component.tsx
 * @module @stackra/ui/react/components/pin-lock
 * @description Numeric PIN entry keypad with dot indicators.
 *   Renders a mobile-style PIN input with configurable length,
 *   scramble mode, biometric slot, and error shake animation.
 */

"use client";

import { Button } from "@heroui/react";
import React, { useState, useCallback, useEffect, useMemo } from "react";

import type { PinLockProps } from "./pin-lock.interface";

/**
 * Shuffle an array using Fisher-Yates algorithm.
 *
 * @param array - The array to shuffle.
 * @returns A new shuffled array.
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;

    result[i] = result[j]!;
    result[j] = temp;
  }

  return result;
}

/**
 * PinLock — Numeric keypad with dot indicators for PIN entry.
 *
 * Auto-submits when all digits are entered. Supports error state
 * with shake animation, scramble mode for security, and a biometric
 * button slot for Face ID / Touch ID.
 *
 * @param props - Component props.
 * @returns The PIN lock element.
 *
 * @example
 * ```tsx
 * const [error, setError] = useState(false);
 *
 * <PinLock
 *   length={4}
 *   onComplete={async (pin) => {
 *     const valid = await verifyPin(pin);
 *     if (!valid) setError(true);
 *   }}
 *   isError={error}
 *   title="Enter PIN"
 *   subtitle="Enter your 4-digit PIN to unlock"
 * />
 * ```
 */
export const PinLock = React.memo(function PinLock({
  length = 4,
  onComplete,
  isError = false,
  isDisabled = false,
  isLoading = false,
  scramble = false,
  biometricButton,
  onBiometricPress,
  className,
  title,
  subtitle,
}: PinLockProps): React.ReactElement {
  const [pin, setPin] = useState("");
  const [shaking, setShaking] = useState(false);

  const keypadNumbers = useMemo(
    () => (scramble ? shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]),
    [scramble],
  );

  // Handle error state — shake and clear
  useEffect(() => {
    if (isError) {
      setShaking(true);
      const timer = setTimeout(() => {
        setShaking(false);
        setPin("");
      }, 500);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isError]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
    }
  }, [pin, length, onComplete]);

  const handleDigitPress = useCallback(
    (digit: number) => {
      if (isDisabled || isLoading || pin.length >= length) return;
      setPin((prev) => prev + String(digit));
    },
    [isDisabled, isLoading, pin.length, length],
  );

  const handleBackspace = useCallback(() => {
    if (isDisabled || isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  }, [isDisabled, isLoading]);

  const topRows = keypadNumbers.slice(0, 9);
  const zeroDigit = keypadNumbers[9] ?? 0;

  return (
    <div
      className={`flex flex-col items-center gap-8 ${className ?? ""}`.trim()}
      data-component="pin-lock"
    >
      {/* Title */}
      {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
      {subtitle && <p className="text-foreground-500 text-sm">{subtitle}</p>}

      {/* Dot indicators */}
      <div
        aria-label={`${pin.length} of ${length} digits entered`}
        className={`flex gap-3 ${shaking ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
        role="status"
      >
        {Array.from({ length }, (_, i) => (
          <div
            key={i}
            className={`size-3.5 rounded-full transition-all duration-200 ${
              i < pin.length
                ? isError
                  ? "scale-110 bg-danger"
                  : "bg-primary scale-110"
                : "bg-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {topRows.map((digit) => (
          <Button
            key={digit}
            isIconOnly
            aria-label={String(digit)}
            className="size-16 text-xl font-medium"
            isDisabled={isDisabled || isLoading}
            variant="ghost"
            onPress={() => handleDigitPress(digit)}
          >
            {digit}
          </Button>
        ))}

        {/* Bottom row: biometric / 0 / backspace */}
        <div className="flex items-center justify-center">
          {biometricButton && onBiometricPress ? (
            <Button
              isIconOnly
              aria-label="Biometric authentication"
              className="size-16"
              isDisabled={isDisabled || isLoading}
              variant="ghost"
              onPress={onBiometricPress}
            >
              {biometricButton}
            </Button>
          ) : (
            <div className="size-16" />
          )}
        </div>

        <Button
          isIconOnly
          aria-label="0"
          className="size-16 text-xl font-medium"
          isDisabled={isDisabled || isLoading}
          variant="ghost"
          onPress={() => handleDigitPress(zeroDigit)}
        >
          {zeroDigit}
        </Button>

        <div className="flex items-center justify-center">
          <Button
            isIconOnly
            aria-label="Delete last digit"
            className="size-16"
            isDisabled={isDisabled || isLoading || pin.length === 0}
            variant="ghost"
            onPress={handleBackspace}
          >
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
});

PinLock.displayName = "PinLock";
