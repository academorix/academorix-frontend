/**
 * @file use-password-confirm.hook.ts
 * @module @academorix/dashboard/hooks/use-password-confirm
 * @description React binding for {@link PasswordConfirmService}.
 *
 *   Returns an imperative `confirm(options): Promise<boolean>` — the same
 *   signature the legacy `<PasswordConfirmProvider>` context used to
 *   expose. Every existing call site (`mfa-methods-panel`,
 *   `recovery-codes-panel`, `sessions-panel`) migrates by swapping the
 *   import path from `@/providers/password-confirm-provider` to
 *   `@/hooks/use-password-confirm`.
 */

import { useInject } from "@stackra/container/react";

import type { IConfirmPasswordOptions } from "@/services/password-confirm";
import { PasswordConfirmService } from "@/services/password-confirm";
import { PASSWORD_CONFIRM_SERVICE } from "@/tokens/password-confirm-service.token";

/**
 * Imperative "prompt for password" hook. Returns a function that
 * resolves `true` on verified, `false` on cancel/dismiss.
 *
 * Behaviour: the returned function is a bound service method — stable
 * across renders, safe to include in a `useCallback` dep array or a
 * `useEffect` cleanup.
 *
 * @example
 * ```tsx
 * const confirmPassword = usePasswordConfirm();
 *
 * const handleDelete = async (): Promise<void> => {
 *   const ok = await confirmPassword({
 *     title: "Delete this method?",
 *     confirmLabel: "Delete",
 *     variant: "danger",
 *     icon: "trash-bin",
 *   });
 *   if (!ok) return;
 *   await deleteMethod();
 * };
 * ```
 */
export function usePasswordConfirm(): (options: IConfirmPasswordOptions) => Promise<boolean> {
  const service = useInject<PasswordConfirmService>(PASSWORD_CONFIRM_SERVICE);

  return service.confirm;
}
