/**
 * @file pin-lock.interface.ts
 * @module @stackra/ui/react/components/pin-lock
 * @description Props interfaces for the PinLock component.
 */

import type { ReactNode } from "react";

// ============================================================================
// Component Props
// ============================================================================

/** Props for the PinLock component. */
export interface PinLockProps {
  /** Number of digits in the PIN (4-8). */
  length?: number;

  /** Callback when all digits have been entered. */
  onComplete: (pin: string) => void;

  /** Whether the last PIN attempt was incorrect (triggers shake + clear). */
  isError?: boolean;

  /** Whether the keypad is disabled (during verification). */
  isDisabled?: boolean;

  /** Whether to show a loading indicator (during async verification). */
  isLoading?: boolean;

  /** Whether to scramble the keypad digits (security feature). */
  scramble?: boolean;

  /** Optional biometric authentication button (Face ID / Touch ID icon). */
  biometricButton?: ReactNode;

  /** Callback when the biometric button is pressed. */
  onBiometricPress?: () => void;

  /** Title above the PIN indicators. */
  title?: string;

  /** Subtitle below the title. */
  subtitle?: string;

  /** Additional CSS classes. */
  className?: string;
}
