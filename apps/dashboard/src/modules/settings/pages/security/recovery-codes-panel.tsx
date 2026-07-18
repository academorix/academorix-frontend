/**
 * @file recovery-codes-panel.tsx
 * @module modules/settings/pages/security/recovery-codes-panel
 *
 * @description
 * Recovery-codes management panel inside the Security settings page.
 * Recovery codes are the last-resort fallback when the caller loses
 * every enrolled MFA device — a rotating set of single-use codes
 * the backend accepts through the same 2FA challenge endpoint.
 *
 * ## Interactions
 *
 *   - **View** — the codes are only visible on demand. Clicking
 *     "Show codes" fetches them via `GET /api/auth/two-factor/recovery-codes`
 *     and reveals the grid. Copies + downloads work without a
 *     re-fetch once the codes are in memory.
 *   - **Rotate** — `POST /api/auth/two-factor/recovery-codes` mints
 *     a fresh set + invalidates the previous batch. Requires the
 *     password-confirm gate.
 *   - **Copy** — copies every code to the clipboard as a
 *     newline-separated block.
 *   - **Download** — offers the same block as `academorix-recovery-codes.txt`.
 *
 * Every state carries the "these codes are one-time use" warning
 * so the operator can't miss the semantics.
 */

import { Button, toast } from "@heroui/react";
import { useCallback, useState } from "react";

import type { ReactNode } from "react";

import { ApiError } from "@/lib/api/http-client";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";
import { usePasswordConfirm } from "@/hooks/use-password-confirm";

export function RecoveryCodesPanel(): ReactNode {
  const [codes, setCodes] = useState<readonly string[] | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isRotating, setRotating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const confirmPassword = usePasswordConfirm();

  const handleShow = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.getRecoveryCodes();

      setCodes(response.codes);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "We couldn't load your recovery codes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRotate = useCallback(async (): Promise<void> => {
    const ok = await confirmPassword({
      title: "Rotate your recovery codes?",
      description:
        "Every previous code stops working immediately. Save the new codes somewhere safe before you leave this page.",
      confirmLabel: "Generate new codes",
      variant: "danger",
      icon: "arrows-rotate-left",
    });

    if (!ok) return;

    setRotating(true);
    setError(null);

    try {
      const response = await authApi.rotateRecoveryCodes();

      setCodes(response.codes);
      toast.success("New recovery codes generated", {
        description: "The previous codes no longer work. Save the new codes now.",
      });
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "We couldn't rotate your recovery codes.",
      );
    } finally {
      setRotating(false);
    }
  }, [confirmPassword]);

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!codes) return;

    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast.success("Copied to clipboard");
    } catch {
      toast.danger("Couldn't copy — try selecting the codes manually.");
    }
  }, [codes]);

  const handleDownload = useCallback((): void => {
    if (!codes) return;

    const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "academorix-recovery-codes.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [codes]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Recovery codes</h3>
        <p className="text-sm text-muted">
          Single-use codes that let you sign in if you lose every enrolled two-factor device. Keep
          them somewhere safe — a password manager is ideal.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <Iconify
          className="mt-0.5 size-5 shrink-0 text-warning-foreground"
          icon="triangle-exclamation"
        />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">Each code works exactly once</p>
          <p className="text-xs leading-relaxed text-muted">
            Once you use a code, it's gone. Rotate the set anytime — the previous codes stop working
            the moment you generate new ones.
          </p>
        </div>
      </div>

      {codes === null ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-secondary text-muted">
            <Iconify className="size-5" icon="eye-slash" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Codes are hidden</p>
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              Click "Show codes" to reveal the current set. We only fetch them when you ask.
            </p>
          </div>
          <Button isPending={isLoading} onPress={handleShow} size="sm" variant="primary">
            <Iconify className="size-4" icon="eye" />
            Show codes
          </Button>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {codes.map((code) => (
              <code
                key={code}
                className="rounded-md bg-surface-secondary px-2 py-1.5 text-center font-mono text-xs tracking-wider text-foreground"
              >
                {code}
              </code>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button onPress={handleCopy} size="sm" variant="secondary">
              <Iconify className="size-4" icon="copy" />
              Copy all
            </Button>
            <Button onPress={handleDownload} size="sm" variant="secondary">
              <Iconify className="size-4" icon="download" />
              Download .txt
            </Button>
            <Button isPending={isRotating} onPress={handleRotate} size="sm" variant="danger">
              <Iconify className="size-4" icon="arrows-rotate-left" />
              Generate new codes
            </Button>
          </div>
        </div>
      )}

      {codes !== null && error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
