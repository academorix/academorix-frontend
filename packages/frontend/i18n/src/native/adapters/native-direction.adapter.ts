/**
 * @file native-direction.adapter.ts
 * @module @stackra/i18n/native/adapters
 * @description Native direction adapter — applies RTL/LTR via React Native's I18nManager.
 *
 *   ## Important: Restart Requirement
 *
 *   `I18nManager.forceRTL()` requires an app restart to fully take effect on
 *   some platforms (Android). This adapter returns `true` from `apply()` when
 *   the direction changes — the app should show a "restart required" dialog
 *   or call `Updates.reloadAsync()` (Expo).
 *
 *   ## How It Works
 *
 *   ```
 *   apply('rtl', 'ar')
 *     → I18nManager.allowRTL(true)
 *     → I18nManager.forceRTL(true)
 *     → returns true (restart needed)
 *
 *   apply('ltr', 'en')  [when already LTR]
 *     → no change needed
 *     → returns false
 *   ```
 */

import { Injectable } from "@stackra/container";
import { I18nManager } from "react-native";
import type { IDirectionAdapter } from "@stackra/contracts";

/**
 * React Native platform direction adapter.
 *
 * Uses `I18nManager` from `react-native` to force RTL/LTR layout direction.
 * Registered automatically by `NativeI18nModule` via the `I18N_DIRECTION_ADAPTER` token.
 */
@Injectable()
export class NativeDirectionAdapter implements IDirectionAdapter {
  /**
   * Apply direction via I18nManager.
   *
   * @param direction - Target direction ('ltr' or 'rtl')
   * @param _locale - The locale code (unused on native — direction is binary)
   * @returns `true` if the direction changed and a restart is needed
   */
  public apply(direction: "ltr" | "rtl", _locale: string): boolean {
    const shouldBeRtl = direction === "rtl";
    const currentlyRtl = I18nManager.isRTL;

    if (shouldBeRtl !== currentlyRtl) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(shouldBeRtl);
      return true; // Restart needed
    }

    return false; // No change
  }

  /**
   * Get the current direction from I18nManager.
   *
   * @returns The current RTL state from React Native
   */
  public getCurrentDirection(): "ltr" | "rtl" {
    return I18nManager.isRTL ? "rtl" : "ltr";
  }
}
