/**
 * @file password-confirm-dialog.tsx
 * @module components/password-confirm-dialog
 *
 * @description
 * Mount component for the app-wide password-confirm modal. Subscribes to
 * {@link PasswordConfirmService} via `useSyncExternalStore` and renders
 * the HeroUI `<Modal>` shell whenever a prompt is open. Renders `null`
 * otherwise.
 *
 * ## Mount contract
 *
 * Mount ONCE at the authenticated shell root (in `app-root.tsx`, at the
 * same position the legacy `<PasswordConfirmProvider>` used to sit).
 * The modal floats above every route so a confirm-password from any
 * page can pop it without the caller needing to render the modal per
 * site.
 *
 * ## Backend flow
 *
 * On submit, the dialog calls `POST /api/auth/confirm-password`; on
 * success it resolves the service's active promise with `true`. Server
 * caches the confirmation against the current Sanctum token id so the
 * follow-up destructive verb passes through the `password.confirm`
 * middleware without a re-prompt for the next 15 minutes.
 */

import { Button, FieldError, Form, Modal } from "@heroui/react";
import { useState, useSyncExternalStore } from "react";
import type { FormEvent, ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { ApiError } from "@/lib/api/http-client";
import { authApi } from "@/lib/api/auth-api";
import { PasswordField } from "@/modules/auth/components/password-field";
import { PasswordConfirmService } from "@/services/password-confirm";
import { PASSWORD_CONFIRM_SERVICE } from "@/tokens/password-confirm-service.token";
import { useInject } from "@stackra/container/react";

/**
 * The mount component. Reads the service's reactive snapshot; renders
 * the modal shell + submission form only when a prompt is open.
 */
export function PasswordConfirmDialog(): ReactNode {
  const service = useInject<PasswordConfirmService>(PASSWORD_CONFIRM_SERVICE);
  // `useSyncExternalStore` — commit-phase subscription; the modal re-
  // renders exactly when the service snapshot changes.
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);

  // Local submission state — password draft + inline error + spinner.
  // Reset on every open by keying off `isOpen` in the dependency of the
  // reset effect below.
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  // Reset local state whenever a fresh prompt opens. Kept out of the
  // submit path so a failed submit preserves the typed password (users
  // shouldn't have to retype after a network error).
  const resetLocal = (): void => {
    setPassword("");
    setError(null);
    setSubmitting(false);
  };

  const handleCancel = (): void => {
    resetLocal();
    // Delegate — the service resolves the pending promise with `false`
    // and drops its snapshot back to closed. The next render clears the
    // modal from the DOM.
    service.cancel();
  };

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
      resetLocal();
      // Success — hand back to the service so the awaiting caller
      // (settings page) resumes.
      service.resolve();
    } catch (caught) {
      setSubmitting(false);
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We couldn't verify your password. Try again.",
      );
    }
  };

  const options = snapshot.options;

  // WHY the always-mounted `<Modal>`: the HeroUI `<Modal.Backdrop>`
  // owns its own open state and animates on close. Rendering the shell
  // unconditionally lets the exit animation run when `isOpen` flips
  // from true → false. `options` is a nullable read — we guard the
  // header/body so the tree only reads the fields on the open frame.
  return (
    <Modal>
      <Modal.Backdrop
        isDismissable={!isSubmitting}
        isOpen={snapshot.isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel();
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
                    onPress={handleCancel}
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
  );
}
