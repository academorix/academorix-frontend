/**
 * @file password-confirm-provider.tsx
 * @module providers/password-confirm-provider
 *
 * @description
 * A workspace-wide "password-confirm gate" — an imperative modal that
 * asks the caller to re-enter their password before a sensitive
 * action fires (change email, revoke session, delete an MFA
 * method, rotate recovery codes, etc.).
 *
 * ## Contract
 *
 * Consumers reach the gate via {@link usePasswordConfirm}:
 *
 * ```tsx
 * const confirmPassword = usePasswordConfirm();
 *
 * const handleRevoke = async () => {
 *   const ok = await confirmPassword({
 *     title: "Revoke this session?",
 *     description: "Enter your password to confirm.",
 *     confirmLabel: "Revoke",
 *     variant: "danger",
 *   });
 *   if (!ok) return;
 *
 *   await authApi.revokeSession(id);
 * };
 * ```
 *
 * ## Why imperative (not JSX-mounted per site)
 *
 * Every settings-page destructive verb needs the same modal chrome +
 * password verification + toast. Rendering the modal per-site inflates
 * component code and forks the visual language. A provider-hosted
 * modal with a single `awaitable` API keeps every call site to two
 * lines.
 *
 * ## Backend flow
 *
 * The modal calls `POST /api/auth/confirm-password`; on success the
 * backend caches the confirmation against the current Sanctum token
 * id. The follow-up destructive verb then passes through the
 * `password.confirm` middleware without a re-prompt for the next 15
 * minutes (server-configurable).
 *
 * The Promise resolves `true` on server acknowledgement, `false` on
 * cancel, and rejects only on a network failure (`.catch` surfaces
 * the ApiError).
 */

import { Button, FieldError, Form, Modal } from "@heroui/react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import type { FormEvent, ReactNode } from "react";

import { ApiError } from "@/lib/api/http-client";
import { PasswordField } from "@/modules/auth/components/password-field";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";

/** Configuration for a single confirm-password prompt. */
export interface ConfirmPasswordOptions {
  /** Modal title. Short, actionable — "Revoke this session?" */
  title: string;
  /** Long-form description. Explains what the caller is about to do. */
  description?: ReactNode;
  /** Label on the confirm button (defaults to "Confirm"). */
  confirmLabel?: string;
  /** Button variant — use `"danger"` for destructive actions. */
  variant?: "primary" | "danger";
  /** Iconify token rendered next to the title. */
  icon?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmPasswordOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Provider that owns the imperative confirm-password modal. Wrap the
 * authenticated shell (inside `<AppShell>`) so every protected route
 * can reach the gate.
 */
export function PasswordConfirmProvider({ children }: { children: ReactNode }): ReactNode {
  const [isOpen, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmPasswordOptions | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  // Deferred resolver — the `confirm()` call awaits this Promise;
  // the modal's confirm/cancel handlers resolve it. Kept in a ref so
  // consecutive prompts don't leak previous resolvers on re-render.
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const closeAndResolve = useCallback((result: boolean) => {
    setOpen(false);
    setPassword("");
    setError(null);
    setSubmitting(false);

    // Deferred resolution + null after the animation completes.
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const confirm = useCallback((nextOptions: ConfirmPasswordOptions): Promise<boolean> => {
    setOptions(nextOptions);
    setPassword("");
    setError(null);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!password.trim()) {
      setError("Password is required.");

      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await authApi.confirmPassword({ password });
      closeAndResolve(true);
    } catch (caught) {
      setSubmitting(false);
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We couldn't verify your password. Try again.",
      );
    }
  };

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <Modal>
        <Modal.Backdrop
          isDismissable={!isSubmitting}
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open) closeAndResolve(false);
          }}
        >
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <div className="flex items-center gap-2">
                  {options?.icon ? (
                    <Modal.Icon
                      className={
                        options.variant === "danger"
                          ? "bg-danger/10 text-danger"
                          : "bg-accent-soft text-accent-soft-foreground"
                      }
                    >
                      <Iconify className="size-4" icon={options.icon} />
                    </Modal.Icon>
                  ) : null}
                  <Modal.Heading>{options?.title ?? "Confirm your password"}</Modal.Heading>
                </div>
                {options?.description ? (
                  <p className="mt-1 text-sm text-muted">{options.description}</p>
                ) : null}
              </Modal.Header>

              <Modal.Body>
                <Form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                  <PasswordField
                    autoComplete="current-password"
                    autoFocus
                    isDisabled={isSubmitting}
                    isRequired
                    label="Password"
                    name="password"
                    onChange={setPassword}
                    placeholder="Enter your password to continue"
                    value={password}
                  />

                  {error ? <FieldError>{error}</FieldError> : null}

                  <div className="mt-2 flex items-center justify-end gap-2">
                    <Button
                      isDisabled={isSubmitting}
                      onPress={() => closeAndResolve(false)}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      isPending={isSubmitting}
                      type="submit"
                      variant={options?.variant === "danger" ? "danger" : "primary"}
                    >
                      {options?.confirmLabel ?? "Confirm"}
                    </Button>
                  </div>
                </Form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/**
 * Imperative "prompt for password" hook. Returns a function that
 * resolves `true` when the caller confirmed, `false` when they
 * cancelled or dismissed the modal.
 *
 * @example
 * ```tsx
 * const confirmPassword = usePasswordConfirm();
 *
 * const handleDelete = async () => {
 *   const ok = await confirmPassword({
 *     title: "Delete this method?",
 *     confirmLabel: "Delete",
 *     variant: "danger",
 *     icon: "trash-bin",
 *   });
 *   if (!ok) return;
 *   await deleteThing();
 * };
 * ```
 */
export function usePasswordConfirm(): (options: ConfirmPasswordOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);

  if (!ctx) {
    throw new Error("usePasswordConfirm must be used inside <PasswordConfirmProvider>.");
  }

  return ctx.confirm;
}
